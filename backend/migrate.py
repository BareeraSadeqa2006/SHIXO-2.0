import os
import shutil
from datetime import datetime

from database import DB_PATH, init_db

BACKUP_DIR = os.path.join(os.path.dirname(__file__), "backups")


def backup_database():
    os.makedirs(BACKUP_DIR, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path = os.path.join(BACKUP_DIR, f"shixo_backup_{timestamp}.db")
    shutil.copy2(DB_PATH, backup_path)
    print(f"Database backup created: {backup_path}")
    return backup_path


def migrate():
    if not os.path.exists(DB_PATH):
        raise FileNotFoundError(f"Database not found at {DB_PATH}")

    backup_database()
    init_db()
    print("Database migration completed successfully.")


if __name__ == "__main__":
    migrate()
