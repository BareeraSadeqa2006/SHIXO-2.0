"""
Expand teachers in the SQLite database to approximately 5000 teachers.
This script uses weighted distribution based on school student strength and current staffing.
It ensures unique IDs, hashed passwords, realistic dates, ages, subjects, genders.
Run: python expand_teachers.py
"""
import random
import sqlite3
from datetime import datetime, timedelta
from pathlib import Path
import json

from database import get_db, hash_password, SUBJECTS, FIRST_NAMES_M, FIRST_NAMES_F, LAST_NAMES, MANDALS

TARGET_TOTAL = 5000
TODAY = datetime.now()
DB = Path(__file__).resolve().parent / 'shixo.db'

random.seed(42)

def next_teacher_id(cursor):
    row = cursor.execute("SELECT teacher_id FROM teachers ORDER BY teacher_id DESC LIMIT 1").fetchone()
    if not row:
        return 1
    try:
        return int(row[0][3:]) + 1
    except Exception:
        return 1


def random_past_date(years):
    days = max(0, years * 365 + random.randint(0, 364))
    return (TODAY - timedelta(days=days)).strftime("%Y-%m-%d")


def main():
    # ensure DB schema is migrated
    try:
        from database import init_db
        init_db()
    except Exception:
        pass

    conn = get_db()
    c = conn.cursor()

    total_existing = c.execute("SELECT COUNT(*) FROM teachers").fetchone()[0]
    print('Existing teachers:', total_existing)

    schools = c.execute("SELECT * FROM schools").fetchall()
    school_list = [dict(s) for s in schools]

    # Determine desired teacher counts based on school size (student_strength)
    desired_map = {}
    for s in school_list:
        strength = s['student_strength'] or 0
        # categorize by student_strength
        if strength < 300:
            low, high = 3, 8
        elif strength < 800:
            low, high = 8, 15
        else:
            low, high = 15, 30
        # bias toward current need
        current = s['current_teacher_count'] or 0
        desired = random.randint(low, high)
        # ensure we don't reduce existing counts
        if desired < current:
            desired = current
        desired_map[s['school_id']] = desired

    # Compute teachers to add per school
    to_add_total = max(0, TARGET_TOTAL - total_existing)
    print('Need to add', to_add_total, 'teachers')

    # Distribute remaining teachers proportionally to school student_strength
    strengths = [s['student_strength'] or 0 for s in school_list]
    total_strength = sum(max(1, st) for st in strengths)

    additions = {s['school_id']: max(0, desired_map[s['school_id']] - (s['current_teacher_count'] or 0)) for s in school_list}
    allocated = sum(additions.values())

    remaining = to_add_total - allocated
    if remaining > 0:
        # allocate by strength
        for s in school_list:
            share = int((max(1, s['student_strength']) / total_strength) * remaining)
            additions[s['school_id']] += share
        # correct rounding
        cur = sum(additions.values())
        i = 0
        while cur < to_add_total:
            sid = school_list[i % len(school_list)]['school_id']
            additions[sid] += 1
            cur += 1
            i += 1

    # Start inserting
    next_id = next_teacher_id(c)
    inserted = 0
    for s in school_list:
        sid = s['school_id']
        add_count = additions.get(sid, 0)
        for _ in range(add_count):
            tid_num = next_id
            tid = f"TCH{tid_num:05d}"
            gender = random.choice(['Male', 'Female'])
            name_first = random.choice(FIRST_NAMES_M) if gender == 'Male' else random.choice(FIRST_NAMES_F)
            name = f"{name_first} {random.choice(LAST_NAMES)}"
            subject = random.choice(SUBJECTS)
            # Years of service between 1 and 35, bias towards 5-20
            yos = random.choices(range(1, 36), weights=[1]*4 + [3]*6 + [2]*10 + [1]*15, k=1)[0]
            # years in current school <= yos
            yics = random.randint(0, min( yos, 10 ))
            if yics > yos:
                yics = yos
            date_of_first_appointment = random_past_date(yos)
            date_joined_current_school = random_past_date(yics) if yics > 0 else date_of_first_appointment
            last_transfer_date = date_joined_current_school if yics < yos else None
            medical = 1 if random.random() < 0.04 else 0
            spouse = random.randint(0, 500)
            promo = 1 if random.random() < 0.08 else 0
            status = random.choice(['Active']*8 + ['On Leave']*1)
            age = 22 + yos + random.randint(0,8)
            password_plain = f"tch{tid_num:05d}"
            pw = hash_password(password_plain)
            meo_row = c.execute("SELECT meo_id FROM meos WHERE assigned_mandal = ? LIMIT 1", (s['mandal'],)).fetchone()
            meo_id = meo_row[0] if meo_row else None

            c.execute(
                "INSERT OR IGNORE INTO teachers (teacher_id, password, role, age, name, gender, subject, current_school, current_mandal, mandal, date_of_first_appointment, date_joined_current_school, years_of_service, years_in_current_school, rural_service_years, transfer_request, medical_condition, spouse_distance, promotion_due, current_status, assigned_meo, requested_school, transfer_status, notification_status, last_transfer_date, reapply_eligible, transfer_attempt_count) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                (tid, pw, 'teacher', age, name, gender, subject, sid, s['mandal'], s['mandal'], date_of_first_appointment, date_joined_current_school, yos, yics, 0, 0, medical, spouse, promo, status, meo_id, None, 'None', '', last_transfer_date, 1, 0)
            )
            next_id += 1
            inserted += 1

        # update school counts
        if add_count > 0:
            c.execute("UPDATE schools SET current_teacher_count = current_teacher_count + ? WHERE school_id = ?", (add_count, sid))
            # recalc ratio
            srow = c.execute("SELECT student_strength, current_teacher_count FROM schools WHERE school_id = ?", (sid,)).fetchone()
            if srow:
                ratio = round(srow[0] / max(srow[1], 1), 2)
                c.execute("UPDATE schools SET student_teacher_ratio = ? WHERE school_id = ?", (ratio, sid))

    conn.commit()
    conn.close()
    print('Inserted', inserted, 'teachers')

if __name__ == '__main__':
    main()
