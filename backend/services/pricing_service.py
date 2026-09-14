"""
services/pricing_service.py

Calculates individual and shared transport costs based on real distance.

Individual cost = what the farmer would pay hiring a truck alone:
    individual_cost = distance_to_mandi_km × COST_PER_KM × (weight_kg / TRUCK_CAPACITY_KG)

Shared cost = set by cost_allocation.py after clustering.
"""

import math

COST_PER_KM       = 20       # ₹20 per km (Tamil Nadu truck hire rate)
TRUCK_CAPACITY_KG = 1100     # Standard cooperative truck
FALLBACK_RATE_PER_KG = 8     # Fallback flat rate when distance is unknown

# Known mandi coordinates (mirrors route_optimization.py)
MANDI_COORDS = {
    "koyambedu mandi":  {"lat": 13.0716, "lng": 80.1945},
    "madurai mandi":    {"lat":  9.9252, "lng": 78.1198},
    "coimbatore mandi": {"lat": 11.0168, "lng": 76.9558},
    "salem mandi":      {"lat": 11.6643, "lng": 78.1460},
    "trichy mandi":     {"lat": 10.7905, "lng": 78.7047},
    "vellore mandi":    {"lat": 12.9165, "lng": 79.1325},
    "delhi mandi":      {"lat": 28.7196, "lng": 77.1724},
}


def _haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng / 2) ** 2)
    return R * 2 * math.asin(math.sqrt(a))


def get_mandi_coords(destination: str) -> tuple[float, float] | None:
    """Return (lat, lng) for a known mandi destination string."""
    key = destination.strip().lower()
    for k, v in MANDI_COORDS.items():
        if k in key or key in k:
            return v["lat"], v["lng"]
    return None


def calculate_individual_cost(
    weight_kg: int,
    farmer_lat: float | None,
    farmer_lng: float | None,
    destination: str,
) -> int:
    """
    Returns the individual cost for a farmer transporting alone.

    Formula:
        individual_cost = distance_to_mandi_km × 20 × (weight_kg / 1100)

    Falls back to weight × 8 if coordinates are missing or mandi is unknown.
    """
    if farmer_lat and farmer_lng:
        mandi = get_mandi_coords(destination)
        if mandi:
            mandi_lat, mandi_lng = mandi
            distance_km = _haversine_km(farmer_lat, farmer_lng, mandi_lat, mandi_lng)
            cost = round(distance_km * COST_PER_KM * (weight_kg / TRUCK_CAPACITY_KG))
            # Ensure minimum reasonable cost (short distances can give very low values)
            return max(cost, round(weight_kg * 3))

    # Fallback: flat rate
    return round(weight_kg * FALLBACK_RATE_PER_KG)
