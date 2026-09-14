import psycopg2

def seed_database():
    host = "db.zufwhvweywjubyvbeeza.supabase.co"
    port = 5432
    database = "postgres"
    user = "postgres"
    password = r"M45%/Dv*cbi%?93"

    print("Connecting to database...")
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
        print("Connected! Seeding users...")

        # 1. Clean existing records
        cursor.execute("truncate table bids cascade;")
        cursor.execute("truncate table bundle_orders cascade;")
        cursor.execute("truncate table bundles cascade;")
        cursor.execute("truncate table orders cascade;")
        cursor.execute("truncate table vehicles cascade;")
        cursor.execute("truncate table drivers cascade;")
        cursor.execute("truncate table users cascade;")

        # 2. Insert Users
        users = [
            ("Arumugam", "+91 90030 11224", "Melma", "ta", "farmer"),
            ("Meena", "+91 94441 22009", "Athur", "ta", "farmer"),
            ("Rafiq", "+91 81221 47770", "Sevoor", "ta", "farmer"),
            ("Kannan", "+91 98844 77882", "Melma", "ta", "driver"),
            ("Selvi Logistics", "+91 90801 12234", "Athur", "ta", "driver"),
        ]

        user_ids = {}
        for name, phone, village, lang, role in users:
            cursor.execute(
                "insert into users (name, phone, village, preferred_language, role) values (%s, %s, %s, %s, %s) returning id;",
                (name, phone, village, lang, role)
            )
            user_ids[name] = cursor.fetchone()[0]
        
        print("Users seeded. Seeding drivers...")

        # 3. Insert Drivers
        drivers = [
            (user_ids["Kannan"], "TN 11 AB 4472", "Tata Ace", "TN2021007711", 96),
            (user_ids["Selvi Logistics"], "TN 22 CD 1932", "Mahindra Bolero Pickup", "TN2019034821", 91),
        ]
        
        driver_ids = {}
        for user_id, veh_num, veh_type, lic_num, score in drivers:
            cursor.execute(
                "insert into drivers (user_id, vehicle_number, vehicle_type, license_number, reliability_score) values (%s, %s, %s, %s, %s) returning id;",
                (user_id, veh_num, veh_type, lic_num, score)
            )
            d_id = cursor.fetchone()[0]
            cursor.execute("select name from users where id = %s;", (user_id,))
            name = cursor.fetchone()[0]
            driver_ids[name] = d_id
        
        print("Drivers seeded. Seeding orders...")

        # 4. Insert Orders
        orders = [
            ("KB1024", user_ids["Arumugam"], "Arumugam", "+91 90030 11224", "Melma", "Tomato", 400, "Koyambedu Mandi", "Driver Assigned", 3400, 1450, "Today, 5:30 PM"),
            ("KB1025", user_ids["Meena"], "Meena", "+91 94441 22009", "Athur", "Tomato", 320, "Koyambedu Mandi", "Cluster Forming", 3100, 1320, "Today, 5:45 PM"),
            ("KB1026", user_ids["Rafiq"], "Rafiq", "+91 81221 47770", "Sevoor", "Brinjal", 250, "Koyambedu Mandi", "Pending", 2600, 1180, "Today, 6:10 PM"),
        ]

        for id, f_id, name, phone, village, crop, weight, dest, status, ind_cost, sh_cost, pk_time in orders:
            cursor.execute(
                "insert into orders (id, farmer_id, farmer_name, phone, village, crop, weight_kg, destination, status, individual_cost, shared_cost, pickup_time) values (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);",
                (id, f_id, name, phone, village, crop, weight, dest, status, ind_cost, sh_cost, pk_time)
            )
        
        print("Database seeded successfully!")
        cursor.close()
        conn.close()

    except Exception as e:
        print(f"Error seeding database: {e}")

if __name__ == "__main__":
    seed_database()
