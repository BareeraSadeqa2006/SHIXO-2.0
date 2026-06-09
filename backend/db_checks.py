import sqlite3, json

conn = sqlite3.connect('backend/shixo.db')
c = conn.cursor()

print('schools_total', c.execute('select count(*) from schools').fetchone()[0])
print('schools_null_mandal', c.execute("select count(*) from schools where mandal is null or mandal='' ").fetchone()[0])
print('schools_null_district', c.execute("select count(*) from schools where district is null or district='' ").fetchone()[0])
print('teachers_total', c.execute('select count(*) from teachers').fetchone()[0])
print('teachers_missing_school_match', c.execute("select count(*) from teachers t left join schools s on t.current_school=s.school_id where s.school_id is null").fetchone()[0])

# Check how many schools have malformed subject_wise_vacancy (non-json)
bad = 0
for row in c.execute('select subject_wise_vacancy from schools').fetchall():
    val = row[0]
    try:
        if val is None:
            bad += 1
        else:
            json.loads(val)
    except Exception:
        bad += 1
print('schools_bad_vacancy_json', bad)

conn.close()
