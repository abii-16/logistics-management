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
def list_bookings(phone: Optional[str] = Query(None)):
    if not supabase_client:
        return []
    try:
        query = supabase_client.table("orders").select("*").order("created_at", desc=True)
        if phone:
            query = query.eq("phone", phone)
        response = query.execute()
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
                source=row.get("source", "Web Dashboard"),
                language=row.get("language", "en"),
                confidence=row.get("confidence", None),
                review_required=row.get("review_required", False)
            ))
        return bookings
    except Exception as e:
        print(f"Error querying bookings from Supabase: {e}")
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
            "shared_cost": individual_cost,  # same as individual until clustering runs
            "pickup_time": "Awaiting cluster",
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
            source=row.get("source", "Web Dashboard"),
            language=row.get("language", "en"),
            confidence=row.get("confidence", None),
            review_required=row.get("review_required", False)
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
            review_required=row.get("review_required", False)
        )
    except Exception as e:
        print(f"Error updating booking: {e}")
        raise HTTPException(status_code=500, detail=str(e))


