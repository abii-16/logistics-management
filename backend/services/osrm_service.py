"""
OSRM Service — wraps the OSRM Route API (geometry only).
Used ONLY for final road geometry — never for the optimization matrix.
"""

import os
import requests
from typing import List, Dict

OSRM_BASE_URL = os.getenv("OSRM_BASE_URL", "https://router.project-osrm.org")
OSRM_TIMEOUT  = int(os.getenv("OSRM_TIMEOUT_SECONDS", "30"))


class OSRMError(Exception):
    pass


def _coords_to_str(locations: List[Dict]) -> str:
    return ";".join(f"{loc['longitude']},{loc['latitude']}" for loc in locations)


def get_route_geometry(locations: List[Dict]) -> Dict:
    """Call OSRM Route API and return road geometry as GeoJSON LineString."""
    if len(locations) < 2:
        raise OSRMError("At least 2 locations required for route geometry.")

    coords_str = _coords_to_str(locations)
    url    = f"{OSRM_BASE_URL}/route/v1/driving/{coords_str}"
    params = {"overview": "full", "geometries": "geojson", "steps": "false"}

    try:
        response = requests.get(url, params=params, timeout=OSRM_TIMEOUT)
    except requests.exceptions.ConnectionError as exc:
        raise OSRMError(f"OSRM network connection failed: {exc}") from exc
    except requests.exceptions.Timeout:
        raise OSRMError(f"OSRM request timed out after {OSRM_TIMEOUT} seconds.")
    except requests.exceptions.RequestException as exc:
        raise OSRMError(f"OSRM request error: {exc}") from exc

    if response.status_code != 200:
        raise OSRMError(f"OSRM Route API returned HTTP {response.status_code}")

    data = response.json()
    if data.get("code") != "Ok":
        raise OSRMError(f"OSRM error: {data.get('message', 'unknown')}")

    routes = data.get("routes")
    if not routes:
        raise OSRMError("OSRM returned no routes.")

    route    = routes[0]
    geometry = route.get("geometry")
    if not geometry:
        raise OSRMError("OSRM returned a route with no geometry.")

    return {
        "geometry":   geometry,
        "distance_m": route.get("distance", 0.0),
        "duration_s": route.get("duration", 0.0),
    }
