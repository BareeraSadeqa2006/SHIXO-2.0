#!/usr/bin/env python
"""Debug script to analyze transfer attempts and visibility"""
import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), 'shixo.db')
conn = sqlite3.connect(db_path)
conn.row_factory = sqlite3.Row
c = conn.cursor()

print("=" * 80)
print("Teachers with highest transfer attempt counts:")
print("=" * 80)

c.execute('SELECT teacher_id, transfer_attempt_count, transfer_status FROM teachers ORDER BY transfer_attempt_count DESC LIMIT 10')
teachers = c.fetchall()

for t in teachers:
    teacher_id = t['teacher_id']
    attempt_count = t['transfer_attempt_count']
    status = t['transfer_status']
    
    if attempt_count > 0:
        print(f"\n{teacher_id}: attempts={attempt_count}, status={status}")
        
        # Get their transfer requests
        c.execute('''SELECT request_id, status, mandal, assigned_meo, request_date 
                     FROM transfer_requests 
                     WHERE teacher_id = ? 
                     ORDER BY request_date DESC''', (teacher_id,))
        reqs = c.fetchall()
        print(f"  Total requests in DB: {len(reqs)}")
        
        for i, r in enumerate(reqs, 1):
            print(f"    Request {i}: {r['request_id']}")
            print(f"      Status: {r['status']}")
            print(f"      Mandal: {r['mandal']}")
            print(f"      Assigned MEO: {r['assigned_meo']}")
            print(f"      Date: {r['request_date']}")
        
        # Check if attempt_count matches number of resolved requests
        c.execute('''SELECT COUNT(*) as resolved_count 
                     FROM transfer_requests 
                     WHERE teacher_id = ? AND status IN ('Approved', 'Rejected')''', (teacher_id,))
        resolved = c.fetchone()['resolved_count']
        print(f"  Resolved requests: {resolved}")
        
        if resolved != attempt_count:
            print(f"  ⚠️  MISMATCH: attempt_count ({attempt_count}) != resolved requests ({resolved})")

conn.close()
