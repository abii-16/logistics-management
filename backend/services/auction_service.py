from database.db import supabase_client
from models.schemas import BidCreate


def list_bids() -> list[dict]:
    if not supabase_client:
        return []
    try:
        response = supabase_client.table("bids").select("*").execute()
        bids = []
        for row in response.data:
            bids.append({
                "id": row["id"],
                "driver_name": row["driver_name"],
                "vehicle": row["vehicle"],
                "amount": row["amount"],
                "reliability_score": row["reliability_score"],
                "status": row["status"]
            })
        return sorted(bids, key=lambda bid: (int(bid["amount"]), -int(bid["reliability_score"])))
    except Exception as e:
        print(f"Error listing bids: {e}")
        return []


def create_bid(payload: BidCreate) -> dict:
    if not supabase_client:
        return {}
    try:
        count_res = supabase_client.table("bids").select("id", count="exact").execute()
        count = count_res.count if count_res.count is not None else 0
        bid_id = f"B{801 + count}"
        
        bid_row = {
            "id": bid_id,
            "driver_name": payload.driver_name,
            "vehicle": payload.vehicle,
            "amount": payload.amount,
            "reliability_score": payload.reliability_score,
            "status": "Open"
        }
        
        insert_res = supabase_client.table("bids").insert(bid_row).execute()
        return insert_res.data[0]
    except Exception as e:
        print(f"Error creating bid: {e}")
        return {}

