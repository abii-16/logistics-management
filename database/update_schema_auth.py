import psycopg2

def update_schema_auth():
    host = "db.zufwhvweywjubyvbeeza.supabase.co"
    port = 5432
    database = "postgres"
    user = "postgres"
    password = r"M45%/Dv*cbi%?93"

    print("Connecting to database for auth schema updates...")
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
        print("Connected! Updating tables...")

        # 1. Alter users table
        cursor.execute("alter table users add column if not exists password text;")

        # 2. Create farmers table
        cursor.execute("""
        create table if not exists farmers (
          id uuid primary key references users(id) on delete cascade,
          village text,
          preferred_language text default 'ta',
          created_at timestamptz default now()
        );
        """)

        # 3. Alter drivers table
        cursor.execute("alter table drivers add column if not exists completed_trips integer default 24;")
        cursor.execute("alter table drivers add column if not exists rating numeric(3,2) default 4.8;")

        # 4. Alter bids table
        cursor.execute("alter table bids add column if not exists bid_amount integer;")
        cursor.execute("alter table bids add column if not exists timestamp timestamptz default now();")

        # 5. Create trip_assignments table
        cursor.execute("""
        create table if not exists trip_assignments (
          id uuid primary key default uuid_generate_v4(),
          driver_id uuid references drivers(id) on delete cascade,
          bundle_id text references bundles(id) on delete cascade,
          trip_status text not null default 'Assigned',
          start_time timestamptz,
          end_time timestamptz,
          created_at timestamptz default now()
        );
        """)

        # 6. Alter notifications table
        cursor.execute("alter table notifications add column if not exists user_id uuid references users(id) on delete cascade;")
        cursor.execute("alter table notifications add column if not exists title text;")
        cursor.execute("alter table notifications add column if not exists type text;")

        print("Auth schema migrations completed successfully!")
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Error during migrations: {e}")

if __name__ == "__main__":
    update_schema_auth()
