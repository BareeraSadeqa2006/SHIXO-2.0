#!/usr/bin/env python
"""
COMPREHENSIVE ISSUE 1 FIX: Increase Shortage Schools to 78 (~15%)
Standalone version avoiding zoneinfo import
"""
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

def implement_issue1_fix():
    """Implement ISSUE 1: Increase shortage schools from ~4% to 15%"""
    
    conn = get_db()
    c = conn.cursor()
    
    print("\n" + "="*80)
    print("ISSUE 1: INCREASE SHORTAGE SCHOOLS TO 15%")
    print("="*80)
    
    # Get current state
    schools = c.execute("SELECT * FROM schools").fetchall()
    schools_list = [dict(s) for s in schools]
    
    if not schools_list:
        print("\n[ERROR] No schools found in database!")
        conn.close()
        return None
    
    print(f"\nInitial Assessment:")
    print(f"  Total Schools: {len(schools_list)}")
    
    current_shortage = [s for s in schools_list if compute_shortage_for_school(s) > 0]
    print(f"  Current Shortage Schools: {len(current_shortage)} ({len(current_shortage)/len(schools_list)*100:.1f}%)")
    print(f"  Target Shortage Schools: 78 (15.0%)")
    print(f"  Gap to Fill: {78 - len(current_shortage)} schools")
    
    # Find schools with surplus that can be reduced to create shortages
    # Priority: Schools at expected level (current == expected) to create new shortages
    # Secondary: Schools with surplus above expected
    
    schools_at_expected = []  # Priority: current == expected
    schools_with_surplus = []  # Secondary: current > expected
    
    for s in schools_list:
        expected = compute_expected_teachers(s.get('student_strength', 0))
        current = s.get('current_teacher_count', 0)
        
        if current == expected and current > 1:
            schools_at_expected.append({
                'school_id': s['school_id'],
                'school_name': s['school_name'],
                'mandal': s['mandal'],
                'current': current,
                'expected': expected,
                'type': 'at_expected'
            })
        elif current > expected and current > 1:
            schools_with_surplus.append({
                'school_id': s['school_id'],
                'school_name': s['school_name'],
                'mandal': s['mandal'],
                'current': current,
                'expected': expected,
                'surplus': current - expected,
                'type': 'surplus'
            })
    
    surplus_schools = schools_at_expected + schools_with_surplus
    
    # Count current shortages by mandal
    mandal_shortage_count = defaultdict(int)
    mandal_total_count = defaultdict(int)
    for s in schools_list:
        m = s['mandal']
        mandal_total_count[m] += 1
        if compute_shortage_for_school(s) > 0:
            mandal_shortage_count[m] += 1
    
    print(f"\nAvailable Resources:")
    print(f"  Surplus Schools (reducible): {len(surplus_schools)}")
    
    # Prioritize surplus schools from mandals with lowest shortage %
    def shortage_priority(school):
        mandal = school['mandal']
        current_shortage_pct = mandal_shortage_count[mandal] / mandal_total_count[mandal]
        return current_shortage_pct  # Lower shortage % = higher priority
    
    surplus_schools.sort(key=shortage_priority)
    
    # Select schools to reduce
    shortage_gap = 78 - len(current_shortage)
    selected_schools = surplus_schools[:shortage_gap]
    
    print(f"\nImplementation Plan:")
    print(f"  Schools to Reduce: {len(selected_schools)}")
    
    # Apply reductions
    for school in selected_schools:
        school_id = school['school_id']
        # Reduce by 1 to create shortage (current becomes expected-1)
        c.execute(
            "UPDATE schools SET current_teacher_count = current_teacher_count - 1 WHERE school_id = ?",
            (school_id,)
        )
        
        # Recalculate ratio
        srow = c.execute("SELECT student_strength, current_teacher_count FROM schools WHERE school_id = ?", (school_id,)).fetchone()
        if srow:
            new_count = srow[1]
            ratio = round(srow[0] / max(new_count, 1), 2)
            c.execute("UPDATE schools SET student_teacher_ratio = ? WHERE school_id = ?", (ratio, school_id))
    
    conn.commit()
    
    # Verify changes
    new_schools = c.execute("SELECT * FROM schools").fetchall()
    new_schools_list = [dict(s) for s in new_schools]
    final_shortage = [s for s in new_schools_list if compute_shortage_for_school(s) > 0]
    
    print(f"\nImplementation Results:")
    print(f"  Shortage Schools After: {len(final_shortage)} ({len(final_shortage)/len(new_schools_list)*100:.1f}%)")
    print(f"  Target: 78 schools (15.0%)")
    print(f"  Status: {'[SUCCESS]' if len(final_shortage) == 78 else '[PARTIAL]'}")
    
    # Detailed breakdown by mandal
    print(f"\nShortage Distribution by Mandal (After):")
    print(f"{'Mandal':<25} {'Total':<8} {'Shortage':<10} {'% Shortage':<12} {'Deficit':<10}")
    print("-" * 70)
    
    mandal_stats = defaultdict(lambda: {'total': 0, 'shortage': 0, 'deficit': 0})
    for s in new_schools_list:
        m = s['mandal']
        mandal_stats[m]['total'] += 1
        shortage = compute_shortage_for_school(s)
        if shortage > 0:
            mandal_stats[m]['shortage'] += 1
            mandal_stats[m]['deficit'] += shortage
    
    for mandal in sorted(mandal_stats.keys()):
        stats = mandal_stats[mandal]
        pct = (stats['shortage'] / stats['total'] * 100) if stats['total'] > 0 else 0
        print(f"{mandal:<25} {stats['total']:<8} {stats['shortage']:<10} {pct:>6.1f}%{'':<4} {stats['deficit']:<10}")
    
    # Top 20 shortage schools
    final_shortage_sorted = sorted(final_shortage, key=lambda s: compute_shortage_for_school(s), reverse=True)
    
    print(f"\nTop 20 Shortage Schools (After Implementation):")
    print(f"{'ID':<8} {'School Name':<30} {'Mandal':<20} {'Current':<8} {'Expected':<8} {'Shortage':<8}")
    print("-" * 90)
    
    for s in final_shortage_sorted[:20]:
        shortage = compute_shortage_for_school(s)
        expected = compute_expected_teachers(s.get('student_strength', 0))
        school_name = s['school_name'][:28]
        print(f"{s['school_id']:<8} {school_name:<30} {s['mandal']:<20} {s['current_teacher_count']:<8} {expected:<8} {shortage:<8}")
    
    conn.close()
    
    return {
        'before': len(current_shortage),
        'after': len(final_shortage),
        'target': 78,
        'converted': len(selected_schools)
    }

if __name__ == "__main__":
    try:
        result = implement_issue1_fix()
        
        if result:
            print("\n" + "="*80)
            print("ISSUE 1 IMPLEMENTATION SUMMARY")
            print("="*80)
            print(f"Before: {result['before']} shortage schools ({result['before']/520*100:.1f}%)")
            print(f"After:  {result['after']} shortage schools ({result['after']/520*100:.1f}%)")
            print(f"Target: {result['target']} shortage schools (15.0%)")
            print(f"Schools Modified: {result['converted']}")
            print("="*80)
    except Exception as e:
        print(f"\n[ERROR] {e}")
        import traceback
        traceback.print_exc()
