"""
services/geocoding_service.py

Geocodes a full address string to (lat, lng) using:
  1. Ola Maps Geocoding API — primary (best India/Tamil Nadu accuracy)
  2. Nominatim (OpenStreetMap) — fallback if Ola Maps key not set or fails
  3. context_service.py hardcoded coords — fallback for known villages
  4. None — skip from clustering gracefully

Ola Maps API docs: https://maps.olakrutrim.com/docs/geocoding/geocoding-api
Base URL: https://api.olamaps.io
Auth: ?api_key=YOUR_KEY as query parameter
"""

import time
import urllib.parse
import urllib.request
import json

from services.context_service import VILLAGE_DICTIONARY
from settings import settings

_last_nominatim_call = 0.0


def _ola_maps_geocode(address: str) -> tuple[float, float] | None:
    """Call Ola Maps Geocoding API."""
    if not settings.ola_maps_api_key or not settings.ola_maps_api_key.strip():
        return None

    query = urllib.parse.urlencode({
        "address": address,
        "api_key": settings.ola_maps_api_key.strip(),
    })
    url = f"https://api.olamaps.io/places/v1/geocode?{query}"
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "KrishiBundle/1.0",
            "X-Request-Id": "krishibundle-geocode",
        }
    )

    try:
        with urllib.request.urlopen(req, timeout=8) as resp:
            data = json.loads(resp.read().decode())

        # Response: { "geocodingResults": [{ "geometry": { "location": { "lat": ..., "lng": ... } } }] }
        results = data.get("geocodingResults", [])
        if results:
            loc = results[0]["geometry"]["location"]
            return float(loc["lat"]), float(loc["lng"])
    except Exception as e:
        print(f"Ola Maps geocode failed for '{address}': {e}")

    return None


def _nominatim_geocode(address: str) -> tuple[float, float] | None:
    """Call Nominatim with 1 req/sec rate limit — fallback only."""
    global _last_nominatim_call

    elapsed = time.time() - _last_nominatim_call
    if elapsed < 1.0:
        time.sleep(1.0 - elapsed)

    query = urllib.parse.urlencode({
        "q": address,
        "format": "json",
        "limit": 1,
        "countrycodes": "in",
    })
    url = f"https://nominatim.openstreetmap.org/search?{query}"
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "KrishiBundle/1.0 (farm-logistics-demo)"}
    )

    try:
        _last_nominatim_call = time.time()
        with urllib.request.urlopen(req, timeout=5) as resp:
            results = json.loads(resp.read().decode())
        if results:
            return float(results[0]["lat"]), float(results[0]["lon"])
    except Exception as e:
        print(f"Nominatim geocode failed for '{address}': {e}")

    return None


def _hardcoded_coords(address: str) -> tuple[float, float] | None:
    """Scan address for any known village name from context_service."""
    address_lower = address.lower()
    for key, entry in VILLAGE_DICTIONARY.items():
        if key in address_lower:
            return float(entry["lat"]), float(entry["lng"])
    return None


def geocode_address(address: str) -> tuple[float | None, float | None]:
    """
    Returns (lat, lng) for a full address string.

    Fallback chain:
      1. Ola Maps API (primary — best India accuracy)
      2. Nominatim simplified (strips street, retries with village+district+pincode)
      3. Hardcoded village dictionary
      4. (None, None) — order excluded from spatial clustering

    Usage:
        lat, lng = geocode_address("12/4 Gandhi Street, Melma, Kanchipuram, Tamil Nadu 631501")
    """
    if not address or address.strip().lower() in ("unknown village", ""):
        return None, None

    # 1. Ola Maps — full address
    coords = _ola_maps_geocode(address)
    if coords:
        print(f"Geocoded '{address}' via Ola Maps: {coords}")
        return coords

    # 2a. Nominatim — full address
    coords = _nominatim_geocode(f"{address}, Tamil Nadu, India")
    if coords:
        print(f"Geocoded '{address}' via Nominatim (full): {coords}")
        return coords

    # 2b. Nominatim — simplified (last 3 comma parts, strips street number)
    parts = [p.strip() for p in address.split(",")]
    if len(parts) > 2:
        simplified = ", ".join(parts[-3:])
        coords = _nominatim_geocode(f"{simplified}, Tamil Nadu, India")
        if coords:
            print(f"Geocoded '{address}' via Nominatim (simplified '{simplified}'): {coords}")
            return coords

    # 3. Hardcoded village dictionary
    coords = _hardcoded_coords(address)
    if coords:
        print(f"Geocoded '{address}' via hardcoded dict: {coords}")
        return coords

    print(f"Could not geocode '{address}' — will be excluded from spatial clustering")
    return None, None


# Keep old name as alias so nothing else breaks
geocode_village = geocode_address
