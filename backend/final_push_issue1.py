#!/usr/bin/env python
"""Final push to reach 78 shortage schools"""
import sqlite3
import os
import math
from collections import defaultdict

DB_PATH = os.path.join(os.path.dirname(__file__), 'shixo.db')

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def compute_expected_teachers(student_strength: int) -> int:
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
    try:
        s = dict(school_row) if not isinstance(school_row, dict) else school_row
        expected = compute_expected_teachers(s.get('student_strength') or 0)
        current = int(s.get('current_teacher_count') or 0)
        return max(0, expected - current)
    except Exception:
        return 0

def final_push():
    """Aggressive final push to reach 78 shortage schools"""
    conn = get_db()
    c = conn.cursor()
    
    schools = c.execute("SELECT * FROM schools").fetchall()
    schools_list = [dict(s) for s in schools]
    current_shortage = [s for s in schools_list if compute_shortage_for_school(s) > 0]
    
    gap = 78 - len(current_shortage)
    
    print(f"\nFINAL PUSH:")
    print(f"Current Shortage Schools: {len(current_shortage)}")
    print(f"Target: 78")
    print(f"Gap: {gap}")
    
    if gap <= 0:
        print("Already at target!")
        return len(current_shortage)
    
    # Find all non-shortage schools
    non_shortage = []
    for s in schools_list:
        expected = compute_expected_teachers(s.get('student_strength', 0))
        current = s.get('current_teacher_count', 0)
        if current >= expected:
            non_shortage.append({
                'school_id': s['school_id'],
                'mandal': s['mandal'],
                'current': current,
                'expected': expected,
                'reduction_possible': max(0, current - 1)
            })
    
    print(f"Non-shortage Schools Available: {len(non_shortage)}")
    
    # Prioritize mandals with lowest shortage %
    mandal_shortage_count = defaultdict(int)
    mandal_total_count = defaultdict(int)
    for s in schools_list:
        m = s['mandal']
        mandal_total_count[m] += 1
        if compute_shortage_for_school(s) > 0:
            mandal_shortage_count[m] += 1
    
    non_shortage.sort(key=lambda x: mandal_shortage_count.get(x['mandal'], 0))
    
    # Reduce selected schools
    selected = non_shortage[:gap]
    
    print(f"Schools to Reduce: {len(selected)}")
    
    for school in selected:
        school_id = school['school_id']
        c.execute(
            "UPDATE schools SET current_teacher_count = current_teacher_count - 1 WHERE school_id = ?",
            (school_id,)
        )
        
        # Recalculate ratio
        srow = c.execute("SELECT student_strength, current_teacher_count FROM schools WHERE school_id = ?", (school_id,)).fetchone()
        if srow:
            ratio = round(srow[0] / max(srow[1], 1), 2)
            c.execute("UPDATE schools SET student_teacher_ratio = ? WHERE school_id = ?", (ratio, school_id))
    
    conn.commit()
    
    # Verify
    new_schools = c.execute("SELECT * FROM schools").fetchall()
    new_schools_list = [dict(s) for s in new_schools]
    final_shortage = [s for s in new_schools_list if compute_shortage_for_school(s) > 0]
    
    print(f"\nFinal Result: {len(final_shortage)} shortage schools ({len(final_shortage)/len(new_schools_list)*100:.1f}%)")
    
    # Mandal breakdown
    mandal_stats = defaultdict(lambda: {'total': 0, 'shortage': 0})
    for s in new_schools_list:
        m = s['mandal']
        mandal_stats[m]['total'] += 1
        if compute_shortage_for_school(s) > 0:
            mandal_stats[m]['shortage'] += 1
    
    print(f"\n{'Mandal':<25} {'Shortage':<10} {'% Shortage':<12}")
    print("-" * 50)
    for mandal in sorted(mandal_stats.keys()):
        stats = mandal_stats[mandal]
        pct = (stats['shortage'] / stats['total'] * 100) if stats['total'] > 0 else 0
        print(f"{mandal:<25} {stats['shortage']:<10} {pct:>6.1f}%")
    
    conn.close()
    return len(final_shortage)

if __name__ == "__main__":
    result = final_push()
    print(f"\n[{'SUCCESS' if result >= 78 else 'PARTIAL'}] Final Result: {result}/78 shortage schools")
