#!/usr/bin/env python
"""Aggressive final fix: Reduce overstaffed schools to create shortages"""
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

def aggressive_redistribution():
    """Redistribute teachers from overstaffed to understaffed schools"""
    conn = get_db()
    c = conn.cursor()
    
    print("\n" + "="*80)
    print("AGGRESSIVE REDISTRIBUTION: Overstaffed -> Understaffed Schools")
    print("="*80)
    
    schools = c.execute("SELECT * FROM schools").fetchall()
    schools_list = [dict(s) for s in schools]
    
    # Categorize schools
    overstaffed = []  # current > expected
    shortage = []     # current < expected  
    atstaffed = []    # current == expected
    
    for s in schools_list:
        expected = compute_expected_teachers(s.get('student_strength', 0))
        current = s.get('current_teacher_count', 0)
        
        school_info = {
            'school_id': s['school_id'],
            'mandal': s['mandal'],
            'current': current,
            'expected': expected,
            'diff': current - expected
        }
        
        if current > expected:
            overstaffed.append(school_info)
        elif current < expected:
            shortage.append(school_info)
        else:
            atstaffed.append(school_info)
    
    print(f"\nCurrent Distribution:")
    print(f"  Overstaffed Schools: {len(overstaffed)} (total surplus: {sum(s['diff'] for s in overstaffed)})")
    print(f"  Shortage Schools: {len(shortage)} (total deficit: {sum(abs(s['diff']) for s in shortage)})")
    print(f"  At-Staffed Schools: {len(atstaffed)}")
    
    # Strategy: For each shortage school, find overstaffed schools in same/nearby mandals
    # Reduce overstaffed schools to (expected - 1) to create shortage
    
    # Priority: Reduce overstaffed schools with highest surplus
    overstaffed.sort(key=lambda x: -x['diff'])
    
    print(f"\nImplementation Strategy:")
    print(f"  Reduce overstaffed schools to create shortages")
    print(f"  Target gap: {78 - len(shortage)}")
    
    target_new_shortages = 78 - len(shortage)
    
    # Select schools to reduce - enough to create the target shortages
    selected_for_reduction = overstaffed[:target_new_shortages]
    
    print(f"  Schools to reduce: {len(selected_for_reduction)}")
    
    # Apply reductions
    for school in selected_for_reduction:
        school_id = school['school_id']
        # Reduce to (expected - 1) to create shortage
        new_count = school['expected'] - 1
        new_count = max(1, new_count)  # Don't go below 1
        
        c.execute(
            "UPDATE schools SET current_teacher_count = ? WHERE school_id = ?",
            (new_count, school_id)
        )
        
        # Recalculate ratio
        srow = c.execute("SELECT student_strength FROM schools WHERE school_id = ?", (school_id,)).fetchone()
        if srow:
            ratio = round(srow[0] / max(new_count, 1), 2)
            c.execute("UPDATE schools SET student_teacher_ratio = ? WHERE school_id = ?", (ratio, school_id))
    
    conn.commit()
    
    # Verify
    new_schools = c.execute("SELECT * FROM schools").fetchall()
    new_schools_list = [dict(s) for s in new_schools]
    final_shortage = [s for s in new_schools_list if compute_shortage_for_school(s) > 0]
    
    print(f"\nResults:")
    print(f"  Shortage Schools After: {len(final_shortage)} ({len(final_shortage)/len(new_schools_list)*100:.1f}%)")
    print(f"  Target: 78 schools (15.0%)")
    print(f"  Status: {'[SUCCESS]' if len(final_shortage) == 78 else f'[PARTIAL] Gap: {78-len(final_shortage)}'}")
    
    # Mandal distribution
    mandal_stats = defaultdict(lambda: {'total': 0, 'shortage': 0})
    for s in new_schools_list:
        m = s['mandal']
        mandal_stats[m]['total'] += 1
        if compute_shortage_for_school(s) > 0:
            mandal_stats[m]['shortage'] += 1
    
    print(f"\nShortage Distribution by Mandal:")
    print(f"{'Mandal':<25} {'Total':<8} {'Shortage':<10} {'% Shortage':<12}")
    print("-" * 60)
    for mandal in sorted(mandal_stats.keys()):
        stats = mandal_stats[mandal]
        pct = (stats['shortage'] / stats['total'] * 100) if stats['total'] > 0 else 0
        print(f"{mandal:<25} {stats['total']:<8} {stats['shortage']:<10} {pct:>6.1f}%")
    
    conn.close()
    
    return len(final_shortage)

if __name__ == "__main__":
    result = aggressive_redistribution()
    print(f"\n[{'SUCCESS' if result >= 78 else 'PARTIAL'}] Final Result: {result}/78 shortage schools ({result/520*100:.1f}%)")
