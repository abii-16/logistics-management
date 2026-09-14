from typing import Literal

from pydantic import BaseModel, Field


OrderStatus = Literal["Pending", "Cluster Forming", "Driver Assigned", "In Transit", "Completed"]


class BookingCreate(BaseModel):
    farmer_name: str = "Demo Farmer"
    phone: str = "+91 90000 00000"
    village: str
    crop: str
    weight_kg: int = Field(gt=0)
    destination: str = "Koyambedu Mandi"


class Booking(BookingCreate):
    id: str
    status: OrderStatus
    individual_cost: int
    shared_cost: int
    pickup_time: str
    source: str = "Web Dashboard"
    language: str = "en"
    confidence: dict[str, int] | None = None
    review_required: bool = False


class Driver(BaseModel):
    id: str
    name: str
    phone: str
    vehicle_number: str
    vehicle_type: str
    license_number: str
    reliability_score: int


class BidCreate(BaseModel):
    driver_name: str = "Your Vehicle"
    vehicle: str = "Mini Truck"
    amount: int = Field(gt=0)
    reliability_score: int = 90


class Bid(BidCreate):
    id: str
    status: Literal["Leading", "Open", "Accepted"]


class ExtractionRequest(BaseModel):
    transcript: str
    language: Literal["ta", "hi", "en"] = "ta"


class ExtractionResult(BaseModel):
    transcript: str
    extracted: dict[str, str | int]
    confidence: dict[str, int]


class Recommendation(BaseModel):
    farmers: int
    total_weight_kg: int
    truck_utilization: int
    estimated_savings: int
    spoilage_risk: Literal["Low", "Medium", "High"]
    departure_time: str


class Notification(BaseModel):
    phone: str
    message: str
    channel: Literal["sms", "voice"] = "sms"
    status: Literal["queued", "sent", "demo"] = "demo"

