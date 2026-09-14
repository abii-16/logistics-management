import psycopg2

def update_schema():
    host = "db.zufwhvweywjubyvbeeza.supabase.co"
    port = 5432
    database = "postgres"
    user = "postgres"
    password = r"M45%/Dv*cbi%?93"

    print("Connecting to database for schema update...")
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
        print("Connected! Adding columns to orders table...")

        # Add new columns to orders
        cursor.execute("alter table orders add column if not exists source text default 'Web Dashboard';")
        cursor.execute("alter table orders add column if not exists language text default 'en';")
        cursor.execute("alter table orders add column if not exists confidence jsonb;")
        cursor.execute("alter table orders add column if not exists review_required boolean default false;")

        print("Columns added successfully!")
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Error updating schema: {e}")

if __name__ == "__main__":
    update_schema()
