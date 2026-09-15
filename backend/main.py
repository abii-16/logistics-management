import asyncio
from datetime import datetime, timezone, timedelta

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes import admin, auction, bookings, drivers, voice, sms, route_optimization
from settings import settings

app = FastAPI(title="Agrilogi API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(voice.router, prefix="/api/voice", tags=["voice"])
app.include_router(bookings.router, prefix="/api/bookings", tags=["bookings"])
app.include_router(drivers.router, prefix="/api/drivers", tags=["drivers"])
app.include_router(auction.router, prefix="/api/auction", tags=["auction"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])
app.include_router(sms.router, prefix="/api/sms", tags=["sms"])
app.include_router(route_optimization.router)


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "agrilogi"}


# ── Background clustering scheduler ──────────────────────────────────────────

IST = timezone(timedelta(hours=5, minutes=30))
SLOT_HOURS_IST = [6, 18]  # 6 AM and 6 PM


def _seconds_until_next_slot() -> float:
    """Return seconds until the next 6 AM or 6 PM IST slot."""
    now_ist = datetime.now(IST)
    for hour in SLOT_HOURS_IST:
        slot = now_ist.replace(hour=hour, minute=0, second=0, microsecond=0)
        diff = (slot - now_ist).total_seconds()
        if diff > 0:
            return diff
    # Both slots passed today — wait until 6 AM tomorrow
    tomorrow = now_ist + timedelta(days=1)
    slot = tomorrow.replace(hour=SLOT_HOURS_IST[0], minute=0, second=0, microsecond=0)
    return (slot - now_ist).total_seconds()


async def _clustering_scheduler():
    """Waits for the next slot, runs clustering, then repeats."""
    while True:
        wait = _seconds_until_next_slot()
        slot_ist = datetime.now(IST) + timedelta(seconds=wait)
        print(f"[Scheduler] Next clustering slot: {slot_ist.strftime('%Y-%m-%d %H:%M IST')} (in {wait/3600:.2f}h)")
        await asyncio.sleep(wait)

        print(f"[Scheduler] Slot reached — running DBSCAN clustering...")
        try:
            from services.clustering_service import build_clusters
            clusters = build_clusters()
            print(f"[Scheduler] Clustering complete — {len(clusters)} cluster(s) formed.")
        except Exception as e:
            print(f"[Scheduler] Clustering failed: {e}")


@app.on_event("startup")
async def start_scheduler():
    asyncio.create_task(_clustering_scheduler())
