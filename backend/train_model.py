"""
Train RandomForestClassifier for Transfer Recommendation using the current SQLite database.
"""
import os
import json
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, confusion_matrix, classification_report
import joblib
import sqlite3

DB_PATH = os.path.join(os.path.dirname(__file__), "shixo.db")
MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")


def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def train():
    print("Loading data from SQLite database...")
    conn = get_db_connection()
    rows = conn.execute("SELECT * FROM teachers").fetchall()
    conn.close()

    if not rows:
        raise RuntimeError("No teacher data found in the database.")

    teachers_df = pd.DataFrame([dict(row) for row in rows])
    teachers_df["subject"] = teachers_df["subject"].astype(str)

    def compute_priority(row):
        score = 0
        if row.get("transfer_request", 0) == 1:
            score += 30
        if row.get("medical_condition", 0) == 1:
            score += 25
        if row.get("years_of_service", 0) >= 5:
            score += 15
        if row.get("years_in_current_school", 0) >= 3:
            score += 20
        if row.get("promotion_due", 0) == 1:
            score += 10
        if row.get("years_of_service", 0) >= 10:
            score += 10
        if row.get("spouse_distance", 0) > 200:
            score += 20

        if row.get("years_in_current_school", 0) < 3:
            score = max(score - 40, 0)

        return min(score, 100)

    feature_cols = [
        "years_of_service", "years_in_current_school",
        "transfer_request", "medical_condition", "spouse_distance", "promotion_due"
    ]

    le_subject = LabelEncoder()
    teachers_df["subject_encoded"] = le_subject.fit_transform(teachers_df["subject"])
    feature_cols.append("subject_encoded")

    X = teachers_df[feature_cols].fillna(0)
    y = teachers_df.apply(compute_priority, axis=1).apply(lambda score: 1 if score >= 45 else 0)

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    print("Training RandomForestClassifier...")
    model = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    cm = confusion_matrix(y_test, y_pred)

    print(f"\nModel Accuracy: {acc*100:.2f}%")
    print(f"\nConfusion Matrix:\n{cm}")
    print(f"\nClassification Report:\n{classification_report(y_test, y_pred)}")

    os.makedirs(MODEL_DIR, exist_ok=True)
    joblib.dump(model, os.path.join(MODEL_DIR, "transfer_model.pkl"))
    joblib.dump(le_subject, os.path.join(MODEL_DIR, "label_encoder_subject.pkl"))
    joblib.dump(feature_cols, os.path.join(MODEL_DIR, "feature_cols.pkl"))

    metrics = {
        "accuracy": round(acc * 100, 2),
        "confusion_matrix": cm.tolist(),
        "feature_importance": dict(zip(feature_cols, model.feature_importances_.tolist()))
    }
    with open(os.path.join(MODEL_DIR, "metrics.json"), "w") as f:
        json.dump(metrics, f)

    print("\nModel saved to models/transfer_model.pkl")
    return metrics


if __name__ == "__main__":
    train()
