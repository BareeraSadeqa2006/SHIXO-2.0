"""Simple wrapper to run the shared teacher-expansion helper.

This module intentionally performs no actions at import time. Run

    python expand_teachers.py      # expand to default TARGET_TEACHERS
    python expand_teachers.py -t 6000

The actual expansion implementation lives in `database.expand_teachers_to_target()`
and is reused to preserve distribution and avoid duplicate generation.
"""

from __future__ import annotations

import argparse
from typing import Optional


def main(target: Optional[int] = None) -> None:
    # Import inside function to avoid DB side-effects at import time
    from database import init_db, expand_teachers_to_target, TARGET_TEACHERS

    try:
        init_db()
    except Exception:
        # If DB already exists or init fails for a known reason, let expand helper handle it
        pass

    tgt = target if target is not None else TARGET_TEACHERS
    expand_teachers_to_target(tgt)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Expand teachers to a target total using shared DB helper")
    parser.add_argument("-t", "--target", type=int, help="Target total number of teachers (optional)")
    args = parser.parse_args()
    main(args.target)
