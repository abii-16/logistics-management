from typing import Optional

from fastapi import APIRouter, File, Form, UploadFile

try:
    import google.generativeai as genai
except ImportError:
    genai = None

from database.db import supabase_client
from database.seed_data import BOOKINGS
from models.schemas import ExtractionRequest, ExtractionResult
from services.extraction_service import extract_from_transcript
from services.geocoding_service import geocode_village
from services.destination_service import normalize_destination
from services.pricing_service import calculate_individual_cost
from settings import settings

router = APIRouter()


@router.post("/extract", response_model=ExtractionResult)
def extract(payload: ExtractionRequest):
    return extract_from_transcript(payload)


@router.post("/ivr-demo")
def ivr_demo():
    return {
        "hotline": "1800-KRISHI",
        "menu": {"1": "Tamil", "2": "Hindi", "3": "English"},
        "prompt": "Please tell your village name, crop name, and crop weight.",
    }


@router.post("/upload")
async def upload_voice(
    audio_file: Optional[UploadFile] = File(None),
    language: str = Form(...),
    demo_type: Optional[str] = Form(None),
    transcript_text: Optional[str] = Form(None),
):
    transcript = await _resolve_transcript(audio_file, language, demo_type, transcript_text)
    lang_code = "ta" if language == "Tamil" else ("hi" if language == "Hindi" else "en")
    extraction_result = extract_from_transcript(ExtractionRequest(transcript=transcript, language=lang_code))
    extracted = extraction_result.extracted
    confidence = extraction_result.confidence
    review_required = any(int(value) < 70 for value in confidence.values())

    booking_row = _build_booking_row(extracted, confidence, language, review_required)
    saved_booking = _save_booking(booking_row)

    return {
        "id": saved_booking["id"],
        "transcript": transcript,
        "extracted": extracted,
        "confidence": confidence,
        "review_required": review_required,
        "booking": saved_booking,
    }


async def _resolve_transcript(
    audio_file: Optional[UploadFile],
    language: str,
    demo_type: Optional[str],
    transcript_text: Optional[str],
) -> str:
    if transcript_text and transcript_text.strip():
        return transcript_text.strip()

    if demo_type == "ta":
        return "Naan Arumugam. Melma village la irukken. En kitta 400 kilo thakkali irukku."
    if demo_type == "hi":
        return "Main Ramesh hoon. Main Sevoor gaon se hoon. Mere paas 200 kilo baingan hai."
    if demo_type == "en":
        return "Hello, I am Suresh from Athur village. I want to transport 350 kilograms of tomatoes."

    if audio_file and settings.gemini_api_key and genai:
        try:
            audio_bytes = await audio_file.read()
            model = genai.GenerativeModel("gemini-2.5-flash")
            prompt = (
                f"Transcribe this audio clip. The speaker is speaking in {language}. "
                "Output only the transcript text."
            )
            response = model.generate_content(
                [
                    prompt,
                    {"mime_type": audio_file.content_type or "audio/webm", "data": audio_bytes},
                ]
            )
            return response.text.strip()
        except Exception as exc:
            print(f"Transcription failed: {exc}. Using language-based fallback.")

    if language == "Tamil":
        return "Naan Arumugam. Melma village la irukken. En kitta 400 kilo thakkali irukku."
    if language == "Hindi":
        return "Main Ramesh hoon. Main Sevoor gaon se hoon. Mere paas 200 kilo baingan hai."
    return "Hello, I am Suresh from Athur village. I want to transport 350 kilograms of tomatoes."


def _build_booking_row(extracted: dict, confidence: dict, language: str, review_required: bool) -> dict:
    weight = int(extracted.get("weight") or 0)
    if weight <= 0:
        weight = 400

    village = extracted.get("village", "Unknown Village")
    lat, lng = geocode_village(village)
    dest = normalize_destination(extracted.get("destination", "Koyambedu Mandi"))
    individual_cost = calculate_individual_cost(weight, lat, lng, dest)

    phone = "+91 90030 11224" if language == "Tamil" else ("+91 81221 47770" if language == "Hindi" else "+91 94441 22009")
    return {
        "id": f"KB{1024 + len(BOOKINGS)}",
        "farmer_id": None,
        "farmer_name": extracted.get("farmer_name", "Unknown Farmer"),
        "phone": phone,
        "village": village,
        "crop": extracted.get("crop", "Unknown Crop"),
        "weight_kg": weight,
        "destination": dest,
        "status": "Pending",
        "individual_cost": individual_cost,
        "shared_cost": individual_cost,
        "pickup_time": "Awaiting cluster",
        "source": "Voice Call",
        "language": language,
        "confidence": confidence,
        "review_required": review_required,
        "lat": lat,
        "lng": lng,
    }


def _save_booking(booking_row: dict) -> dict:
    if not supabase_client:
        BOOKINGS.insert(0, booking_row)
        return booking_row

    try:
        count_response = supabase_client.table("orders").select("id", count="exact").execute()
        total_count = count_response.count if count_response.count is not None else 0
        booking_row["id"] = f"KB{1024 + total_count}"

        user_response = supabase_client.table("users").select("id").eq("phone", booking_row["phone"]).execute()
        if user_response.data:
            booking_row["farmer_id"] = user_response.data[0]["id"]
        else:
            ins_user = supabase_client.table("users").insert(
                {
                    "name": booking_row["farmer_name"],
                    "phone": booking_row["phone"],
                    "village": booking_row["village"],
                    "role": "farmer",
                }
            ).execute()
            booking_row["farmer_id"] = ins_user.data[0]["id"]

        supabase_client.table("orders").insert(booking_row).execute()
        return booking_row
    except Exception as exc:
        print(f"Error saving voice booking to Supabase: {exc}. Keeping local booking.")
        BOOKINGS.insert(0, booking_row)
        return booking_row
