"""
services/cost_allocation.py

Allocates the cluster's total truck cost across farmers using
70% weight-based + 30% distance-based shares.

Uses real lat/lng coordinates (from geocoding) for distance calculation.
Falls back to weight-only allocation if coordinates are missing.

Key invariant: bundled_cost <= individual_cost always.
For a solo farmer, bundled_cost == individual_cost (no savings, no penalty).
"""

import math

FLAT_RATE_PER_KG = 3.5
WEIGHT_WEIGHT = 0.7
DISTANCE_WEIGHT = 0.3


def _haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Real-world distance in km between two lat/lng points."""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng / 2) ** 2)
    return R * 2 * math.asin(math.sqrt(a))


def _build_route(orders: list[dict]) -> list[dict]:
    """
    Nearest-neighbor pickup route using real lat/lng.
    Starts from destination (approximated as centroid of all points + offset),
    visits each farmer, returns to start.
    Returns legs with order_id and distance_km.
    """
    # Use centroid of all farmer coords as proxy for mandi location
    # (actual mandi lat/lng not stored — this gives relative distances)
    valid = [(o, float(o["lat"]), float(o["lng"])) for o in orders if o.get("lat") and o.get("lng")]
    no_geo = [o for o in orders if not o.get("lat") or not o.get("lng")]

    if not valid:
        # No coordinates — equal distance shares
        legs = [{"order_id": o["id"], "distance_km": 1.0} for o in orders]
        return legs

    avg_lat = sum(lat for _, lat, _ in valid) / len(valid)
    avg_lng = sum(lng for _, _, lng in valid) / len(valid)

    # Nearest-neighbor from centroid
    remaining = list(valid)
    current_lat, current_lng = avg_lat, avg_lng
    legs = []

    while remaining:
        nearest = min(remaining, key=lambda t: _haversine_km(current_lat, current_lng, t[1], t[2]))
        order, lat, lng = nearest
        dist = _haversine_km(current_lat, current_lng, lat, lng)
        legs.append({"order_id": order["id"], "distance_km": round(dist, 3)})
        current_lat, current_lng = lat, lng
        remaining.remove(nearest)

    # Orders without GPS get average distance
    avg_leg = sum(l["distance_km"] for l in legs) / len(legs) if legs else 1.0
    for o in no_geo:
        legs.append({"order_id": o["id"], "distance_km": round(avg_leg, 3)})

    return legs


def allocate_cluster_costs(orders: list[dict]) -> dict:
    """
    Allocate total cluster truck cost across farmers.

    Invariants:
    - total_bundle_cost = sum(weight_kg) * FLAT_RATE_PER_KG
    - Each farmer's bundled_cost <= their individual_cost
    - Solo farmer: bundled_cost == individual_cost (no savings, no penalty)
    """
    if not orders:
        return {"total_distance_km": 0.0, "total_bundle_cost": 0, "farmer_costs": []}

    # Solo farmer — no savings, no penalty
    if len(orders) == 1:
        o = orders[0]
        individual_cost = int(o["individual_cost"])
        bundled_cost = individual_cost
        return {
            "total_distance_km": 0.0,
            "total_bundle_cost": bundled_cost,
            "farmer_costs": [{
                "order_id": o["id"],
                "distance_km": 0.0,
                "weight_share": 1.0,
                "distance_share": 1.0,
                "allocation_fraction": 1.0,
                "bundled_cost": bundled_cost,
                "savings": 0,
                "savings_percent": 0.0,
            }]
        }

    legs = _build_route(orders)
    total_distance_km = round(sum(l["distance_km"] for l in legs), 3)
    farmer_leg_total = sum(l["distance_km"] for l in legs) or 1.0

    total_weight = sum(int(o["weight_kg"]) for o in orders)
    total_bundle_cost = round(total_weight * FLAT_RATE_PER_KG)

    distance_by_order = {l["order_id"]: l["distance_km"] for l in legs}
    orders_by_id = {o["id"]: o for o in orders}

    farmer_costs = []
    for order_id, leg_distance in distance_by_order.items():
        order = orders_by_id[order_id]
        weight_share = int(order["weight_kg"]) / total_weight
        distance_share = leg_distance / farmer_leg_total
        allocation_fraction = WEIGHT_WEIGHT * weight_share + DISTANCE_WEIGHT * distance_share
        bundled_cost = round(allocation_fraction * total_bundle_cost)
        individual_cost = int(order["individual_cost"])

        # Invariant: bundled cost must never exceed individual cost
        bundled_cost = min(bundled_cost, individual_cost)

        savings = individual_cost - bundled_cost
        savings_percent = round((savings / individual_cost) * 100, 1) if individual_cost > 0 else 0.0

        farmer_costs.append({
            "order_id": order_id,
            "distance_km": leg_distance,
            "weight_share": round(weight_share, 4),
            "distance_share": round(distance_share, 4),
            "allocation_fraction": round(allocation_fraction, 4),
            "bundled_cost": bundled_cost,
            "savings": savings,
            "savings_percent": savings_percent,
        })

    return {
        "total_distance_km": total_distance_km,
        "total_bundle_cost": total_bundle_cost,
        "farmer_costs": farmer_costs,
    }
