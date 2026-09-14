from fastapi import APIRouter

from models.schemas import Bid, BidCreate
from services.auction_service import create_bid, list_bids

router = APIRouter()


@router.get("/bids", response_model=list[Bid])
def bids():
    return list_bids()


@router.post("/bids", response_model=Bid)
def submit_bid(payload: BidCreate):
    return create_bid(payload)

