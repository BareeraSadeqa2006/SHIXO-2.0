#!/usr/bin/env python
"""Further increase shortage schools to reach target of 78"""
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
    """Compute expected number of teachers based on student strength."""
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
    """Compute shortage for a school."""
    try:
        s = dict(school_row) if not isinstance(school_row, dict) else school_row
        expected = compute_expected_teachers(s.get('student_strength') or 0)
        current = int(s.get('current_teacher_count') or 0)
        return max(0, expected - current)
    except Exception:
        return 0

def increase_shortage_schools_phase2():
    """Phase 2: Convert schools with 1-2 surplus teachers"""
    conn = get_db()
    c = conn.cursor()
    
    print("\n" + "="*80)
    print("ISSUE 1 PHASE 2: INCREASE SHORTAGE SCHOOLS (PHASE 2)")
    print("="*80)
    
    # Get all schools
    schools = c.execute("SELECT * FROM schools").fetchall()
    schools_list = [dict(s) for s in schools]
    
    # Current shortage analysis
    current_shortage = [s for s in schools_list if compute_shortage_for_school(s) > 0]
    print(f"\nCurrent State:")
    print(f"  Shortage Schools: {len(current_shortage)}")
    
    # Target: 78 schools (15%)
    target_shortage = 78
    schools_to_convert = target_shortage - len(current_shortage)  # = 29
    print(f"  Target Shortage Schools: {target_shortage}")
    print(f"  Schools to Convert: {schools_to_convert}")
    
    # Strategy: Select schools with small surplus (1-2 extra teachers)
    # This allows more schools to be converted without impacting larger institutions
    conversion_candidates = []
    for s in schools_list:
        expected = compute_expected_teachers(s.get('student_strength', 0))
        current = s.get('current_teacher_count', 0)
        surplus = current - expected
        
        # Select schools with 1-2 surplus teachers
        if 1 <= surplus <= 2 and current > 1:
            conversion_candidates.append({
                'school_id': s['school_id'],
                'school_name': s['school_name'],
                'mandal': s['mandal'],
                'student_strength': s.get('student_strength', 0),
                'current_teachers': current,
                'expected_teachers': expected,
                'surplus': surplus,
                'action': f'reduce_by_{surplus}'
            })
    
    conversion_candidates.sort(key=lambda x: x['school_id'])
    
    print(f"  Conversion Candidates (surplus = 1-2): {len(conversion_candidates)}")
    
    # Prioritize: schools from mandals that have fewer shortage schools
    mandal_shortage_count = defaultdict(int)
    for s in current_shortage:
        mandal_shortage_count[s['mandal']] += 1
    
    # Sort candidates by mandal (prioritize mandals with fewer shortages)
    conversion_candidates.sort(key=lambda x: mandal_shortage_count.get(x['mandal'], 0))
    
    selected_for_conversion = conversion_candidates[:schools_to_convert]
    
    print(f"\nImplementing Conversion:")
    print(f"  Selected for Conversion: {len(selected_for_conversion)}")
    
    # Apply changes: reduce current_teacher_count
    converted_count = 0
    total_reduced = 0
    for school in selected_for_conversion:
        school_id = school['school_id']
        surplus = school['surplus']
        
        # Reduce teacher count by surplus (to bring to expected)
        c.execute(
            "UPDATE schools SET current_teacher_count = current_teacher_count - ? WHERE school_id = ?",
            (surplus, school_id)
        )
        total_reduced += surplus
        
        # Recalculate student-teacher ratio
        srow = c.execute("SELECT student_strength, current_teacher_count FROM schools WHERE school_id = ?", (school_id,)).fetchone()
        if srow:
            ratio = round(srow[0] / max(srow[1], 1), 2)
            c.execute("UPDATE schools SET student_teacher_ratio = ? WHERE school_id = ?", (ratio, school_id))
        
        converted_count += 1
    
    conn.commit()
    
    # Verify the changes
    new_schools = c.execute("SELECT * FROM schools").fetchall()
    new_schools_list = [dict(s) for s in new_schools]
    new_shortage = [s for s in new_schools_list if compute_shortage_for_school(s) > 0]
    
    print(f"\nPost-Implementation State:")
    print(f"  Shortage Schools: {len(new_shortage)}")
    print(f"  Target: {target_shortage}")
    print(f"  Status: {'[OK]' if len(new_shortage) >= target_shortage else '[ADJUSTING]'}")
    
    if len(new_shortage) < target_shortage:
        difference = target_shortage - len(new_shortage)
        print(f"  Additional adjustments needed: {difference}")
    
    # Analyze shortage distribution by mandal
    print(f"\nShortage Distribution by Mandal (Phase 2):")
    mandal_stats = defaultdict(lambda: {'total': 0, 'shortage': 0, 'deficit': 0})
    for s in new_schools_list:
        m = s['mandal']
        mandal_stats[m]['total'] += 1
        shortage = compute_shortage_for_school(s)
        if shortage > 0:
            mandal_stats[m]['shortage'] += 1
            mandal_stats[m]['deficit'] += shortage
    
    print(f"{'Mandal':<25} {'Total':<10} {'Shortage':<12} {'% Shortage':<15}")
    print("-" * 65)
    total_shortage_count = 0
    for mandal in sorted(mandal_stats.keys()):
        stats = mandal_stats[mandal]
        pct = (stats['shortage'] / stats['total'] * 100) if stats['total'] > 0 else 0
        total_shortage_count += stats['shortage']
        print(f"{mandal:<25} {stats['total']:<10} {stats['shortage']:<12} {pct:.1f}%")
    
    conn.close()
    
    return {
        'before': len(current_shortage),
        'after': len(new_shortage),
        'target': target_shortage,
        'converted': converted_count,
        'total_reduced': total_reduced
    }

if __name__ == "__main__":
    result = increase_shortage_schools_phase2()
    
    print("\n" + "="*80)
    print("PHASE 2 SUMMARY")
    print("="*80)
    print(f"Before Phase 2: {result['before']} shortage schools")
    print(f"After Phase 2: {result['after']} shortage schools")
    print(f"Target: {result['target']} shortage schools")
    print(f"Schools Converted: {result['converted']}")
    print(f"Total Teachers Reduced: {result['total_reduced']}")
    print("="*80)
