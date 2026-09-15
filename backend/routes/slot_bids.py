"""
Slot Bidding Routes - Handle time slot specific bidding
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime

from database.db import supabase_client

router = APIRouter()


class SlotBidCreate(BaseModel):
    """Request model for creating a slot bid"""
    driver_id: str
    driver_name: str
    pickup_date: date
    pickup_slot: str  # morning, afternoon, evening
    amount: int  # Changed to int to match DB column type (INTEGER)
    vehicle: str
    reliability_score: Optional[int] = 94


class SlotBid(BaseModel):
    """Response model for slot bid"""
    id: str
    driver_id: Optional[str] = None  # Made optional since it can be NULL
    driver_name: str
    pickup_date: Optional[date] = None  # Made optional for order bids
    pickup_slot: Optional[str] = None  # Made optional for order bids
    amount: int  # Changed to int to match DB column type (INTEGER)
    vehicle: str
    reliability_score: int
    bid_type: str
    status: str
    created_at: datetime


@router.post("/slot", response_model=SlotBid)
def create_slot_bid(payload: SlotBidCreate):
    """
    Create a bid for a specific time slot (date + slot combination).
    Drivers bid on all orders within that time slot as a bundle.
    """
    if not supabase_client:
        raise HTTPException(status_code=500, detail="Database client not configured")
    
    try:
        # Validate slot value
        if payload.pickup_slot not in ["morning", "afternoon", "evening"]:
            raise HTTPException(status_code=400, detail="Invalid pickup_slot. Must be: morning, afternoon, or evening")
        
        # Check if orders exist for this slot
        orders_response = supabase_client.table("orders").select("id").eq("pickup_date", payload.pickup_date.isoformat()).eq("pickup_slot", payload.pickup_slot).in_("status", ["Pending", "Cluster Forming"]).execute()
        
        if not orders_response.data or len(orders_response.data) == 0:
            raise HTTPException(status_code=404, detail=f"No available orders for {payload.pickup_date} {payload.pickup_slot} slot")
        
        # Generate bid ID
        bid_id = f"SB-{int(datetime.now().timestamp() * 1000)}"
        
        # Insert bid record
        # driver_id can be NULL per schema (references drivers(id) on delete set null)
        # We rely on driver_name for display, not the foreign key
        bid_data = {
            "id": bid_id,
            "driver_id": None,  # NULL is allowed by schema
            "driver_name": payload.driver_name,
            "pickup_date": payload.pickup_date.isoformat(),
            "pickup_slot": payload.pickup_slot,
            "amount": int(payload.amount),
            "vehicle": payload.vehicle,
            "reliability_score": int(payload.reliability_score),
            "bid_type": "slot",
            "status": "Open",
            "bundle_id": None
        }
        
        insert_response = supabase_client.table("bids").insert(bid_data).execute()
        
        if not insert_response.data:
            raise HTTPException(status_code=500, detail="Failed to create slot bid")
        
        row = insert_response.data[0]
        
        return SlotBid(
            id=row["id"],
            driver_id=row.get("driver_id"),  # Can be None
            driver_name=row["driver_name"],
            pickup_date=datetime.fromisoformat(row["pickup_date"]).date(),
            pickup_slot=row["pickup_slot"],
            amount=row["amount"],  # Use amount (matches DB column)
            vehicle=row["vehicle"],
            reliability_score=row["reliability_score"],
            bid_type=row["bid_type"],
            status=row["status"],
            created_at=datetime.fromisoformat(row["created_at"].replace("Z", "+00:00"))
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error creating slot bid: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/slot/{pickup_date}/{pickup_slot}")
def get_slot_bids(pickup_date: str, pickup_slot: str):
    """
    Get all bids for a specific time slot (date + slot combination).
    Returns bids sorted by amount (lowest first).
    """
    if not supabase_client:
        raise HTTPException(status_code=500, detail="Database client not configured")
    
    try:
        # Validate slot value
        if pickup_slot not in ["morning", "afternoon", "evening"]:
            raise HTTPException(status_code=400, detail="Invalid pickup_slot. Must be: morning, afternoon, or evening")
        
        # Query bids for this slot
        response = supabase_client.table("bids").select("*").eq("pickup_date", pickup_date).eq("pickup_slot", pickup_slot).eq("bid_type", "slot").order("amount", desc=False).execute()
        
        bids = []
        for row in response.data:
            bids.append({
                "id": row["id"],
                "driver_id": row.get("driver_id"),  # Can be None
                "driver_name": row["driver_name"],
                "pickup_date": row["pickup_date"],
                "pickup_slot": row["pickup_slot"],
                "amount": row["amount"],  # Use amount (matches DB column)
                "vehicle": row["vehicle"],
                "reliability_score": row["reliability_score"],
                "bid_type": row["bid_type"],
                "status": row["status"],
                "created_at": row["created_at"]
            })
        
        return bids
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching slot bids: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/slot/summary")
def get_all_slot_bids_summary():
    """
    Get summary of all slot bids grouped by date and slot.
    Useful for analytics and monitoring.
    """
    if not supabase_client:
        return []
    
    try:
        from collections import defaultdict
        
        # Get all slot bids
        response = supabase_client.table("bids").select("*").eq("bid_type", "slot").execute()
        
        # Group by date and slot
        summary = defaultdict(lambda: defaultdict(lambda: {
            "bid_count": 0,
            "lowest_bid": None,
            "highest_bid": None,
            "avg_bid": 0,
            "bids": []
        }))
        
        for row in response.data:
            pickup_date = row["pickup_date"]
            pickup_slot = row["pickup_slot"]
            amount = row["amount"]  # Use amount (matches DB column)
            
            slot_data = summary[pickup_date][pickup_slot]
            slot_data["bid_count"] += 1
            slot_data["bids"].append(amount)
            
            if slot_data["lowest_bid"] is None or amount < slot_data["lowest_bid"]:
                slot_data["lowest_bid"] = amount
            if slot_data["highest_bid"] is None or amount > slot_data["highest_bid"]:
                slot_data["highest_bid"] = amount
        
        # Calculate averages and format result
        result = []
        for pickup_date in sorted(summary.keys()):
            for pickup_slot in ["morning", "afternoon", "evening"]:
                if pickup_slot in summary[pickup_date]:
                    slot_data = summary[pickup_date][pickup_slot]
                    slot_data["avg_bid"] = sum(slot_data["bids"]) / len(slot_data["bids"]) if slot_data["bids"] else 0
                    del slot_data["bids"]  # Remove raw bids list
                    
                    result.append({
                        "date": pickup_date,
                        "slot": pickup_slot,
                        **slot_data
                    })
        
        return result
        
    except Exception as e:
        print(f"Error getting slot bids summary: {e}")
        return []


@router.get("/slot/status/{pickup_date}/{pickup_slot}")
def get_slot_status(pickup_date: str, pickup_slot: str):
    """
    Get the status of a specific slot including:
    - Whether bidding is still open
    - When it closes
    - Current winning bid
    - Time remaining until close
    """
    try:
        from services.slot_bid_closer import should_close_slot, get_winning_bid, get_slot_closing_time
        from datetime import datetime
        
        # Check if slot should be closed
        should_close = should_close_slot(pickup_date, pickup_slot)
        
        # Get closing time
        closing_time = get_slot_closing_time(pickup_date, pickup_slot)
        
        # Get current winning bid
        winning_bid = get_winning_bid(pickup_date, pickup_slot)
        
        # Calculate time remaining
        from services.slot_bid_closer import IST
        now = datetime.now(IST)
        time_remaining = None
        if closing_time and closing_time > now:
            diff = closing_time - now
            hours = int(diff.total_seconds() // 3600)
            minutes = int((diff.total_seconds() % 3600) // 60)
            time_remaining = f"{hours}h {minutes}m"
        
        status = {
            "slot_date": pickup_date,
            "slot_time": pickup_slot,
            "bidding_open": not should_close,
            "should_close": should_close,
            "closing_time": closing_time.isoformat() if closing_time else None,
            "time_remaining": time_remaining,
            "current_winner": {
                "driver_name": winning_bid["driver_name"],
                "amount": winning_bid["amount"],
                "bid_id": winning_bid["id"]
            } if winning_bid else None
        }
        
        return status
        
    except Exception as e:
        print(f"Error getting slot status: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/slot/close/{pickup_date}/{pickup_slot}")
def manually_close_slot(pickup_date: str, pickup_slot: str):
    """
    Manually close a slot and assign winner (admin/testing use).
    Bypasses automatic time-based closing.
    """
    try:
        from services.slot_bid_closer import close_slot_and_assign_winner
        
        result = close_slot_and_assign_winner(pickup_date, pickup_slot)
        
        if result.get("success"):
            return result
        else:
            raise HTTPException(status_code=400, detail=result.get("message", "Failed to close slot"))
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error manually closing slot: {e}")
        raise HTTPException(status_code=500, detail=str(e))


class OrderBidCreate(BaseModel):
    """Request model for creating an order-level bid"""
    driver_id: str
    driver_name: str
    order_id: str
    amount: int
    vehicle: str
    reliability_score: Optional[int] = 94


@router.post("/order", response_model=SlotBid)
def create_order_bid(payload: OrderBidCreate):
    """
    Create a bid for a specific order.
    Drivers can only bid once per order.
    """
    if not supabase_client:
        raise HTTPException(status_code=500, detail="Database client not configured")
    
    try:
        # Check if order exists
        order_response = supabase_client.table("orders").select("*").eq("id", payload.order_id).execute()
        
        if not order_response.data or len(order_response.data) == 0:
            raise HTTPException(status_code=404, detail=f"Order {payload.order_id} not found")
        
        order = order_response.data[0]
        
        # Check if order is still open for bidding
        if order["status"] not in ["Pending", "Cluster Forming"]:
            raise HTTPException(status_code=400, detail=f"Order {payload.order_id} is not available for bidding (status: {order['status']})")
        
        # Check if driver already bid on this order
        existing_bid = supabase_client.table("bids").select("id").eq("driver_name", payload.driver_name).eq("order_id", payload.order_id).eq("bid_type", "order").execute()
        
        if existing_bid.data and len(existing_bid.data) > 0:
            raise HTTPException(status_code=400, detail=f"You have already bid on order {payload.order_id}")
        
        # Check capacity using dynamic calculation (at pickup time)
        from services.capacity_service import can_bid_on_order
        capacity_check = can_bid_on_order(
            payload.driver_name, 
            order["weight_kg"],
            order.get("pickup_date"),
            order.get("pickup_slot")
        )
        
        if not capacity_check["can_bid"]:
            raise HTTPException(
                status_code=400, 
                detail=f"Cannot bid: {capacity_check['reason']}"
            )
        
        # Generate bid ID
        bid_id = f"OB-{int(datetime.now().timestamp() * 1000)}"
        
        # Insert bid record
        bid_data = {
            "id": bid_id,
            "driver_id": None,
            "driver_name": payload.driver_name,
            "order_id": payload.order_id,
            "pickup_date": order.get("pickup_date"),
            "pickup_slot": order.get("pickup_slot"),
            "amount": int(payload.amount),
            "vehicle": payload.vehicle,
            "reliability_score": int(payload.reliability_score),
            "bid_type": "order",
            "status": "Open",
            "bundle_id": None
        }
        
        insert_response = supabase_client.table("bids").insert(bid_data).execute()
        
        if not insert_response.data:
            raise HTTPException(status_code=500, detail="Failed to create order bid")
        
        row = insert_response.data[0]
        
        return SlotBid(
            id=row["id"],
            driver_id=row.get("driver_id"),
            driver_name=row["driver_name"],
            pickup_date=datetime.fromisoformat(row["pickup_date"]).date() if row.get("pickup_date") and isinstance(row.get("pickup_date"), str) and len(row.get("pickup_date")) > 8 else None,
            pickup_slot=row.get("pickup_slot"),
            amount=row["amount"],
            vehicle=row["vehicle"],
            reliability_score=row["reliability_score"],
            bid_type=row["bid_type"],
            status=row["status"],
            created_at=datetime.fromisoformat(row["created_at"].replace("Z", "+00:00"))
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error creating order bid: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/order/{order_id}")
def get_order_bids(order_id: str):
    """
    Get all bids for a specific order.
    Returns bids sorted by amount (lowest first).
    """
    if not supabase_client:
        raise HTTPException(status_code=500, detail="Database client not configured")
    
    try:
        # Query bids for this order
        response = supabase_client.table("bids").select("*").eq("order_id", order_id).eq("bid_type", "order").order("amount", desc=False).execute()
        
        bids = []
        for row in response.data:
            bids.append({
                "id": row["id"],
                "driver_id": row.get("driver_id"),
                "driver_name": row["driver_name"],
                "order_id": row["order_id"],
                "amount": row["amount"],
                "vehicle": row["vehicle"],
                "reliability_score": row["reliability_score"],
                "bid_type": row["bid_type"],
                "status": row["status"],
                "created_at": row["created_at"]
            })
        
        return bids
        
    except Exception as e:
        print(f"Error fetching order bids: {e}")
        raise HTTPException(status_code=500, detail=str(e))



@router.get("/capacity/{driver_name}")
def get_driver_capacity_info(driver_name: str):
    """
    Get driver's capacity utilization and load information.
    Shows current committed weight vs vehicle capacity.
    """
    try:
        from services.capacity_service import calculate_capacity_utilization
        
        capacity_info = calculate_capacity_utilization(driver_name)
        return capacity_info
        
    except Exception as e:
        print(f"Error getting capacity info: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/capacity/check")
def check_capacity_for_bid(payload: dict):
    """
    Check if driver can bid on an order based on capacity.
    Payload: {driver_name: str, order_weight: int}
    """
    try:
        from services.capacity_service import can_bid_on_order
        
        driver_name = payload.get("driver_name")
        order_weight = payload.get("order_weight")
        
        if not driver_name or not order_weight:
            raise HTTPException(status_code=400, detail="Missing driver_name or order_weight")
        
        result = can_bid_on_order(driver_name, order_weight)
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error checking capacity: {e}")
        raise HTTPException(status_code=500, detail=str(e))



@router.get("/capacity/timeline/{driver_name}")
def get_capacity_timeline(driver_name: str):
    """
    Get driver's capacity timeline showing how load changes throughout the day.
    Useful for visualizing when capacity becomes available.
    """
    try:
        from services.dynamic_capacity_service import get_driver_capacity_timeline
        
        timeline = get_driver_capacity_timeline(driver_name)
        return timeline
        
    except Exception as e:
        print(f"Error getting capacity timeline: {e}")
        raise HTTPException(status_code=500, detail=str(e))
