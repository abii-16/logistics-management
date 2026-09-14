from fastapi import APIRouter

from database.db import supabase_client
from models.schemas import Driver

router = APIRouter()


@router.get("", response_model=list[Driver])
def list_drivers():
    if not supabase_client:
        return []
    try:
        response = supabase_client.table("drivers").select("*, users(name, phone)").execute()
        drivers = []
        for row in response.data:
            user_info = row.get("users", {}) or {}
            drivers.append(Driver(
                id=str(row["id"]),
                name=user_info.get("name", "Unknown Driver"),
                phone=user_info.get("phone", ""),
                vehicle_number=row["vehicle_number"],
                vehicle_type=row["vehicle_type"],
                license_number=row["license_number"],
                reliability_score=row["reliability_score"]
            ))
        return drivers
    except Exception as e:
        print(f"Error querying drivers from Supabase: {e}")
        return []

