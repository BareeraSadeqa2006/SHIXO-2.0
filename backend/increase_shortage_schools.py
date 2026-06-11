#!/usr/bin/env python
"""Implement ISSUE 1: Increase shortage schools from 23 to 78 (~15%)"""
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

def increase_shortage_schools():
    """Increase shortage schools from 23 to 78 using realistic staffing logic"""
    conn = get_db()
    c = conn.cursor()
    
    print("\n" + "="*80)
    print("ISSUE 1 IMPLEMENTATION: INCREASE SHORTAGE SCHOOLS")
    print("="*80)
    
    # Get all schools
    schools = c.execute("SELECT * FROM schools").fetchall()
    schools_list = [dict(s) for s in schools]
    
    # Current shortage analysis
    current_shortage = [s for s in schools_list if compute_shortage_for_school(s) > 0]
    print(f"\nCurrent State:")
    print(f"  Shortage Schools: {len(current_shortage)}")
    print(f"  Total Schools: {len(schools_list)}")
    
    # Target: 78 schools (15%)
    target_shortage = 78
    schools_to_convert = target_shortage - len(current_shortage)  # = 55
    print(f"  Target Shortage Schools: {target_shortage}")
    print(f"  Schools to Convert: {schools_to_convert}")
    
    # Strategy: Select schools that currently have SURPLUS teachers (more than expected)
    # and reduce their teacher count to create shortages in underserved areas
    
    surplus_schools = []
    for s in schools_list:
        expected = compute_expected_teachers(s.get('student_strength', 0))
        current = s.get('current_teacher_count', 0)
        surplus = current - expected
        if surplus > 0:
            surplus_schools.append({
                'school_id': s['school_id'],
                'school_name': s['school_name'],
                'mandal': s['mandal'],
                'student_strength': s.get('student_strength', 0),
                'current_teachers': current,
                'expected_teachers': expected,
                'surplus': surplus
            })
    
    surplus_schools.sort(key=lambda x: x['surplus'], reverse=True)
    
    print(f"\n  Surplus Schools Available: {len(surplus_schools)}")
    
    # Strategy: Identify candidates for conversion to shortage schools
    # Convert schools with MINIMUM surplus to shortage by reducing 1 teacher
    conversion_candidates = []
    for s in schools_list:
        expected = compute_expected_teachers(s.get('student_strength', 0))
        current = s.get('current_teacher_count', 0)
        
        # Schools with current = expected or current < expected are already shortage
        # We want schools that are at expected but can be reduced by 1 to create shortage
        if current == expected and expected > 1:
            conversion_candidates.append({
                'school_id': s['school_id'],
                'school_name': s['school_name'],
                'mandal': s['mandal'],
                'student_strength': s.get('student_strength', 0),
                'current_teachers': current,
                'expected_teachers': expected,
                'action': 'reduce_by_1'
            })
    
    conversion_candidates.sort(key=lambda x: x['school_id'])
    
    print(f"  Conversion Candidates (current = expected): {len(conversion_candidates)}")
    
    # Select schools to convert
    # Prioritize: schools from mandals that have fewer shortage schools
    mandal_shortage_count = defaultdict(int)
    for s in current_shortage:
        mandal_shortage_count[s['mandal']] += 1
    
    # Sort candidates by mandal (prioritize mandals with fewer shortages)
    conversion_candidates.sort(key=lambda x: mandal_shortage_count.get(x['mandal'], 0))
    
    selected_for_conversion = conversion_candidates[:schools_to_convert]
    
    print(f"\nImplementing Conversion:")
    print(f"  Selected for Conversion: {len(selected_for_conversion)}")
    
    # Apply changes: reduce current_teacher_count by 1 for selected schools
    converted_count = 0
    for school in selected_for_conversion:
        school_id = school['school_id']
        
        # Reduce teacher count by 1
        c.execute(
            "UPDATE schools SET current_teacher_count = current_teacher_count - 1 WHERE school_id = ?",
            (school_id,)
        )
        
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
    print(f"  Status: {'[OK]' if len(new_shortage) == target_shortage else '[ADJUSTING]'}")
    
    if len(new_shortage) != target_shortage:
        difference = target_shortage - len(new_shortage)
        print(f"  Additional adjustments needed: {difference}")
        
        if difference < 0:
            print(f"  (Converted too many schools; need to revert {abs(difference)})")
        else:
            print(f"  (Need to convert {difference} more schools)")
    
    # Analyze shortage distribution by mandal
    print(f"\nShortage Distribution by Mandal:")
    mandal_stats = defaultdict(lambda: {'total': 0, 'shortage': 0, 'deficit': 0})
    for s in new_schools_list:
        m = s['mandal']
        mandal_stats[m]['total'] += 1
        shortage = compute_shortage_for_school(s)
        if shortage > 0:
            mandal_stats[m]['shortage'] += 1
            mandal_stats[m]['deficit'] += shortage
    
    print(f"{'Mandal':<25} {'Total':<10} {'Shortage':<12} {'% Shortage':<15} {'Total Deficit':<15}")
    print("-" * 80)
    for mandal in sorted(mandal_stats.keys()):
        stats = mandal_stats[mandal]
        pct = (stats['shortage'] / stats['total'] * 100) if stats['total'] > 0 else 0
        print(f"{mandal:<25} {stats['total']:<10} {stats['shortage']:<12} {pct:.1f}%{'':<10} {stats['deficit']:<15}")
    
    # Show top shortage schools
    top_shortage = sorted(new_schools_list, key=lambda s: compute_shortage_for_school(s), reverse=True)[:10]
    
    print(f"\nTop 10 Shortage Schools (After Implementation):")
    print(f"{'ID':<8} {'Name':<35} {'Mandal':<20} {'Current':<10} {'Expected':<10} {'Shortage':<10}")
    print("-" * 95)
    for s in top_shortage:
        shortage = compute_shortage_for_school(s)
        if shortage > 0:
            print(f"{s['school_id']:<8} {s['school_name'][:33]:<35} {s['mandal']:<20} {s['current_teacher_count']:<10} {compute_expected_teachers(s.get('student_strength', 0)):<10} {shortage:<10}")
    
    conn.close()
    
    return {
        'before': len(current_shortage),
        'after': len(new_shortage),
        'target': target_shortage,
        'converted': converted_count
    }

if __name__ == "__main__":
    result = increase_shortage_schools()
    
    print("\n" + "="*80)
    print("SUMMARY")
    print("="*80)
    print(f"Before: {result['before']} shortage schools")
    print(f"After: {result['after']} shortage schools")
    print(f"Target: {result['target']} shortage schools")
    print(f"Converted: {result['converted']} schools")
    print("="*80)
