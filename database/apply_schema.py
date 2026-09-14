import os
import psycopg2

def apply_schema():
    schema_path = os.path.join(os.path.dirname(__file__), "schema.sql")
    print(f"Reading schema from: {schema_path}")
    
    with open(schema_path, "r", encoding="utf-8") as f:
        sql = f.read()

    host = "db.zufwhvweywjubyvbeeza.supabase.co"
    port = 5432
    database = "postgres"
    user = "postgres"
    password = r"M45%/Dv*cbi%?93"

    print(f"Connecting to database {database} at {host}...")
    try:
        conn = psycopg2.connect(
            host=host,
            port=port,
            database=database,
            user=user,
            password=password
        )
        conn.autocommit = True
        cursor = conn.cursor()
        print("Connection successful! Executing schema SQL...")
        cursor.execute(sql)
        print("Schema applied successfully!")
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Error applying schema: {e}")

if __name__ == "__main__":
    apply_schema()
