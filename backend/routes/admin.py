from fastapi import APIRouter
from datetime import datetime, timezone, timedelta

from database.db import supabase_client
from database.seed_data import BIDS, BOOKINGS
from models.schemas import ExtractionRequest
from services.clustering_service import build_clusters, next_slot_time, slot_label, IST
from services.extraction_service import extract_from_transcript
from services.recommendation_service import generate_recommendation

router = APIRouter()


@router.post("/run-clustering")
def run_clustering():
    """Manually trigger clustering — useful for testing without waiting for slot."""
    try:
        clusters = build_clusters()
        return {
            "success": True,
            "clusters_formed": len(clusters),
            "clusters": clusters,
            "next_slot": slot_label(next_slot_time()),
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


@router.get("/slot-status")
def slot_status():
    """Returns current slot info and how many Pending orders are waiting."""
    pending_count = 0
    if supabase_client:
        try:
            res = supabase_client.table("orders").select("id", count="exact").eq("status", "Pending").execute()
            pending_count = res.count or 0
        except Exception:
            pass

    slot_dt = next_slot_time()
    now_ist = datetime.now(IST)
    wait_seconds = (slot_dt - now_ist).total_seconds()

    return {
        "next_slot": slot_label(slot_dt),
        "next_slot_iso": slot_dt.isoformat(),
        "wait_minutes": round(wait_seconds / 60),
        "pending_orders": pending_count,
    }


@router.get("/snapshot")
def snapshot():
    extraction = extract_from_transcript(
        ExtractionRequest(
            transcript="Naan Arumugam. Melma gramathula irukken. En kitta 400 kilo thakkali irukku.",
            language="ta",
        )
    )
    recommendation = generate_recommendation()

    # Slot info
    slot_dt = next_slot_time()
    now_ist = datetime.now(IST)
    wait_minutes = round((slot_dt - now_ist).total_seconds() / 60)

    if supabase_client:
        try:
            orders_res = supabase_client.table("orders").select("*").order("created_at", desc=True).execute()
            orders = orders_res.data

            bids_res = supabase_client.table("bids").select("*").execute()
            bids = bids_res.data

            individual_cost = sum(int(o["individual_cost"]) for o in orders)
            shared_cost = sum(int(o["shared_cost"]) for o in orders)
            pending_count = sum(1 for o in orders if o["status"] == "Pending")

            return {
                "extraction": extraction,
                "recommendation": recommendation,
                "orders": orders,
                "bids": bids,
                "slot": {
                    "next_slot": slot_label(slot_dt),
                    "wait_minutes": wait_minutes,
                    "pending_orders": pending_count,
                },
                "savingsTrend": [
                    {"label": "Mon", "value": 1200},
                    {"label": "Tue", "value": 2600},
                    {"label": "Wed", "value": 3900},
                    {"label": "Thu", "value": max(0, individual_cost - shared_cost)},
                    {"label": "Fri", "value": max(0, individual_cost - shared_cost + 1750)},
                ],
            }
        except Exception as e:
            print(f"Error preparing snapshot from Supabase: {e}")

    individual_cost = sum(int(booking["individual_cost"]) for booking in BOOKINGS)
    shared_cost = sum(int(booking["shared_cost"]) for booking in BOOKINGS)
    return {
        "extraction": extraction,
        "recommendation": recommendation,
        "orders": BOOKINGS,
        "bids": BIDS,
        "slot": {
            "next_slot": slot_label(slot_dt),
            "wait_minutes": wait_minutes,
            "pending_orders": 0,
        },
        "savingsTrend": [
            {"label": "Mon", "value": 1200},
            {"label": "Tue", "value": 2600},
            {"label": "Wed", "value": 3900},
            {"label": "Thu", "value": individual_cost - shared_cost},
            {"label": "Fri", "value": individual_cost - shared_cost + 1750},
        ],
    }

