#!/usr/bin/env python
"""
COMPREHENSIVE ISSUE 1 FIX: Increase Shortage Schools to 78 (~15%)
This script implements the complete solution in one pass with realistic staffing logic.
"""
import sqlite3
import os
import json
import random
import math
from collections import defaultdict
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

DB_PATH = os.path.join(os.path.dirname(__file__), 'shixo.db')

def hash_password(password: str) -> str:
    import hashlib
    return hashlib.sha256(password.encode()).hexdigest()

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
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

def generate_realistic_allocation(total_teachers, schools):
    """
    Generate teacher allocations that create realistic shortage distribution.
    
    Strategy:
    1. Allocate teachers based on school size (student strength)
    2. Create shortages in ~15% of schools
    3. Maintain realistic student-teacher ratios
    """
    random.seed(42)
    
    # Compute expected teachers for each school
    school_expected = {}
    for s in schools:
        school_expected[s['school_id']] = {
            'expected': compute_expected_teachers(s.get('student_strength', 0)),
            'student_strength': s.get('student_strength', 0),
            'mandal': s['mandal']
        }
    
    # Calculate how many schools should have shortages
    # Goal: ~15% (78 out of 520)
    total_expected = sum(se['expected'] for se in school_expected.values())
    target_shortage_schools = 78
    current_shortage_schools = 0
    teachers_to_allocate = total_teachers
    
    # Phase 1: Allocate sufficient teachers to most schools
    # Phase 2: Deliberately under-staff ~78 schools
    
    allocations = {}
    
    # Sort schools by student strength (large first)
    schools_sorted = sorted(schools, key=lambda x: x.get('student_strength', 0), reverse=True)
    
    # For each school, determine allocation
    shortage_mandals = defaultdict(int)  # Track how many shortages per mandal
    
    for s in schools_sorted:
        school_id = s['school_id']
        mandal = s['mandal']
        expected = school_expected[school_id]['expected']
        
        # Probabilistically create shortages
        # Start creating shortages after first N schools
        if current_shortage_schools < target_shortage_schools:
            # Decide if this school should have shortage
            remaining_needed = target_shortage_schools - current_shortage_schools
            remaining_schools = len(schools) - schools_sorted.index(s)
            prob_shortage = remaining_needed / max(remaining_schools, 1)
            
            if random.random() < prob_shortage * 1.2:  # Slight boost to reach target
                # Create shortage: allocate less than expected
                shortage_amount = random.randint(1, max(1, expected // 3))
                current = max(1, expected - shortage_amount)
                current_shortage_schools += 1
                shortage_mandals[mandal] += 1
            else:
                # Normal or surplus allocation
                current = expected + random.randint(-1, 2)
                current = max(expected, current)  # Ensure at least expected
        else:
            # After reaching target shortage count, allocate normally
            current = expected + random.randint(-1, 2)
            current = max(expected, current)
        
        allocations[school_id] = current
    
    # Verify we have enough teachers
    total_allocated = sum(allocations.values())
    
    # Final adjustment if needed
    if total_allocated != total_teachers:
        diff = total_teachers - total_allocated
        # Distribute remaining teachers proportionally
        for school_id in allocations:
            if diff > 0:
                allocations[school_id] += 1
                diff -= 1
            elif diff < 0:
                if allocations[school_id] > 1:
                    allocations[school_id] -= 1
                    diff += 1
    
    return allocations

def implement_comprehensive_fix():
    """Initialize fresh database with realistic shortage distribution"""
    
    # Initialize database first
    from database import init_db, seed_db
    init_db()
    seed_db()
    
    conn = get_db()
    c = conn.cursor()
    
    print("\n" + "="*80)
    print("ISSUE 1: INCREASE SHORTAGE SCHOOLS")
    print("="*80)
    
    # Get current state
    schools = c.execute("SELECT * FROM schools").fetchall()
    schools_list = [dict(s) for s in schools]
    teachers = c.execute("SELECT COUNT(*) FROM teachers").fetchone()[0]
    
    print(f"\nInitial State (from seed_db):")
    print(f"  Total Schools: {len(schools_list)}")
    print(f"  Total Teachers: {teachers}")
    
    current_shortage = [s for s in schools_list if compute_shortage_for_school(s) > 0]
    print(f"  Shortage Schools: {len(current_shortage)} ({len(current_shortage)/len(schools_list)*100:.1f}%)")
    print(f"  Target: 78 schools (~15%)")
    
    # Now implement targeted adjustments
    # Strategy: Identify schools with surplus and reduce them to create shortages
    
    print(f"\nImplementing Enhancement...")
    
    shortage_created = 0
    target_shortages_needed = 78 - len(current_shortage)
    
    # Find schools with surplus (current > expected) that can be reduced
    surplus_schools = []
    for s in schools_list:
        expected = compute_expected_teachers(s.get('student_strength', 0))
        current = s.get('current_teacher_count', 0)
        if current > expected:
            surplus_schools.append({
                'school_id': s['school_id'],
                'mandal': s['mandal'],
                'current': current,
                'expected': expected,
                'surplus': current - expected,
                'can_reduce_to': expected - 1
            })
    
    # Sort by mandal (prioritize mandals with fewer shortages) and surplus amount
    mandal_shortage_count = defaultdict(int)
    for s in current_shortage:
        mandal_shortage_count[s['mandal']] += 1
    
    surplus_schools.sort(key=lambda x: (mandal_shortage_count.get(x['mandal'], 0), -x['surplus']))
    
    print(f"  Surplus schools available: {len(surplus_schools)}")
    print(f"  Need to create: {target_shortages_needed} shortages")
    
    # Implement reductions
    for i, school in enumerate(surplus_schools[:target_shortages_needed]):
        school_id = school['school_id']
        # Reduce to (expected - 1) to create shortage
        new_count = school['can_reduce_to']
        c.execute(
            "UPDATE schools SET current_teacher_count = ? WHERE school_id = ?",
            (new_count, school_id)
        )
        
        # Recalculate ratio
        srow = c.execute("SELECT student_strength FROM schools WHERE school_id = ?", (school_id,)).fetchone()
        if srow:
            ratio = round(srow[0] / max(new_count, 1), 2)
            c.execute("UPDATE schools SET student_teacher_ratio = ? WHERE school_id = ?", (ratio, school_id))
        
        shortage_created += 1
    
    conn.commit()
    
    # Verify final state
    new_schools = c.execute("SELECT * FROM schools").fetchall()
    new_schools_list = [dict(s) for s in new_schools]
    final_shortage = [s for s in new_schools_list if compute_shortage_for_school(s) > 0]
    
    print(f"\nFinal State:")
    print(f"  Shortage Schools: {len(final_shortage)} ({len(final_shortage)/len(new_schools_list)*100:.1f}%)")
    print(f"  Target: 78 schools (15%)")
    print(f"  Status: {'[OK]' if len(final_shortage) == 78 else '[PARTIAL]'}")
    
    # Distribution by mandal
    print(f"\nShortage Distribution by Mandal:")
    mandal_stats = defaultdict(lambda: {'total': 0, 'shortage': 0})
    for s in new_schools_list:
        m = s['mandal']
        mandal_stats[m]['total'] += 1
        if compute_shortage_for_school(s) > 0:
            mandal_stats[m]['shortage'] += 1
    
    print(f"{'Mandal':<25} {'Total':<8} {'Shortage':<10} {'% Shortage':<12}")
    print("-" * 60)
    for mandal in sorted(mandal_stats.keys()):
        stats = mandal_stats[mandal]
        pct = (stats['shortage'] / stats['total'] * 100) if stats['total'] > 0 else 0
        print(f"{mandal:<25} {stats['total']:<8} {stats['shortage']:<10} {pct:.1f}%")
    
    # Top shortage schools
    final_shortage_sorted = sorted(final_shortage, key=lambda s: compute_shortage_for_school(s), reverse=True)
    
    print(f"\nTop 20 Shortage Schools:")
    print(f"{'ID':<8} {'School Name':<30} {'Mandal':<22} {'Current':<8} {'Expected':<8} {'Shortage':<8}")
    print("-" * 95)
    for s in final_shortage_sorted[:20]:
        shortage = compute_shortage_for_school(s)
        expected = compute_expected_teachers(s.get('student_strength', 0))
        print(f"{s['school_id']:<8} {s['school_name'][:28]:<30} {s['mandal']:<22} {s['current_teacher_count']:<8} {expected:<8} {shortage:<8}")
    
    conn.close()
    
    return {
        'before_shortage': len(current_shortage),
        'after_shortage': len(final_shortage),
        'target': 78,
        'schools_converted': shortage_created
    }

if __name__ == "__main__":
    try:
        result = implement_comprehensive_fix()
        
        print("\n" + "="*80)
        print("ISSUE 1 IMPLEMENTATION COMPLETE")
        print("="*80)
        print(f"Before: {result['before_shortage']} shortage schools ({result['before_shortage']/520*100:.1f}%)")
        print(f"After: {result['after_shortage']} shortage schools ({result['after_shortage']/520*100:.1f}%)")
        print(f"Target: {result['target']} shortage schools (15.0%)")
        print(f"Schools Converted: {result['schools_converted']}")
        print("="*80)
    except Exception as e:
        print(f"\nError: {e}")
        import traceback
        traceback.print_exc()
