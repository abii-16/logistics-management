from models.schemas import BookingCreate, Notification


def booking_confirmation(payload: BookingCreate, booking_id: str) -> Notification:
    return Notification(
        phone=payload.phone,
        message=(
            f"KrishiBundle Booking Confirmed\n"
            f"Crop: {payload.crop}\n"
            f"Weight: {payload.weight_kg}kg\n"
            f"Village: {payload.village}\n"
            f"Booking ID: {booking_id}"
        ),
    )

