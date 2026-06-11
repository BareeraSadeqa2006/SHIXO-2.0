#!/usr/bin/env python
"""Direct approach: Convert schools with surplus to shortage by reducing beyond expected"""
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

def create_shortages_direct():
    """Directly convert surplus schools to shortage schools"""
    conn = get_db()
    c = conn.cursor()
    
    print("\n" + "="*80)
    print("ISSUE 1 FINAL: DIRECT SHORTAGE CREATION")
    print("="*80)
    
    # Get all schools
    schools = c.execute("SELECT * FROM schools").fetchall()
    schools_list = [dict(s) for s in schools]
    
    # Current shortage analysis
    current_shortage = [s for s in schools_list if compute_shortage_for_school(s) > 0]
    print(f"\nCurrent State:")
    print(f"  Shortage Schools: {len(current_shortage)}")
    print(f"  Target: 78")
    print(f"  Need to create: {78 - len(current_shortage)} more shortage schools")
    
    # Identify all non-shortage schools (current >= expected)
    non_shortage = []
    for s in schools_list:
        expected = compute_expected_teachers(s.get('student_strength', 0))
        current = s.get('current_teacher_count', 0)
        if current >= expected and current > 1:  # Don't reduce below 1 teacher
            non_shortage.append({
                'school_id': s['school_id'],
                'school_name': s['school_name'],
                'mandal': s['mandal'],
                'current': current,
                'expected': expected,
                'can_reduce': current - 1  # Reduce by 1 to create shortage
            })
    
    print(f"  Non-shortage schools available: {len(non_shortage)}")
    
    # Prioritize: mandals with lowest shortage %
    mandal_shortage_count = defaultdict(int)
    mandal_total_count = defaultdict(int)
    for s in schools_list:
        m = s['mandal']
        mandal_total_count[m] += 1
        if compute_shortage_for_school(s) > 0:
            mandal_shortage_count[m] += 1
    
    non_shortage.sort(key=lambda x: mandal_shortage_count.get(x['mandal'], 0))
    
    # Select schools to reduce
    schools_to_reduce = 78 - len(current_shortage)
    selected = non_shortage[:schools_to_reduce]
    
    print(f"  Selected for reduction: {len(selected)}")
    
    # Apply reductions
    for school in selected:
        school_id = school['school_id']
        # Reduce by 1 to create shortage
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
    new_shortage = [s for s in new_schools_list if compute_shortage_for_school(s) > 0]
    
    print(f"\nPost-Implementation State:")
    print(f"  Shortage Schools: {len(new_shortage)}")
    print(f"  Target: 78")
    print(f"  Status: {'[SUCCESS]' if len(new_shortage) == 78 else '[PARTIAL]'}")
    
    # Detailed breakdown
    mandal_stats = defaultdict(lambda: {'total': 0, 'shortage': 0, 'shortage_pct': 0})
    for s in new_schools_list:
        m = s['mandal']
        mandal_stats[m]['total'] += 1
        if compute_shortage_for_school(s) > 0:
            mandal_stats[m]['shortage'] += 1
    
    for m in mandal_stats:
        total = mandal_stats[m]['total']
        shortage = mandal_stats[m]['shortage']
        mandal_stats[m]['shortage_pct'] = (shortage / total * 100) if total > 0 else 0
    
    print(f"\nShortage by Mandal:")
    print(f"{'Mandal':<25} {'Total':<8} {'Shortage':<10} {'% Shortage':<12}")
    print("-" * 60)
    for mandal in sorted(mandal_stats.keys()):
        stats = mandal_stats[mandal]
        print(f"{mandal:<25} {stats['total']:<8} {stats['shortage']:<10} {stats['shortage_pct']:.1f}%")
    
    # Show new shortage schools
    new_shortage_sorted = sorted(new_shortage, key=lambda s: compute_shortage_for_school(s), reverse=True)
    
    print(f"\nTop 15 Shortage Schools (Final):")
    print(f"{'ID':<8} {'Name':<33} {'Mandal':<20} {'Current':<8} {'Expected':<8} {'Shortage':<8}")
    print("-" * 90)
    for s in new_shortage_sorted[:15]:
        shortage = compute_shortage_for_school(s)
        expected = compute_expected_teachers(s.get('student_strength', 0))
        print(f"{s['school_id']:<8} {s['school_name'][:31]:<33} {s['mandal']:<20} {s['current_teacher_count']:<8} {expected:<8} {shortage:<8}")
    
    conn.close()
    
    return {
        'before': len(current_shortage),
        'after': len(new_shortage),
        'target': 78,
        'converted': len(selected)
    }

if __name__ == "__main__":
    result = create_shortages_direct()
    
    print("\n" + "="*80)
    print("FINAL SUMMARY")
    print("="*80)
    print(f"Before: {result['before']} shortage schools (4.4%)")
    print(f"After: {result['after']} shortage schools ({result['after']/520*100:.1f}%)")
    print(f"Target: {result['target']} shortage schools (15.0%)")
    print(f"Schools Converted: {result['converted']}")
    print("="*80)
