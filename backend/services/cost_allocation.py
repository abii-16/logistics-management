"""
services/cost_allocation.py

Allocates the cluster's total truck cost across farmers using
70% weight-based + 30% distance-based shares, instead of every
farmer in a cluster paying the same flat per-kg rate.

Total truck cost = sum(weight_kg) * 3.5  (same as before)
Only the split between farmers changes.
"""

import math
from services.geo import get_coordinates

MANDI_COORDS = (135.0, 145.0)  # Koyambedu Mandi approx center
FLAT_RATE_PER_KG = 3.5
WEIGHT_WEIGHT = 0.7
DISTANCE_WEIGHT = 0.3


def _distance(a: tuple[float, float], b: tuple[float, float]) -> float:
    return math.dist(a, b)


def _build_route(orders: list[dict]) -> list[dict]:
    """Nearest-neighbor route starting at the Mandi.
    Returns legs in visiting order, each with distance from previous stop.
    Final return leg to Mandi appended with order_id=None.
    """
    remaining = orders.copy()
    current = MANDI_COORDS
    legs = []

    while remaining:
        nearest = min(
            remaining,
            key=lambda o: _distance(current, get_coordinates(o["village"])),
        )
        coords = get_coordinates(nearest["village"])
        legs.append({
            "order_id": nearest["id"],
            "distance_km": round(_distance(current, coords), 3)
        })
        current = coords
        remaining.remove(nearest)

    # return leg — shared cost, not assigned to any farmer
    legs.append({
        "order_id": None,
        "distance_km": round(_distance(current, MANDI_COORDS), 3)
    })
    return legs


def allocate_cluster_costs(orders: list[dict]) -> dict:
    """
    orders: raw Supabase order rows for one DBSCAN cluster.
    Needs: id, village, weight_kg, individual_cost.

    Returns:
        total_distance_km, total_bundle_cost,
        farmer_costs: [{ order_id, distance_km, weight_share,
                         distance_share, allocation_fraction,
                         bundled_cost, savings, savings_percent }]
    """
    if not orders:
        return {"total_distance_km": 0.0, "total_bundle_cost": 0, "farmer_costs": []}

    legs = _build_route(orders)
    farmer_legs = [leg for leg in legs if leg["order_id"] is not None]
    total_distance_km = round(sum(leg["distance_km"] for leg in legs), 3)
    farmer_leg_total = sum(leg["distance_km"] for leg in farmer_legs) or 1.0

    total_weight = sum(int(o["weight_kg"]) for o in orders)
    total_bundle_cost = round(total_weight * FLAT_RATE_PER_KG)

    distance_by_order = {leg["order_id"]: leg["distance_km"] for leg in farmer_legs}
    orders_by_id = {o["id"]: o for o in orders}

    farmer_costs = []
    for order_id, leg_distance in distance_by_order.items():
        order = orders_by_id[order_id]
        weight_share = int(order["weight_kg"]) / total_weight
        distance_share = leg_distance / farmer_leg_total
        allocation_fraction = WEIGHT_WEIGHT * weight_share + DISTANCE_WEIGHT * distance_share
        bundled_cost = round(allocation_fraction * total_bundle_cost)
        individual_cost = int(order["individual_cost"])
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
