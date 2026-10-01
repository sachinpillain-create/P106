"""
Stage A baseline trainer — PRD Section 18: "CPU baseline using TF-IDF +
linear classifier. This provides an always-available benchmark."

Run this once to produce models/baseline_tfidf.joblib. It works with zero
GPU/network dependency, and the inference module (inference.py) always
falls back to this model if a transformer/CUDA is unavailable.

Usage:
    python -m backend.ml.train_baseline --data data/sample_dataset.csv
"""
import argparse
import json
import os

import joblib
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix

MODEL_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "models"
)
MODEL_PATH = os.path.join(MODEL_DIR, "baseline_tfidf.joblib")
METRICS_PATH = os.path.join(MODEL_DIR, "baseline_metrics.json")


def train(data_csv_path: str, text_column: str = "text", label_column: str = "label"):
    os.makedirs(MODEL_DIR, exist_ok=True)

    df = pd.read_csv(data_csv_path)
    df = df.dropna(subset=[text_column, label_column])

    X_train, X_test, y_train, y_test = train_test_split(
        df[text_column], df[label_column], test_size=0.25, random_state=42,
        stratify=df[label_column] if df[label_column].nunique() > 1 else None,
    )

    vectorizer = TfidfVectorizer(max_features=5000, ngram_range=(1, 2), min_df=1)
    X_train_vec = vectorizer.fit_transform(X_train)
    X_test_vec = vectorizer.transform(X_test)

    clf = LogisticRegression(max_iter=1000, class_weight="balanced")
    clf.fit(X_train_vec, y_train)

    y_pred = clf.predict(X_test_vec)
    report = classification_report(y_test, y_pred, output_dict=True, zero_division=0)
    cm = confusion_matrix(y_test, y_pred).tolist()

    joblib.dump({"vectorizer": vectorizer, "classifier": clf, "classes": list(clf.classes_)}, MODEL_PATH)

    with open(METRICS_PATH, "w") as f:
        json.dump({"classification_report": report, "confusion_matrix": cm,
                    "labels_order": sorted(df[label_column].unique().tolist())}, f, indent=2)

    print(f"Saved model to {MODEL_PATH}")
    print(f"Saved metrics to {METRICS_PATH}")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", default=os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "sample_dataset.csv"
    ))
    parser.add_argument("--text-column", default="text")
    parser.add_argument("--label-column", default="label")
    args = parser.parse_args()
    train(args.data, args.text_column, args.label_column)
