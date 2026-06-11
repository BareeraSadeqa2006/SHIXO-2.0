#!/usr/bin/env python
"""Iterative fix for ISSUE 1: Keep reducing until we reach 78 shortage schools"""
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

def iterative_increase_shortages():
    """Keep reducing schools until we reach 78 shortage schools"""
    
    conn = get_db()
    c = conn.cursor()
    
    target_shortages = 78
    iteration = 0
    max_iterations = 20
    
    while True:
        iteration += 1
        
        # Get current state
        schools = c.execute("SELECT * FROM schools").fetchall()
        schools_list = [dict(s) for s in schools]
        current_shortage = [s for s in schools_list if compute_shortage_for_school(s) > 0]
        
        print(f"\nIteration {iteration}:")
        print(f"  Current Shortage Schools: {len(current_shortage)}")
        print(f"  Target: {target_shortages}")
        
        if len(current_shortage) >= target_shortages:
            print(f"  Status: [REACHED TARGET]")
            break
        
        shortage_gap = target_shortages - len(current_shortage)
        print(f"  Gap: {shortage_gap}")
        
        # Find schools to reduce (prioritize surplus schools and those at expected)
        mandal_shortage_count = defaultdict(int)
        mandal_total_count = defaultdict(int)
        for s in schools_list:
            m = s['mandal']
            mandal_total_count[m] += 1
            if compute_shortage_for_school(s) > 0:
                mandal_shortage_count[m] += 1
        
        # Collect all eligible schools with their priority
        candidates = []
        for s in schools_list:
            expected = compute_expected_teachers(s.get('student_strength', 0))
            current = s.get('current_teacher_count', 0)
            
            # Eligible schools: at expected or surplus
            if (current == expected or current > expected) and current > 1:
                mandal = s['mandal']
                pct_shortage = mandal_shortage_count[mandal] / mandal_total_count[mandal]
                candidates.append({
                    'school_id': s['school_id'],
                    'mandal': mandal,
                    'current': current,
                    'expected': expected,
                    'priority': pct_shortage,
                    'type': 'surplus' if current > expected else 'at_expected'
                })
        
        # Sort by priority (lower shortage % first), prefer surplus schools
        candidates.sort(key=lambda x: (x['priority'], x['type'] == 'at_expected'))
        
        selected = candidates[:shortage_gap]
        
        print(f"  Schools to Reduce: {len(selected)} (surplus: {sum(1 for s in selected if s['type']=='surplus')}, at_expected: {sum(1 for s in selected if s['type']=='at_expected')})")
        
        if not selected:
            print("  [ERROR] No schools available to reduce!")
            break
        
        # Apply reductions (reduce by 1 initially, but more aggressively if needed)
        reduction_per_school = 1
        for i, school in enumerate(selected):
            school_id = school['school_id']
            # For surplus schools, we can reduce more aggressively
            if school['type'] == 'surplus' and i < len(selected) // 2:
                reduction_per_school = 2
            else:
                reduction_per_school = 1
            
            # Ensure we don't reduce below 1
            current_count = school['current']
            new_count = max(1, current_count - reduction_per_school)
            
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
        
        if iteration >= max_iterations:
            print(f"  [WARNING] Reached max iterations ({max_iterations}), stopping")
            break
    
    # Final verification
    schools = c.execute("SELECT * FROM schools").fetchall()
    schools_list = [dict(s) for s in schools]
    final_shortage = [s for s in schools_list if compute_shortage_for_school(s) > 0]
    
    print(f"\n" + "="*80)
    print(f"Final State: {len(final_shortage)} shortage schools ({len(final_shortage)/len(schools_list)*100:.1f}%)")
    print("="*80)
    
    # Breakdown by mandal
    mandal_stats = defaultdict(lambda: {'total': 0, 'shortage': 0})
    for s in schools_list:
        m = s['mandal']
        mandal_stats[m]['total'] += 1
        if compute_shortage_for_school(s) > 0:
            mandal_stats[m]['shortage'] += 1
    
    print(f"\n{'Mandal':<25} {'Total':<8} {'Shortage':<10} {'% Shortage':<12}")
    print("-" * 60)
    for mandal in sorted(mandal_stats.keys()):
        stats = mandal_stats[mandal]
        pct = (stats['shortage'] / stats['total'] * 100) if stats['total'] > 0 else 0
        print(f"{mandal:<25} {stats['total']:<8} {stats['shortage']:<10} {pct:>6.1f}%")
    
    conn.close()
    
    return len(final_shortage)

if __name__ == "__main__":
    result = iterative_increase_shortages()
    print(f"\nFinal Result: {result}/78 shortage schools")
