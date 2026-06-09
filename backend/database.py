"""
SQLite Database Setup for SHIXO - Government Teacher Transfer Management
"""
import sqlite3
import os
import json
import random
import hashlib
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
import math

DB_PATH = os.path.join(os.path.dirname(__file__), "shixo.db")

MANDALS = [
    "Hyderabad East", "Hyderabad West", "Secunderabad", "Rangareddy North",
    "Rangareddy South", "Medchal", "Shamirpet", "Keesara", "Ghatkesar",
    "Uppal", "LB Nagar", "Rajendranagar", "Serilingampally", "Kukatpally",
    "Quthbullapur", "Patancheru", "Sangareddy", "Medak", "Siddipet",
    "Karimnagar"
]

DISTRICTS = [
    "Hyderabad", "Rangareddy", "Medchal-Malkajgiri", "Sangareddy",
    "Medak", "Siddipet", "Karimnagar"
]

MANDAL_DISTRICT_MAP = {
    "Hyderabad East": "Hyderabad",
    "Hyderabad West": "Hyderabad",
    "Secunderabad": "Hyderabad",
    "Rangareddy North": "Rangareddy",
    "Rangareddy South": "Rangareddy",
    "Medchal": "Medchal-Malkajgiri",
    "Shamirpet": "Medchal-Malkajgiri",
    "Keesara": "Medchal-Malkajgiri",
    "Ghatkesar": "Medchal-Malkajgiri",
    "Uppal": "Medchal-Malkajgiri",
    "LB Nagar": "Rangareddy",
    "Rajendranagar": "Rangareddy",
    "Serilingampally": "Rangareddy",
    "Kukatpally": "Medchal-Malkajgiri",
    "Quthbullapur": "Medchal-Malkajgiri",
    "Patancheru": "Sangareddy",
    "Sangareddy": "Sangareddy",
    "Medak": "Medak",
    "Siddipet": "Siddipet",
    "Karimnagar": "Karimnagar",
}

SUBJECTS = [
    "Mathematics", "Science", "English", "Hindi", "Telugu",
    "Social Science", "Physics", "Chemistry", "Biology",
    "Computer Science", "Physical Education"
]

FIRST_NAMES_M = [
    "Rajesh", "Amit", "Vikram", "Suresh", "Deepak", "Arun", "Sanjay",
    "Ramesh", "Mahesh", "Vinod", "Ashok", "Dinesh", "Naresh", "Pankaj",
    "Yogesh", "Mukesh", "Harish", "Sunil", "Vikas", "Ajay",
    "Ravi", "Mohan", "Krishna", "Srikanth", "Venkat", "Prasad"
]
FIRST_NAMES_F = [
    "Priya", "Sunita", "Anita", "Kavita", "Meena", "Pooja", "Nita",
    "Geeta", "Seema", "Rekha", "Usha", "Shanti", "Lakshmi", "Radha",
    "Savita", "Pushpa", "Kamla", "Devika", "Saroj", "Padma",
    "Swathi", "Divya", "Anusha", "Lavanya", "Sravani", "Bhavani"
]
LAST_NAMES = [
    "Sharma", "Verma", "Gupta", "Singh", "Kumar", "Reddy", "Rao",
    "Naidu", "Chary", "Prasad", "Murthy", "Varma", "Goud",
    "Yadav", "Mishra", "Tiwari", "Joshi", "Pandey", "Shukla",
    "Patel", "Iyer", "Nair", "Pillai", "Menon"
]

SCHOOL_TYPES = [
    "Govt. Primary School", "Govt. Upper Primary School",
    "Govt. High School", "Govt. Senior Secondary School",
    "Zilla Parishad High School", "Mandal Parishad Primary School"
]

REJECTION_REASONS = [
    "No vacancy available at requested school",
    "Current school has teacher shortage",
    "Low priority score - does not meet threshold",
    "Minimum service period not completed",
    "Subject requirement conflict at requested school",
    "Policy constraints - transfer freeze period active"
]


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db():
    conn = get_db()
    c = conn.cursor()

    c.executescript("""
    CREATE TABLE IF NOT EXISTS schools (
        school_id TEXT PRIMARY KEY,
        school_name TEXT NOT NULL,
        mandal TEXT NOT NULL,
        district TEXT NOT NULL,
        student_strength INTEGER DEFAULT 0,
        current_teacher_count INTEGER DEFAULT 0,
        required_teacher_count INTEGER DEFAULT 0,
        student_teacher_ratio REAL DEFAULT 0,
        subject_wise_vacancy TEXT DEFAULT '{}'
    );

    CREATE TABLE IF NOT EXISTS meos (
        meo_id TEXT PRIMARY KEY,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'meo',
        name TEXT NOT NULL,
        assigned_mandal TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS teachers (
        teacher_id TEXT PRIMARY KEY,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'teacher',
        age INTEGER,
        name TEXT NOT NULL,
        gender TEXT,
        subject TEXT,
        current_school TEXT REFERENCES schools(school_id),
        current_mandal TEXT,
        current_district TEXT,
        mandal TEXT,
        date_of_first_appointment TEXT,
        date_joined_current_school TEXT,
        years_of_service INTEGER DEFAULT 0,
        years_in_current_school INTEGER DEFAULT 0,
        rural_service_years INTEGER DEFAULT 0,
        transfer_request INTEGER DEFAULT 0,
        medical_condition INTEGER DEFAULT 0,
        spouse_distance INTEGER DEFAULT 0,
        promotion_due INTEGER DEFAULT 0,
        current_status TEXT DEFAULT 'Active',
        assigned_meo TEXT REFERENCES meos(meo_id),
        requested_school TEXT,
        transfer_status TEXT DEFAULT 'None',
        notification_status TEXT DEFAULT '',
        last_transfer_date TEXT,
        reapply_eligible INTEGER DEFAULT 1,
        transfer_attempt_count INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS transfer_requests (
        request_id TEXT PRIMARY KEY,
        teacher_id TEXT REFERENCES teachers(teacher_id),
        current_school TEXT,
        requested_school TEXT,
        mandal TEXT,
        request_date TEXT,
        transfer_reason TEXT,
        priority_score REAL DEFAULT 0,
        status TEXT DEFAULT 'Pending',
        assigned_meo TEXT,
        approval_date TEXT,
        rejection_reason TEXT,
        generated_pdf_path TEXT
    );

    CREATE TABLE IF NOT EXISTS transfer_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        teacher_id TEXT REFERENCES teachers(teacher_id),
        request_id TEXT,
        old_school TEXT,
        new_school TEXT,
        transfer_date TEXT,
        transfer_reason TEXT,
        approved_by TEXT REFERENCES meos(meo_id),
        priority_score REAL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        teacher_id TEXT REFERENCES teachers(teacher_id),
        message TEXT NOT NULL,
        type TEXT DEFAULT 'info',
        read INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS appeals (
        appeal_id TEXT PRIMARY KEY,
        teacher_id TEXT REFERENCES teachers(teacher_id),
        original_request_id TEXT REFERENCES transfer_requests(request_id),
        appeal_reason TEXT NOT NULL,
        appeal_type TEXT DEFAULT 'standard',
        is_emergency INTEGER DEFAULT 0,
        status TEXT DEFAULT 'Pending',
        submitted_date TEXT,
        reviewed_date TEXT,
        reviewed_by TEXT,
        review_notes TEXT,
        assigned_meo TEXT REFERENCES meos(meo_id),
        mandal TEXT
    );
    
    CREATE TABLE IF NOT EXISTS meo_notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        meo_id TEXT REFERENCES meos(meo_id),
        message TEXT NOT NULL,
        read INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now'))
    );
    """)

    # Ensure legacy installs are upgraded safely
    existing_cols = {row[1] for row in c.execute("PRAGMA table_info(teachers)").fetchall()}
    if 'current_mandal' not in existing_cols:
        c.execute("ALTER TABLE teachers ADD COLUMN current_mandal TEXT")
    if 'years_in_current_school' not in existing_cols:
        c.execute("ALTER TABLE teachers ADD COLUMN years_in_current_school INTEGER DEFAULT 0")
    if 'date_of_first_appointment' not in existing_cols:
        c.execute("ALTER TABLE teachers ADD COLUMN date_of_first_appointment TEXT")
    if 'date_joined_current_school' not in existing_cols:
        c.execute("ALTER TABLE teachers ADD COLUMN date_joined_current_school TEXT")
    if 'age' not in existing_cols:
        try:
            c.execute("ALTER TABLE teachers ADD COLUMN age INTEGER DEFAULT NULL")
        except Exception:
            pass

    # Backfill service dates for legacy rows using existing year values when possible.
    for row in c.execute(
        "SELECT teacher_id, years_of_service, years_in_current_school, last_transfer_date, date_of_first_appointment, date_joined_current_school FROM teachers"
    ).fetchall():
        updates = []
        teacher_id = row[0]
        years_of_service = row[1] or 0
        years_in_current_school = row[2] or 0
        last_transfer_date = row[3]
        appointment_date = row[4]
        join_date = row[5]

        if not appointment_date and years_of_service > 0:
            derived_appointment = (datetime.now() - timedelta(days=years_of_service * 365)).strftime("%Y-%m-%d")
            updates.append(("date_of_first_appointment", derived_appointment))

        if not join_date:
            if last_transfer_date:
                derived_join = last_transfer_date
            elif years_in_current_school > 0:
                derived_join = (datetime.now() - timedelta(days=years_in_current_school * 365)).strftime("%Y-%m-%d")
            elif appointment_date:
                derived_join = appointment_date
            else:
                derived_join = None

            if derived_join:
                updates.append(("date_joined_current_school", derived_join))

        if updates:
            set_clause = ", ".join([f"{col} = ?" for col, _ in updates])
            values = [val for _, val in updates] + [teacher_id]
            c.execute(f"UPDATE teachers SET {set_clause} WHERE teacher_id = ?", values)

    conn.commit()
    conn.close()


def seed_db():
    conn = get_db()
    c = conn.cursor()

    existing = c.execute("SELECT COUNT(*) FROM schools").fetchone()[0]
    if existing > 0:
        conn.close()
        return

    random.seed(42)

    # Seed schools - ~25 per mandal
    school_id_counter = 1
    all_schools = []
    for mandal in MANDALS:
        district = MANDAL_DISTRICT_MAP[mandal]
        n_schools = random.randint(20, 30)
        for _ in range(n_schools):
            sid = f"SCH{school_id_counter:04d}"
            stype = random.choice(SCHOOL_TYPES)
            sname = f"{stype} {mandal.split()[0]}-{school_id_counter}"
            strength = random.randint(100, 1500)
            required = max(4, strength // 30)
            current = max(2, required + random.randint(-5, 6))
            ratio = round(strength / max(current, 1), 2)
            vacancies = {}
            for subj in random.sample(SUBJECTS, random.randint(2, 5)):
                vacancies[subj] = random.randint(0, 3)

            all_schools.append((
                sid, sname, mandal, district, strength,
                current, required, ratio, json.dumps(vacancies)
            ))
            school_id_counter += 1

    c.executemany(
        "INSERT INTO schools VALUES (?,?,?,?,?,?,?,?,?)",
        all_schools
    )

    # Seed MEOs - 1 per mandal
    meos = []
    for i, mandal in enumerate(MANDALS, 1):
        mid = f"MEO{i:03d}"
        gender = random.choice(["M", "F"])
        if gender == "M":
            fname = random.choice(FIRST_NAMES_M)
        else:
            fname = random.choice(FIRST_NAMES_F)
        lname = random.choice(LAST_NAMES)
        meos.append((
            mid, hash_password(f"meo{i:03d}"), "meo",
            f"{fname} {lname}", mandal
        ))
    c.executemany("INSERT INTO meos VALUES (?,?,?,?,?)", meos)

    # Build MEO lookup by mandal
    meo_by_mandal = {m[4]: m[0] for m in meos}

    # Seed teachers - ~500 total spread across mandals
    teacher_id_counter = 1
    school_ids_by_mandal = {}
    for s in all_schools:
        m = s[2]
        if m not in school_ids_by_mandal:
            school_ids_by_mandal[m] = []
        school_ids_by_mandal[m].append((s[0], s[1]))

    today = datetime.now()

    def random_past_date(years: int) -> str:
        days = max(0, years * 365 + random.randint(0, 364))
        return (today - timedelta(days=days)).strftime("%Y-%m-%d")

    all_teachers = []
    for mandal in MANDALS:
        n_teachers = random.randint(20, 30)
        schools_in_mandal = school_ids_by_mandal[mandal]
        meo_id = meo_by_mandal[mandal]

        for _ in range(n_teachers):
            tid = f"TCH{teacher_id_counter:05d}"
            gender = random.choice(["Male", "Female"])
            if gender == "Male":
                fname = random.choice(FIRST_NAMES_M)
            else:
                fname = random.choice(FIRST_NAMES_F)
            lname = random.choice(LAST_NAMES)
            subject = random.choice(SUBJECTS)
            school = random.choice(schools_in_mandal)
            yos = random.randint(1, 30)
            rural = random.randint(0, min(yos, 12))
            tr = random.choice([0, 1])
            med = random.choice([0, 0, 0, 0, 1])
            spouse = random.randint(0, 400)
            promo = random.choice([0, 0, 1])
            status = random.choice(["Active", "Active", "Active", "On Leave"])

            years_in_school = random.randint(0, min(5, yos))
            date_of_first_appointment = random_past_date(yos)
            date_joined_current_school = random_past_date(years_in_school)
            last_transfer_date = date_joined_current_school if years_in_school < yos else None

            all_teachers.append((
                tid, hash_password(f"tch{teacher_id_counter:05d}"),
                "teacher", f"{fname} {lname}", gender, subject,
                school[0], mandal, mandal,
                date_of_first_appointment, date_joined_current_school,
                yos, years_in_school, rural, tr, med, spouse,
                promo, status, meo_id, None, "None", "",
                last_transfer_date, 1, 0
            ))
            teacher_id_counter += 1

    c.executemany(
        "INSERT INTO teachers (teacher_id, password, role, name, gender, subject, current_school, current_mandal, mandal, date_of_first_appointment, date_joined_current_school, years_of_service, years_in_current_school, rural_service_years, transfer_request, medical_condition, spouse_distance, promotion_due, current_status, assigned_meo, requested_school, transfer_status, notification_status, last_transfer_date, reapply_eligible, transfer_attempt_count) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
        all_teachers
    )

    conn.commit()
    conn.close()
    print(f"Seeded {len(all_schools)} schools, {len(meos)} MEOs, {len(all_teachers)} teachers")


IST = ZoneInfo('Asia/Kolkata')


def ist_now_str(fmt: str = "%Y-%m-%d %H:%M %Z") -> str:
    """Return current time in IST as formatted string."""
    return datetime.now(IST).strftime(fmt)


def compute_expected_teachers(student_strength: int) -> int:
    """Compute expected number of teachers for a school based on student strength.

    Heuristics (by size):
      - small (<300): target ratio ~26
      - medium (<800): target ratio ~28
      - large: target ratio ~30

    Returns the ceiling of students / target_ratio, minimum 1.
    """
    if not student_strength:
        return 0
    if student_strength < 300:
        ratio = 26
    elif student_strength < 800:
        ratio = 28
    else:
        ratio = 30
    return max(1, math.ceil(student_strength / ratio))


def compute_shortage_for_school(school_row) -> int:
    """Given a school row (dict or sqlite3.Row), compute shortage as expected - current (>=0)."""
    try:
        s = dict(school_row) if not isinstance(school_row, dict) else school_row
        expected = compute_expected_teachers(s.get('student_strength') or 0)
        current = int(s.get('current_teacher_count') or 0)
        return max(0, expected - current)
    except Exception:
        return 0
