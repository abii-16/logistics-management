from database.db import supabase_client


def generate_recommendation() -> dict:
    if not supabase_client:
        return {
            "farmers": 0,
            "total_weight_kg": 0,
            "truck_utilization": 0,
            "estimated_savings": 0,
            "spoilage_risk": "Medium",
            "departure_time": "Today, 5:30 PM",
        }
    try:
        response = supabase_client.table("orders").select("*").execute()
        orders = response.data
        
        total_weight = sum(int(order["weight_kg"]) for order in orders)
        individual_cost = sum(int(order["individual_cost"]) for order in orders)
        shared_cost = sum(int(order["shared_cost"]) for order in orders)
        
        crops = set(order["crop"].lower() for order in orders)
        if "tomato" in crops or "tomatoes" in crops:
            spoilage_risk = "High" if len(orders) > 4 else "Medium"
        else:
            spoilage_risk = "Low"
            
        return {
            "farmers": len(orders),
            "total_weight_kg": total_weight,
            "truck_utilization": min(100, round((total_weight / 1100) * 100)) if total_weight > 0 else 0,
            "estimated_savings": max(0, individual_cost - shared_cost),
            "spoilage_risk": spoilage_risk,
            "departure_time": "Today, 5:30 PM",
        }
    except Exception as e:
        print(f"Error generating recommendation: {e}")
        return {
            "farmers": 0,
            "total_weight_kg": 0,
            "truck_utilization": 0,
            "estimated_savings": 0,
            "spoilage_risk": "Medium",
            "departure_time": "Today, 5:30 PM",
        }

