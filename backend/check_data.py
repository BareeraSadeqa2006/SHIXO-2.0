import sqlite3

conn = sqlite3.connect('shixo.db')
c = conn.cursor()

# Get table names
tables = c.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()

print("=" * 60)
print("DATABASE STATISTICS")
print("=" * 60)

for table_name in tables:
    table = table_name[0]
    
    # Get column count and names
    cols = c.execute(f"PRAGMA table_info({table})").fetchall()
    col_count = len(cols)
    col_names = [col[1] for col in cols]
    
    # Get row count
    row_count = c.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
    
    print(f"\n📊 TABLE: {table.upper()}")
    print(f"   Rows: {row_count} | Columns: {col_count}")
    print(f"   Columns: {', '.join(col_names[:5])}", end="")
    if col_count > 5:
        print(f", ... +{col_count-5} more")
    else:
        print()

print("\n" + "=" * 60)
print("TOTAL SUMMARY")
print("=" * 60)

total_rows = sum(c.execute(f"SELECT COUNT(*) FROM {t[0]}").fetchone()[0] for t in tables)
total_cols = sum(len(c.execute(f"PRAGMA table_info({t[0]})").fetchall()) for t in tables)

print(f"Total Tables: {len(tables)}")
print(f"Total Rows Across All Tables: {total_rows:,}")
print(f"Total Columns Across All Tables: {total_cols}")

conn.close()
