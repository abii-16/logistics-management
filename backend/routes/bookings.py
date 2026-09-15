from fastapi import APIRouter, HTTPException, Query
from typing import Optional

from database.db import supabase_client
from models.schemas import Booking, BookingCreate
from services.notification_service import booking_confirmation
from services.geocoding_service import geocode_village
from services.destination_service import normalize_destination
from services.pricing_service import calculate_individual_cost

router = APIRouter()


@router.get("", response_model=list[Booking])
def list_bookings(phone: str = None, farmer_id: str = None, pickup_date: str = None, pickup_slot: str = None):
    """
    List bookings. Supports filtering by:
    - phone or farmer_id (for farmer-specific view)
    - pickup_date (for driver slot view)
    - pickup_slot (morning/afternoon/evening)
    """
    if not supabase_client:
        return []
    try:
        query = supabase_client.table("orders").select("*")
        
        # Filter by farmer if phone or farmer_id is provided
        if phone:
            query = query.eq("phone", phone)
        elif farmer_id:
            query = query.eq("farmer_id", farmer_id)
        
        # Filter by date and slot for driver view
        if pickup_date:
            query = query.eq("pickup_date", pickup_date)
        if pickup_slot:
            query = query.eq("pickup_slot", pickup_slot)
            
        response = query.order("created_at", desc=True).execute()
        bookings = []
        for row in response.data:
            bookings.append(Booking(
                id=row["id"],
                farmer_name=row["farmer_name"],
                phone=row["phone"],
                village=row["village"],
                crop=row["crop"],
                weight_kg=row["weight_kg"],
                destination=row["destination"],
                status=row["status"],
                individual_cost=row["individual_cost"],
                shared_cost=row["shared_cost"],
                pickup_time=row["pickup_time"] or "Awaiting cluster",
                pickup_date=row.get("pickup_date"),
                pickup_slot=row.get("pickup_slot"),
                is_time_flexible=row.get("is_time_flexible", True),
                source=row.get("source", "Web Dashboard"),
                language=row.get("language", "en"),
                confidence=row.get("confidence", None),
                review_required=row.get("review_required", False),
                assigned_driver=row.get("assigned_driver"),
                final_cost=row.get("final_cost")
            ))
        return bookings
    except Exception as e:
        print(f"Error querying bookings from Supabase: {e}")
        return []


@router.get("/slots/summary")
def get_slot_summary():
    """
    Get summary of available loads grouped by date and time slot.
    Returns aggregated data for driver dashboard.
    """
    if not supabase_client:
        return []
    
    try:
        from datetime import date, timedelta
        from collections import defaultdict
        
        # Get orders from today onwards with status "Pending" or "Cluster Forming"
        today = date.today()
        response = supabase_client.table("orders").select("*").in_("status", ["Pending", "Cluster Forming"]).gte("pickup_date", today.isoformat()).execute()
        
        # Group by date and slot
        slots_data = defaultdict(lambda: defaultdict(lambda: {"orders": 0, "weight_kg": 0, "estimated_value": 0, "flexible_count": 0}))
        
        for row in response.data:
            if not row.get("pickup_date") or not row.get("pickup_slot"):
                continue
                
            pickup_date = row["pickup_date"]
            pickup_slot = row["pickup_slot"]
            
            slots_data[pickup_date][pickup_slot]["orders"] += 1
            slots_data[pickup_date][pickup_slot]["weight_kg"] += row["weight_kg"]
            slots_data[pickup_date][pickup_slot]["estimated_value"] += row["shared_cost"]
            
            if row.get("is_time_flexible"):
                slots_data[pickup_date][pickup_slot]["flexible_count"] += 1
        
        # Convert to list format
        result = []
        for pickup_date in sorted(slots_data.keys()):
            for slot in ["morning", "afternoon", "evening"]:
                if slot in slots_data[pickup_date]:
                    data = slots_data[pickup_date][slot]
                    result.append({
                        "date": pickup_date,
                        "slot": slot,
                        "orders": data["orders"],
                        "weight_kg": data["weight_kg"],
                        "estimated_value": data["estimated_value"],
                        "flexible_count": data["flexible_count"]
                    })
        
        return result
    except Exception as e:
        print(f"Error getting slot summary: {e}")
        return []


@router.post("", response_model=Booking)
def create_booking(payload: BookingCreate):
    if not supabase_client:
        raise HTTPException(status_code=500, detail="Database client not configured")
    try:
        # Fetch total count of bookings to generate ID
        count_response = supabase_client.table("orders").select("id", count="exact").execute()
        total_count = count_response.count if count_response.count is not None else 0
        booking_id = f"KB{1024 + total_count}"
        
        # Check if a user with this phone exists, otherwise create one
        user_response = supabase_client.table("users").select("id").eq("phone", payload.phone).execute()
        if user_response.data:
            farmer_id = user_response.data[0]["id"]
        else:
            new_user = {
                "name": payload.farmer_name,
                "phone": payload.phone,
                "village": payload.village,
                "role": "farmer"
            }
            ins_user = supabase_client.table("users").insert(new_user).execute()
            farmer_id = ins_user.data[0]["id"]
 
        # Geocode the village to lat/lng
        lat, lng = geocode_village(payload.village)
        
        # Calculate pickup time display
        pickup_time_str = "Awaiting cluster"
        
        if payload.pickup_date and payload.pickup_slot:
            from datetime import datetime
            
            # Map slot to time ranges
            slot_times = {
                "morning": ("06:00", "10:00"),
                "afternoon": ("11:00", "15:00"),
                "evening": ("16:00", "20:00")
            }
            
            start_time, end_time = slot_times.get(payload.pickup_slot, ("06:00", "10:00"))
            
            flexibility = "flexible" if payload.is_time_flexible else "exact"
            pickup_time_str = f"{payload.pickup_date.strftime('%b %d')} {start_time}-{end_time} ({flexibility})"

        # Calculate individual cost based on real distance to mandi
        normalized_dest = normalize_destination(payload.destination)
        individual_cost = calculate_individual_cost(payload.weight_kg, lat, lng, normalized_dest)

        booking_row = {
            "id": booking_id,
            "farmer_id": farmer_id,
            "farmer_name": payload.farmer_name,
            "phone": payload.phone,
            "village": payload.village,
            "crop": payload.crop,
            "weight_kg": payload.weight_kg,
            "destination": normalized_dest,
            "status": "Pending",
            "individual_cost": individual_cost,
            "shared_cost": round(payload.weight_kg * 3.5),
            "pickup_time": pickup_time_str if payload.pickup_date and payload.pickup_slot else "Awaiting cluster",
            "pickup_date": payload.pickup_date.isoformat() if payload.pickup_date else None,
            "pickup_slot": payload.pickup_slot,
            "is_time_flexible": payload.is_time_flexible,
            "source": "Web Dashboard",
            "language": "en",
            "confidence": None,
            "review_required": False,
            "lat": lat,
            "lng": lng,
        }
        
        insert_response = supabase_client.table("orders").insert(booking_row).execute()
        # Trigger notification
        booking_confirmation(payload, booking_id)
        
        row = insert_response.data[0]
        return Booking(
            id=row["id"],
            farmer_name=row["farmer_name"],
            phone=row["phone"],
            village=row["village"],
            crop=row["crop"],
            weight_kg=row["weight_kg"],
            destination=row["destination"],
            status=row["status"],
            individual_cost=row["individual_cost"],
            shared_cost=row["shared_cost"],
            pickup_time=row["pickup_time"] or "Awaiting cluster",
            pickup_date=row.get("pickup_date"),
            pickup_slot=row.get("pickup_slot"),
            is_time_flexible=row.get("is_time_flexible", True),
            source=row.get("source", "Web Dashboard"),
            language=row.get("language", "en"),
            confidence=row.get("confidence", None),
            review_required=row.get("review_required", False),
            assigned_driver=row.get("assigned_driver"),
            final_cost=row.get("final_cost")
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error creating booking in Supabase: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{booking_id}", response_model=Booking)
def update_booking(booking_id: str, payload: BookingCreate):
    if not supabase_client:
        raise HTTPException(status_code=500, detail="Database client not configured")
    try:
        # Check if booking exists
        existing = supabase_client.table("orders").select("*").eq("id", booking_id).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Booking not found")
            
        # Recalculate costs and re-geocode if village changed
        lat, lng = geocode_village(payload.village)
        normalized_dest = normalize_destination(payload.destination)
        individual_cost = calculate_individual_cost(payload.weight_kg, lat, lng, normalized_dest)
        shared_cost = individual_cost  # reset to individual until re-clustering

        update_data = {
            "farmer_name": payload.farmer_name,
            "phone": payload.phone,
            "village": payload.village,
            "crop": payload.crop,
            "weight_kg": payload.weight_kg,
            "destination": normalized_dest,
            "individual_cost": individual_cost,
            "shared_cost": shared_cost,
            "review_required": False,
            "lat": lat,
            "lng": lng,
        }
        
        response = supabase_client.table("orders").update(update_data).eq("id", booking_id).execute()
        if not response.data:
            raise HTTPException(status_code=400, detail="Failed to update booking")
            
        row = response.data[0]
        return Booking(
            id=row["id"],
            farmer_name=row["farmer_name"],
            phone=row["phone"],
            village=row["village"],
            crop=row["crop"],
            weight_kg=row["weight_kg"],
            destination=row["destination"],
            status=row["status"],
            individual_cost=row["individual_cost"],
            shared_cost=row["shared_cost"],
            pickup_time=row["pickup_time"] or "Awaiting cluster",
            source=row.get("source", "Web Dashboard"),
            language=row.get("language", "en"),
            confidence=row.get("confidence", None),
            review_required=row.get("review_required", False),
            assigned_driver=row.get("assigned_driver"),
            final_cost=row.get("final_cost")
        )
    except Exception as e:
        print(f"Error updating booking: {e}")
        raise HTTPException(status_code=500, detail=str(e))


