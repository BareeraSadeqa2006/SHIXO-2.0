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
    """
    Wrapper that invokes the shared expansion helper in `database.py`.
    Run: python expand_teachers.py
    """

    from database import init_db, expand_teachers_to_target, TARGET_TEACHERS


    def main():
        try:
            init_db()
        except Exception:
            pass
        expand_teachers_to_target(TARGET_TEACHERS)


    if __name__ == '__main__':
        main()
    schools = c.execute("SELECT * FROM schools").fetchall()
