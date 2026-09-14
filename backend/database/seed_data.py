BOOKINGS = [
    {
        "id": "KB1024",
        "farmer_name": "Arumugam",
        "phone": "+91 90030 11224",
        "village": "Melma",
        "crop": "Tomato",
        "weight_kg": 400,
        "status": "Driver Assigned",
        "destination": "Koyambedu Mandi",
        "individual_cost": 3400,
        "shared_cost": 1450,
        "pickup_time": "Today, 5:30 PM",
    },
    {
        "id": "KB1025",
        "farmer_name": "Meena",
        "phone": "+91 94441 22009",
        "village": "Athur",
        "crop": "Tomato",
        "weight_kg": 320,
        "status": "Cluster Forming",
        "destination": "Koyambedu Mandi",
        "individual_cost": 3100,
        "shared_cost": 1320,
        "pickup_time": "Today, 5:45 PM",
    },
    {
        "id": "KB1026",
        "farmer_name": "Rafiq",
        "phone": "+91 81221 47770",
        "village": "Sevoor",
        "crop": "Brinjal",
        "weight_kg": 250,
        "status": "Pending",
        "destination": "Koyambedu Mandi",
        "individual_cost": 2600,
        "shared_cost": 1180,
        "pickup_time": "Today, 6:10 PM",
    },
]

DRIVERS = [
    {
        "id": "D100",
        "name": "Kannan",
        "phone": "+91 98844 77882",
        "vehicle_number": "TN 11 AB 4472",
        "vehicle_type": "Tata Ace",
        "license_number": "TN2021007711",
        "reliability_score": 96,
    },
    {
        "id": "D101",
        "name": "Selvi Logistics",
        "phone": "+91 90801 12234",
        "vehicle_number": "TN 22 CD 1932",
        "vehicle_type": "Mahindra Bolero Pickup",
        "license_number": "TN2019034821",
        "reliability_score": 91,
    },
]

BIDS = [
    {"id": "B801", "driver_name": "Kannan", "vehicle": "Tata Ace", "amount": 4350, "reliability_score": 96, "status": "Leading"},
    {"id": "B802", "driver_name": "Selvi Logistics", "vehicle": "Bolero Pickup", "amount": 4620, "reliability_score": 91, "status": "Open"},
    {"id": "B803", "driver_name": "Velu", "vehicle": "Ashok Leyland Dost", "amount": 4890, "reliability_score": 88, "status": "Open"},
]

