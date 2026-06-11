#!/usr/bin/env python
"""Comprehensive SHIXO database audit for shortage schools and MEO-teacher mapping"""
import sqlite3
import os
import json
import math
from collections import defaultdict

DB_PATH = os.path.join(os.path.dirname(__file__), 'shixo.db')

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def compute_expected_teachers(student_strength: int) -> int:
    """Compute expected number of teachers for a school based on student strength."""
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
    """Given a school row (dict or sqlite3.Row), compute shortage as expected - current (>=0)."""
    try:
        s = dict(school_row) if not isinstance(school_row, dict) else school_row
        expected = compute_expected_teachers(s.get('student_strength') or 0)
        current = int(s.get('current_teacher_count') or 0)
        return max(0, expected - current)
    except Exception:
        return 0

def audit_shortage_schools():
    """Analyze current shortage schools and calculate ideal distribution"""
    conn = get_db()
    c = conn.cursor()
    
    print("\n" + "="*80)
    print("ISSUE 1: SHORTAGE SCHOOLS ANALYSIS")
    print("="*80)
    
    schools = c.execute("SELECT * FROM schools").fetchall()
    schools_list = [dict(s) for s in schools]
    
    total_schools = len(schools_list)
    shortage_schools = [s for s in schools_list if compute_shortage_for_school(s) > 0]
    current_shortage_count = len(shortage_schools)
    
    print(f"\nCurrent Status:")
    print(f"  Total Schools: {total_schools}")
    print(f"  Shortage Schools: {current_shortage_count} ({current_shortage_count*100/total_schools:.1f}%)")
    print(f"  Target: 78 schools (~15%)")
    
    # Calculate shortage per school
    shortage_details = []
    for s in schools_list:
        shortage = compute_shortage_for_school(s)
        expected = compute_expected_teachers(s.get('student_strength', 0))
        current = s.get('current_teacher_count', 0)
        if shortage > 0:
            shortage_details.append({
                'school_id': s['school_id'],
                'school_name': s['school_name'],
                'mandal': s['mandal'],
                'students': s.get('student_strength', 0),
                'current_teachers': current,
                'expected_teachers': expected,
                'shortage': shortage,
                'ratio': s.get('student_teacher_ratio', 0)
            })
    
    shortage_details.sort(key=lambda x: x['shortage'], reverse=True)
    
    print(f"\nTop 15 Shortage Schools:")
    print(f"{'ID':<8} {'Name':<35} {'Mandal':<20} {'Current':<8} {'Expected':<8} {'Shortage':<8}")
    print("-" * 95)
    for sd in shortage_details[:15]:
        print(f"{sd['school_id']:<8} {sd['school_name'][:33]:<35} {sd['mandal']:<20} {sd['current_teachers']:<8} {sd['expected_teachers']:<8} {sd['shortage']:<8}")
    
    # Analyze by mandal
    mandal_shortage = defaultdict(lambda: {'total': 0, 'shortage': 0, 'sum_shortage': 0})
    for s in schools_list:
        m = s['mandal']
        mandal_shortage[m]['total'] += 1
        if compute_shortage_for_school(s) > 0:
            mandal_shortage[m]['shortage'] += 1
            mandal_shortage[m]['sum_shortage'] += compute_shortage_for_school(s)
    
    print(f"\nShortage by Mandal:")
    print(f"{'Mandal':<25} {'Total Schools':<15} {'Shortage Schools':<18} {'Total Deficit':<15}")
    print("-" * 75)
    for mandal in sorted(mandal_shortage.keys()):
        stats = mandal_shortage[mandal]
        print(f"{mandal:<25} {stats['total']:<15} {stats['shortage']:<18} {stats['sum_shortage']:<15}")
    
    conn.close()
    return shortage_details

def audit_teacher_meo_mapping():
    """Audit teacher-to-MEO mapping consistency"""
    conn = get_db()
    c = conn.cursor()
    
    print("\n" + "="*80)
    print("ISSUE 2: TEACHER-TO-MEO VALIDATION")
    print("="*80)
    
    # Get all teachers and MEOs
    teachers = c.execute("SELECT * FROM teachers").fetchall()
    teachers_list = [dict(t) for t in teachers]
    
    meos = c.execute("SELECT * FROM meos").fetchall()
    meos_dict = {m['meo_id']: dict(m) for m in meos}
    meo_mandals = {m['meo_id']: m['assigned_mandal'] for m in meos}
    
    print(f"\nBasic Counts:")
    print(f"  Total Teachers: {len(teachers_list)}")
    print(f"  Total MEOs: {len(meos_dict)}")
    
    # Validation checks
    issues = {
        'null_meo': [],
        'invalid_meo': [],
        'meo_mandal_mismatch': [],
    }
    
    for t in teachers_list:
        teacher_id = t['teacher_id']
        assigned_meo = t['assigned_meo']
        teacher_mandal = t['mandal']
        
        # Check 1: NULL assigned_meo
        if not assigned_meo:
            issues['null_meo'].append({
                'teacher_id': teacher_id,
                'name': t['name'],
                'mandal': teacher_mandal
            })
        else:
            # Check 2: Invalid assigned_meo
            if assigned_meo not in meos_dict:
                issues['invalid_meo'].append({
                    'teacher_id': teacher_id,
                    'assigned_meo': assigned_meo,
                    'mandal': teacher_mandal
                })
            else:
                # Check 3: MEO-mandal mismatch
                meo_mandal = meo_mandals.get(assigned_meo)
                if meo_mandal != teacher_mandal:
                    issues['meo_mandal_mismatch'].append({
                        'teacher_id': teacher_id,
                        'assigned_meo': assigned_meo,
                        'teacher_mandal': teacher_mandal,
                        'meo_mandal': meo_mandal
                    })
    
    print(f"\nValidation Results:")
    print(f"  Teachers with NULL assigned_meo: {len(issues['null_meo'])}")
    print(f"  Teachers with invalid assigned_meo: {len(issues['invalid_meo'])}")
    print(f"  Teachers with MEO-mandal mismatch: {len(issues['meo_mandal_mismatch'])}")
    
    total_issues = sum(len(v) for v in issues.values())
    if total_issues == 0:
        print(f"\n[OK] ALL CHECKS PASSED - Teacher-MEO mapping is valid")
    else:
        print(f"\n[ERROR] ISSUES FOUND - {total_issues} inconsistencies detected")
        
        if issues['null_meo']:
            print(f"\nTeachers with NULL assigned_meo (first 5):")
            for issue in issues['null_meo'][:5]:
                print(f"  {issue['teacher_id']}: {issue['name']} (Mandal: {issue['mandal']})")
        
        if issues['invalid_meo']:
            print(f"\nTeachers with invalid assigned_meo (first 5):")
            for issue in issues['invalid_meo'][:5]:
                print(f"  {issue['teacher_id']}: assigned_meo={issue['assigned_meo']}, mandal={issue['mandal']}")
        
        if issues['meo_mandal_mismatch']:
            print(f"\nTeachers with MEO-mandal mismatch (first 5):")
            for issue in issues['meo_mandal_mismatch'][:5]:
                print(f"  {issue['teacher_id']}: teacher_mandal={issue['teacher_mandal']}, meo_mandal={issue['meo_mandal']}")
    
    # Distribution check
    print(f"\nTeacher Distribution by MEO:")
    meo_teacher_count = defaultdict(int)
    for t in teachers_list:
        if t['assigned_meo']:
            meo_teacher_count[t['assigned_meo']] += 1
    
    print(f"{'MEO ID':<10} {'Mandal':<25} {'Teacher Count':<15}")
    print("-" * 50)
    for meo_id in sorted(meo_teacher_count.keys()):
        mandal = meo_mandals.get(meo_id, 'Unknown')
        count = meo_teacher_count[meo_id]
        print(f"{meo_id:<10} {mandal:<25} {count:<15}")
    
    conn.close()
    return issues

def audit_meo_teacher_mapping():
    """Audit MEO-to-teacher mapping"""
    conn = get_db()
    c = conn.cursor()
    
    print("\n" + "="*80)
    print("ISSUE 3: MEO-TO-TEACHER MAPPING")
    print("="*80)
    
    # Get all MEOs and teachers
    teachers = c.execute("SELECT * FROM teachers").fetchall()
    teachers_list = [dict(t) for t in teachers]
    
    meos = c.execute("SELECT * FROM meos").fetchall()
    meos_list = [dict(m) for m in meos]
    
    print(f"\nMEO Teacher Assignment:")
    print(f"{'MEO ID':<10} {'Name':<30} {'Mandal':<25} {'Assigned Teachers':<20}")
    print("-" * 85)
    
    total_assigned = 0
    meos_with_no_teachers = []
    
    for meo in sorted(meos_list, key=lambda x: x['meo_id']):
        meo_id = meo['meo_id']
        teacher_count = len([t for t in teachers_list if t['assigned_meo'] == meo_id])
        total_assigned += teacher_count
        
        if teacher_count == 0:
            meos_with_no_teachers.append(meo_id)
        
        print(f"{meo_id:<10} {meo['name']:<30} {meo['assigned_mandal']:<25} {teacher_count:<20}")
    
    print(f"\nTotal Teachers Assigned: {total_assigned}")
    print(f"Total Teachers Expected: {len(teachers_list)}")
    print(f"Unassigned Teachers: {len(teachers_list) - total_assigned}")
    
    if meos_with_no_teachers:
        print(f"\n[WARNING] MEOs with no assigned teachers: {len(meos_with_no_teachers)}")
        for meo_id in meos_with_no_teachers:
            meo = next((m for m in meos_list if m['meo_id'] == meo_id), None)
            if meo:
                print(f"  {meo_id}: {meo['name']} ({meo['assigned_mandal']})")
    
    conn.close()

if __name__ == "__main__":
    shortage_details = audit_shortage_schools()
    issues = audit_teacher_meo_mapping()
    audit_meo_teacher_mapping()
    
    print("\n" + "="*80)
    print("SUMMARY")
    print("="*80)
    print(f"Current shortage schools: {len(shortage_details)}")
    print(f"Target shortage schools: 78")
    print(f"Additional shortages needed: {78 - len(shortage_details)}")
