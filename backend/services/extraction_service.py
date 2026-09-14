import json
import re

from pydantic import BaseModel, Field

try:
    import google.generativeai as genai
except ImportError:
    genai = None

from models.schemas import ExtractionRequest, ExtractionResult
from services.context_service import normalize_crop, normalize_village
from settings import settings

if settings.gemini_api_key and genai:
    genai.configure(api_key=settings.gemini_api_key)


NAME_PATTERNS = [
    re.compile(r"\bmy name is\s+([A-Za-z][A-Za-z .'-]{1,40})", re.IGNORECASE),
    re.compile(r"\bi am\s+([A-Za-z][A-Za-z .'-]{1,40})", re.IGNORECASE),
    re.compile(r"\bthis is\s+([A-Za-z][A-Za-z .'-]{1,40})", re.IGNORECASE),
    re.compile(r"\bmain\s+([A-Za-z][A-Za-z .'-]{1,40})", re.IGNORECASE),
    re.compile(r"\bmera naam\s+([A-Za-z][A-Za-z .'-]{1,40})", re.IGNORECASE),
    re.compile(r"\bnaan\s+([A-Za-z][A-Za-z .'-]{1,40})", re.IGNORECASE),
    re.compile(r"\ben peyar\s+([A-Za-z][A-Za-z .'-]{1,40})", re.IGNORECASE),
]

NAME_STOP_WORDS = {
    "from",
    "se",
    "village",
    "gaon",
    "oor",
    "ooru",
    "i",
    "am",
    "hoon",
    "hun",
    "hai",
    "hu",
    "have",
    "has",
    "with",
    "crop",
    "tomato",
    "tomatoes",
    "thakkali",
    "takali",
    "brinjal",
    "baingan",
    "onion",
    "banana",
    "paddy",
    "rice",
    "kg",
    "kilo",
    "kilogram",
    "kilograms",
    "want",
    "transport",
    "send",
    "load",
}


class ConfidenceScores(BaseModel):
    farmer_name: int = Field(description="Confidence score from 0-100.")
    village: int = Field(description="Confidence score from 0-100.")
    crop: int = Field(description="Confidence score from 0-100.")
    weight: int = Field(description="Confidence score from 0-100.")


class ExtractionSchema(BaseModel):
    farmer_name: str
    crop: str
    weight: int
    village: str
    confidence: ConfidenceScores


def extract_from_transcript(payload: ExtractionRequest) -> ExtractionResult:
    if settings.gemini_api_key and genai:
        return _gemini_extraction(payload)
    return _rule_based_extraction(payload)


def _normalize_text(text: str) -> str:
    return re.sub(r"\s+", " ", text.replace(",", " ").replace(".", " ")).strip()


def _clean_farmer_name(name: str) -> str:
    words = []
    for raw_word in _normalize_text(name).split():
        word = raw_word.strip(" .,'-")
        if not word or word.lower() in NAME_STOP_WORDS:
            break
        words.append(word)
    if not words:
        return "Unknown Farmer"
    return " ".join(words[:3]).title()


def _extract_name(transcript: str) -> tuple[str, int]:
    normalized = _normalize_text(transcript)
    for pattern in NAME_PATTERNS:
        match = pattern.search(normalized)
        if match:
            name = _clean_farmer_name(match.group(1))
            if name != "Unknown Farmer":
                return name, 92

    titled_words = [
        word.strip(" .,'-")
        for word in normalized.split()
        if word.strip(" .,'-").istitle() and word.lower() not in NAME_STOP_WORDS
    ]
    if titled_words:
        return _clean_farmer_name(titled_words[0]), 76
    return "Unknown Farmer", 45


def _extract_weight(transcript: str) -> tuple[int, int]:
    normalized = transcript.lower().replace(",", " ")
    patterns = [
        r"(\d{1,5})\s*(?:kg|kgs|kilo|kilos|kilogram|kilograms)",
        r"(?:weight|weighs|have|has|paas|kitta|transport|send|load|crop)\D{0,30}(\d{1,5})",
        r"(\d{1,3})\s*(?:bag|bags|sack|sacks)",
    ]
    for pattern in patterns:
        match = re.search(pattern, normalized)
        if match:
            value = int(match.group(1))
            if "bag" in match.group(0) or "sack" in match.group(0):
                value *= 50
            return value, 96
    return 0, 35


def _confidence_for(value: str, unknown: str, high: int = 92) -> int:
    return high if value != unknown else 48


def _rule_based_extraction(payload: ExtractionRequest) -> ExtractionResult:
    transcript = _normalize_text(payload.transcript)
    farmer_name, farmer_confidence = _extract_name(transcript)
    village = normalize_village(transcript)
    crop = normalize_crop(transcript)
    weight, weight_confidence = _extract_weight(transcript)

    return ExtractionResult(
        transcript=transcript,
        extracted={
            "farmer_name": farmer_name,
            "village": village,
            "crop": crop,
            "weight": weight,
        },
        confidence={
            "farmer_name": farmer_confidence,
            "village": _confidence_for(village, "Unknown Village"),
            "crop": _confidence_for(crop, "Unknown Crop", 95),
            "weight": weight_confidence,
        },
    )


def _gemini_extraction(payload: ExtractionRequest) -> ExtractionResult:
    try:
        model = genai.GenerativeModel(
            "gemini-2.5-flash",
            system_instruction=(
                "Extract farmer logistics booking details from rural Tamil, Hindi, "
                "or English transcripts. Return only structured JSON."
            ),
        )
        response = model.generate_content(
            (
                "Extract farmer_name, village, crop, weight in kg, and confidence scores. "
                "Normalize village and crop spellings. Transcript: "
                f"{payload.transcript}"
            ),
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json",
                response_schema=ExtractionSchema,
                temperature=0.1,
            ),
        )
        data = json.loads(response.text)
        confidence = data.get("confidence", {})
        return ExtractionResult(
            transcript=payload.transcript,
            extracted={
                "farmer_name": _clean_farmer_name(str(data.get("farmer_name", "Unknown Farmer"))),
                "village": str(data.get("village") or normalize_village(payload.transcript)),
                "crop": str(data.get("crop") or normalize_crop(payload.transcript)),
                "weight": int(data.get("weight") or 0),
            },
            confidence={
                "farmer_name": int(confidence.get("farmer_name", 90)),
                "village": int(confidence.get("village", 90)),
                "crop": int(confidence.get("crop", 90)),
                "weight": int(confidence.get("weight", 90)),
            },
        )
    except Exception as exc:
        print(f"Gemini extraction failed: {exc}. Falling back to rule-based.")
        return _rule_based_extraction(payload)
