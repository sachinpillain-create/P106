"""
ML/NLP inference engine — PRD Section 8.5, 18, 23.

This is the module that actually implements the "hybrid CPU+GPU" promise:
  - Stage A (always available): TF-IDF + Logistic Regression on CPU.
  - Stage B (preferred when available): compact transformer
    (DistilBERT/MiniLM-class) with inference on CUDA if the RTX 3050 +
    CUDA-enabled PyTorch are correctly installed.

Device selection is automatic and silent to the caller: `classify()` always
returns a result, and the result tells you which device/model actually ran
so the UI can show "GPU-accelerated" vs "CPU fallback" (PRD 15: gracefully
degrade to CPU/rule-based mode if CUDA or model loading fails).

`torch`/`transformers` are imported lazily so this module — and the whole
backend — still works even before you `pip install torch transformers` on
your laptop. Only Stage B needs them.
"""
import os
import time
from dataclasses import dataclass
from typing import Optional

import joblib

MODEL_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "models"
)
BASELINE_MODEL_PATH = os.path.join(MODEL_DIR, "baseline_tfidf.joblib")

# Set this to a local path or a small HF hub model id once you've chosen /
# fine-tuned one, e.g. "distilbert-base-uncased" as a starting checkpoint
# before fine-tuning on phishing/BEC-labelled data (PRD 18 Stage B).
TRANSFORMER_MODEL_NAME_OR_PATH = os.environ.get(
    "SIH_TRANSFORMER_MODEL", os.path.join(MODEL_DIR, "transformer_phishing")
)


@dataclass
class MLPrediction:
    model_name: str
    model_version: str
    predicted_class: str
    probability: float
    class_probabilities: dict
    device_used: str  # "cuda" or "cpu"
    latency_ms: float
    top_features: Optional[list] = None


class _BaselineModel:
    """Stage A: CPU TF-IDF + Logistic Regression. Lazy-loaded singleton."""
    _instance = None

    def __init__(self):
        if not os.path.exists(BASELINE_MODEL_PATH):
            raise FileNotFoundError(
                f"Baseline model not found at {BASELINE_MODEL_PATH}. "
                "Run: python -m backend.ml.train_baseline"
            )
        bundle = joblib.load(BASELINE_MODEL_PATH)
        self.vectorizer = bundle["vectorizer"]
        self.classifier = bundle["classifier"]
        self.classes = bundle["classes"]

    @classmethod
    def get(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def predict(self, text: str) -> MLPrediction:
        start = time.time()
        vec = self.vectorizer.transform([text])
        proba = self.classifier.predict_proba(vec)[0]
        class_probs = {cls_name: float(p) for cls_name, p in zip(self.classes, proba)}
        predicted_class = max(class_probs, key=class_probs.get)

        # Top contributing terms (explainability — PRD 15: every model result
        # should support "top evidence/features")
        feature_names = self.vectorizer.get_feature_names_out()
        row = vec.tocoo()
        weighted = sorted(
            zip(row.col, row.data), key=lambda x: x[1], reverse=True
        )[:8]
        top_features = [feature_names[i] for i, _ in weighted]

        latency_ms = (time.time() - start) * 1000
        return MLPrediction(
            model_name="tfidf_logreg_baseline",
            model_version="stageA-v1",
            predicted_class=predicted_class,
            probability=class_probs[predicted_class],
            class_probabilities=class_probs,
            device_used="cpu",
            latency_ms=latency_ms,
            top_features=top_features,
        )


class _TransformerModel:
    """
    Stage B: compact transformer classifier, CUDA-accelerated when available.
    Lazy-loaded singleton — only imports torch/transformers when actually
    used, and only if the fine-tuned model directory/checkpoint exists.
    """
    _instance = None
    _load_failed = False

    def __init__(self):
        import torch
        from transformers import AutoTokenizer, AutoModelForSequenceClassification

        if not os.path.isdir(TRANSFORMER_MODEL_NAME_OR_PATH):
            raise FileNotFoundError(
                f"No transformer checkpoint at {TRANSFORMER_MODEL_NAME_OR_PATH}. "
                "Fine-tune one first (see GUIDE.md ML section) or unset "
                "SIH_TRANSFORMER_MODEL to skip Stage B."
            )

        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.tokenizer = AutoTokenizer.from_pretrained(TRANSFORMER_MODEL_NAME_OR_PATH)
        self.model = AutoModelForSequenceClassification.from_pretrained(
            TRANSFORMER_MODEL_NAME_OR_PATH
        ).to(self.device)
        self.model.eval()
        self.torch = torch

        # id2label should be baked into the fine-tuned checkpoint's config
        self.id2label = self.model.config.id2label

    @classmethod
    def get(cls):
        if cls._load_failed:
            raise RuntimeError("Transformer model previously failed to load; using fallback.")
        if cls._instance is None:
            try:
                cls._instance = cls()
            except Exception:
                cls._load_failed = True
                raise
        return cls._instance

    def predict(self, text: str) -> MLPrediction:
        start = time.time()
        inputs = self.tokenizer(
            text, return_tensors="pt", truncation=True, padding=True, max_length=256
        ).to(self.device)

        with self.torch.no_grad():
            outputs = self.model(**inputs)
            probs = self.torch.nn.functional.softmax(outputs.logits, dim=-1)[0]

        # bring result back to CPU for score fusion (PRD 18: "Return
        # probabilities to CPU for score fusion")
        probs_cpu = probs.cpu().tolist()
        class_probs = {self.id2label[i]: float(p) for i, p in enumerate(probs_cpu)}
        predicted_class = max(class_probs, key=class_probs.get)

        latency_ms = (time.time() - start) * 1000
        return MLPrediction(
            model_name="transformer_phishing_classifier",
            model_version="stageB-v1",
            predicted_class=predicted_class,
            probability=class_probs[predicted_class],
            class_probabilities=class_probs,
            device_used=self.device,
            latency_ms=latency_ms,
        )


def classify(text: str, prefer_transformer: bool = True) -> MLPrediction:
    """
    Main entry point. Tries Stage B (transformer, CUDA if available) first
    when a checkpoint exists and prefer_transformer=True; falls back to
    Stage A (CPU TF-IDF baseline) on ANY failure — missing checkpoint,
    missing torch/transformers install, CUDA error, OOM, anything.

    This function must never raise — a failed ML stage should never crash
    the overall analysis (PRD 15 & 21).
    """
    if prefer_transformer:
        try:
            model = _TransformerModel.get()
            return model.predict(text)
        except Exception:
            pass  # silently fall through to baseline

    try:
        model = _BaselineModel.get()
        return model.predict(text)
    except Exception as e:
        # Absolute last resort: return a neutral, clearly-flagged result
        # rather than crashing the whole pipeline.
        return MLPrediction(
            model_name="unavailable",
            model_version="none",
            predicted_class="unknown",
            probability=0.0,
            class_probabilities={},
            device_used="none",
            latency_ms=0.0,
            top_features=[f"ML unavailable: {e}"],
        )
