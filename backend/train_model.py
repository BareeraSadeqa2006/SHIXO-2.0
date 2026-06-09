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
        # Keep a policy-derived score for label synthesis. This is transparent and used only for training labels.
        score = 0
        if row.get("transfer_request", 0) == 1:
            score += 30
        if row.get("medical_condition", 0) == 1:
            score += 30
        if row.get("years_of_service", 0) >= 5:
            score += 12
        if row.get("years_in_current_school", 0) >= 3:
            score += 18
        if row.get("promotion_due", 0) == 1:
            score += 8
        if row.get("years_of_service", 0) >= 10:
            score += 8
        if row.get("spouse_distance", 0) > 200:
            score += 20

        # Penalize very low tenure strongly
        if row.get("years_in_current_school", 0) < 3:
            score = max(score - 50, 0)

        # Boost if subject vacancy exists or school shortage exists
        if row.get("subject_vacancy", 0) > 0:
            score += 15
        if row.get("shortage", 0) > 0:
            score += 10

        return min(score, 100)

    # Enrich with school-level features by joining with schools table (normalized join)
    conn = get_db_connection()
    schools = conn.execute("SELECT * FROM schools").fetchall()
    conn.close()
    schools_df = pd.DataFrame([dict(s) for s in schools])

    # Ensure expected school columns exist; if missing, add with safe defaults
    expected_school_cols = ['school_id', 'student_strength', 'current_teacher_count', 'required_teacher_count', 'student_teacher_ratio', 'subject_wise_vacancy', 'school_name', 'mandal', 'district']
    for col in expected_school_cols:
        if col not in schools_df.columns:
            schools_df[col] = None

    # Join logic: left join teachers -> schools using teacher.current_school == schools.school_id
    # This preserves DB normalization by not copying school attributes into the teachers table.
    teachers_df = teachers_df.merge(
        schools_df[expected_school_cols],
        left_on='current_school',
        right_on='school_id',
        how='left',
    )

    # If the join didn't populate `mandal`/`district`, fall back to teacher-level `current_mandal`/`current_district`.
    if 'mandal' not in teachers_df.columns and 'current_mandal' in teachers_df.columns:
        teachers_df['mandal'] = teachers_df['current_mandal']
    if 'district' not in teachers_df.columns and 'current_district' in teachers_df.columns:
        teachers_df['district'] = teachers_df['current_district']

    # If mandal/district are present but contain nulls, use teacher current_mandal/current_district
    if 'mandal' in teachers_df.columns:
        teachers_df['mandal'] = teachers_df['mandal'].fillna(teachers_df.get('current_mandal'))
    if 'district' in teachers_df.columns:
        teachers_df['district'] = teachers_df['district'].fillna(teachers_df.get('current_district'))

    # Remove the duplicated school_id column from the merge to avoid confusion
    if 'school_id' in teachers_df.columns:
        teachers_df.drop(columns=['school_id'], inplace=True)

    # Vacancy and shortage features
    def extract_subject_vacancy(row):
        try:
            vac = json.loads(row.get('subject_wise_vacancy') or '{}')
            return int(vac.get(row.get('subject'), 0))
        except Exception:
            return 0

    teachers_df['subject_vacancy'] = teachers_df.apply(extract_subject_vacancy, axis=1)
    teachers_df['shortage'] = (teachers_df['required_teacher_count'].fillna(0) - teachers_df['current_teacher_count'].fillna(0)).apply(lambda x: max(0, int(x)))

    # Categorical encodings
    le_subject = LabelEncoder()
    teachers_df['subject_encoded'] = le_subject.fit_transform(teachers_df['subject'].astype(str))
    le_mandal = LabelEncoder()
    teachers_df['mandal_enc'] = le_mandal.fit_transform(teachers_df['mandal'].astype(str))
    le_district = LabelEncoder()
    teachers_df['district_enc'] = le_district.fit_transform(teachers_df['district'].astype(str))
    # derive school category by student strength
    def school_category(n):
        if n < 300:
            return 'small'
        if n < 800:
            return 'medium'
        return 'large'

    teachers_df['school_category'] = teachers_df['student_strength'].fillna(0).apply(school_category)
    le_cat = LabelEncoder()
    teachers_df['school_cat_enc'] = le_cat.fit_transform(teachers_df['school_category'])

    feature_cols = [
        'years_of_service', 'years_in_current_school', 'transfer_request', 'medical_condition',
        'spouse_distance', 'promotion_due', 'subject_encoded', 'subject_vacancy', 'shortage',
        'student_teacher_ratio', 'school_cat_enc', 'mandal_enc', 'district_enc'
    ]

    X = teachers_df[feature_cols].fillna(0)
    y = teachers_df.apply(compute_priority, axis=1).apply(lambda score: 1 if score >= 50 else 0)

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
    # save encoders for mandal/district/category
    joblib.dump(le_mandal, os.path.join(MODEL_DIR, "label_encoder_mandal.pkl"))
    joblib.dump(le_district, os.path.join(MODEL_DIR, "label_encoder_district.pkl"))
    joblib.dump(le_cat, os.path.join(MODEL_DIR, "label_encoder_schoolcat.pkl"))

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
