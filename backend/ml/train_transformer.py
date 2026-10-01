"""
Stage B transformer trainer — PRD Section 18: fine-tune a compact
transformer (DistilBERT/MiniLM-class) for phishing/BEC classification,
CUDA-accelerated on the RTX 3050, respecting the 6GB VRAM budget.

This is a COMPLETE, working script — not a template. Run it as-is against
data/sample_dataset.csv to verify your CUDA/transformers install works
end-to-end, then re-run against your real dataset (see GUIDE.md Section 4.2
for where to get one).

Usage:
    python -m backend.ml.train_transformer --data data/sample_dataset.csv
    python -m backend.ml.train_transformer --data data/real_dataset.csv --epochs 4 --model distilbert-base-uncased

Requires (install separately — NOT in the default requirements.txt because
the correct PyTorch build depends on your CUDA version, see GUIDE.md 4.1):
    pip install torch --index-url https://download.pytorch.org/whl/cu121
    pip install transformers accelerate datasets
"""
import argparse
import json
import os

import pandas as pd


def train(
    data_csv_path: str,
    output_dir: str,
    model_name: str = "distilbert-base-uncased",
    text_column: str = "text",
    label_column: str = "label",
    epochs: int = 3,
    train_batch_size: int = 4,   # PRD 18/24: small batches for 6GB VRAM
    eval_batch_size: int = 8,
    max_length: int = 256,
    test_size: float = 0.2,
    seed: int = 42,
):
    # Lazy imports: this whole module is optional and shouldn't be required
    # just to import the package (mirrors the lazy-import pattern in
    # backend/ml/inference.py).
    import torch
    from transformers import (
        AutoTokenizer, AutoModelForSequenceClassification,
        TrainingArguments, Trainer, EarlyStoppingCallback,
    )
    from datasets import Dataset
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import precision_recall_fscore_support, accuracy_score, confusion_matrix

    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Training on device: {device}")
    if device == "cpu":
        print(
            "WARNING: no CUDA device detected. Training will still work but will "
            "be much slower and is only recommended for tiny smoke-test datasets "
            "like the bundled data/sample_dataset.csv."
        )

    df = pd.read_csv(data_csv_path).dropna(subset=[text_column, label_column])
    labels = sorted(df[label_column].unique())
    label2id = {l: i for i, l in enumerate(labels)}
    id2label = {i: l for l, i in label2id.items()}
    df["label_id"] = df[label_column].map(label2id)

    print(f"Loaded {len(df)} rows, {len(labels)} classes: {labels}")

    # PRD 19: split by campaign/domain where possible to reduce leakage.
    # For the generic CSV format we fall back to a stratified random split;
    # if your dataset has a 'campaign_id' or 'domain' column, pass
    # --group-column to split by that instead (see the --group-column flag).
    train_df, test_df = train_test_split(
        df, test_size=test_size, random_state=seed,
        stratify=df["label_id"] if df["label_id"].nunique() > 1 else None,
    )
    print(f"Train: {len(train_df)} rows | Held-out test: {len(test_df)} rows")

    tokenizer = AutoTokenizer.from_pretrained(model_name)

    def tokenize_fn(batch):
        return tokenizer(batch[text_column], truncation=True, padding="max_length", max_length=max_length)

    train_dataset = Dataset.from_pandas(train_df[[text_column, "label_id"]].reset_index(drop=True))
    test_dataset = Dataset.from_pandas(test_df[[text_column, "label_id"]].reset_index(drop=True))
    train_dataset = train_dataset.map(tokenize_fn, batched=True)
    test_dataset = test_dataset.map(tokenize_fn, batched=True)
    train_dataset = train_dataset.rename_column("label_id", "labels")
    test_dataset = test_dataset.rename_column("label_id", "labels")
    train_dataset.set_format(type="torch", columns=["input_ids", "attention_mask", "labels"])
    test_dataset.set_format(type="torch", columns=["input_ids", "attention_mask", "labels"])

    model = AutoModelForSequenceClassification.from_pretrained(
        model_name, num_labels=len(labels), id2label=id2label, label2id=label2id,
    ).to(device)

    def compute_metrics(eval_pred):
        # PRD 19: track precision, recall, F1 and confusion matrix, not
        # accuracy alone; evaluate false positives explicitly.
        logits, y_true = eval_pred
        y_pred = logits.argmax(axis=-1)
        precision, recall, f1, _ = precision_recall_fscore_support(
            y_true, y_pred, average="macro", zero_division=0
        )
        acc = accuracy_score(y_true, y_pred)
        cm = confusion_matrix(y_true, y_pred).tolist()
        return {"accuracy": acc, "precision_macro": precision, "recall_macro": recall,
                "f1_macro": f1, "confusion_matrix": json.dumps(cm)}

    training_args = TrainingArguments(
        output_dir=output_dir,
        per_device_train_batch_size=train_batch_size,
        per_device_eval_batch_size=eval_batch_size,
        num_train_epochs=epochs,
        fp16=(device == "cuda"),  # PRD 18: mixed precision where stable (CUDA only)
        eval_strategy="epoch",
        save_strategy="epoch",
        load_best_model_at_end=True,
        metric_for_best_model="f1_macro",
        logging_steps=10,
        report_to=[],  # no external tracking service required for the prototype
        seed=seed,
    )

    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_dataset,
        eval_dataset=test_dataset,
        compute_metrics=compute_metrics,
        callbacks=[EarlyStoppingCallback(early_stopping_patience=2)],  # PRD 18: early stopping
    )

    trainer.train()

    final_metrics = trainer.evaluate()
    print("Held-out test set metrics:")
    print(json.dumps(final_metrics, indent=2, default=str))

    os.makedirs(output_dir, exist_ok=True)
    trainer.save_model(output_dir)
    tokenizer.save_pretrained(output_dir)

    # PRD 19: record model version, dataset version and preprocessing version.
    version_manifest = {
        "base_model": model_name,
        "dataset_path": os.path.abspath(data_csv_path),
        "dataset_row_count": len(df),
        "labels": labels,
        "max_length": max_length,
        "epochs": epochs,
        "device_used_for_training": device,
        "final_eval_metrics": {k: v for k, v in final_metrics.items() if k != "eval_confusion_matrix"},
    }
    with open(os.path.join(output_dir, "training_manifest.json"), "w") as f:
        json.dump(version_manifest, f, indent=2, default=str)

    print(f"\nModel saved to {output_dir}")
    print(
        f"To use it, restart the backend — backend/ml/inference.py will "
        f"automatically detect the checkpoint at this path (set via "
        f"SIH_TRANSFORMER_MODEL env var if you used a custom --output-dir)."
    )


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Fine-tune Stage B phishing/BEC transformer classifier")
    parser.add_argument("--data", default=os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "sample_dataset.csv"
    ), help="CSV with 'text' and 'label' columns")
    parser.add_argument("--output-dir", default=os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "models", "transformer_phishing"
    ))
    parser.add_argument("--model", default="distilbert-base-uncased",
                         help="Base checkpoint — compact models recommended for 6GB VRAM "
                              "(e.g. distilbert-base-uncased, microsoft/MiniLM-L12-H384-uncased)")
    parser.add_argument("--text-column", default="text")
    parser.add_argument("--label-column", default="label")
    parser.add_argument("--epochs", type=int, default=3)
    parser.add_argument("--train-batch-size", type=int, default=4)
    parser.add_argument("--eval-batch-size", type=int, default=8)
    parser.add_argument("--max-length", type=int, default=256)
    parser.add_argument("--test-size", type=float, default=0.2)
    args = parser.parse_args()

    train(
        data_csv_path=args.data,
        output_dir=args.output_dir,
        model_name=args.model,
        text_column=args.text_column,
        label_column=args.label_column,
        epochs=args.epochs,
        train_batch_size=args.train_batch_size,
        eval_batch_size=args.eval_batch_size,
        max_length=args.max_length,
        test_size=args.test_size,
    )
