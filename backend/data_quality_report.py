import sqlite3, json
import pandas as pd

conn=sqlite3.connect('backend/shixo.db')
conn.row_factory = sqlite3.Row
rows = conn.execute('SELECT * FROM teachers').fetchall()
teachers = pd.DataFrame([dict(r) for r in rows])
s = conn.execute('SELECT * FROM schools').fetchall()
schools = pd.DataFrame([dict(r) for r in s])
conn.close()

# Merge same as training
expected_school_cols = ['school_id', 'student_strength', 'current_teacher_count', 'required_teacher_count', 'student_teacher_ratio', 'subject_wise_vacancy', 'school_name', 'mandal', 'district']
for col in expected_school_cols:
    if col not in schools.columns:
        schools[col] = None

teachers = teachers.merge(schools[expected_school_cols], left_on='current_school', right_on='school_id', how='left')

# derive features

def extract_subject_vacancy(row):
    try:
        vac = json.loads(row.get('subject_wise_vacancy') or '{}')
        return int(vac.get(row.get('subject'), 0))
    except Exception:
        return 0

teachers['subject_vacancy'] = teachers.apply(extract_subject_vacancy, axis=1)
teachers['shortage'] = (teachers['required_teacher_count'].fillna(0) - teachers['current_teacher_count'].fillna(0)).apply(lambda x: max(0, int(x)))

n = len(teachers)
print('teachers_total', n)
print('pct_subject_vacancy_gt0', round(100 * (teachers['subject_vacancy']>0).sum()/n,2))
print('pct_shortage_gt0', round(100 * (teachers['shortage']>0).sum()/n,2))
print('pct_years_in_current_school_lt3', round(100 * (teachers['years_in_current_school']<3).sum()/n,2))
print('spouse_distance_mean', round(teachers['spouse_distance'].fillna(0).mean(),2))
print('spouse_distance_median', round(teachers['spouse_distance'].fillna(0).median(),2))
print('subject_unique_count', teachers['subject'].nunique())
print('missing_student_teacher_ratio', teachers['student_teacher_ratio'].isna().sum())
print('missing_student_strength', teachers['student_strength'].isna().sum())

