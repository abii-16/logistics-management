COORDINATE_MAP = {
    "melma": (74.0, 154.0),
    "vallam": (126.0, 116.0),
    "orikkai": (184.0, 214.0),
    "walajabad": (86.0, 228.0),
    "sevoor": (145.0, 165.0),
    "athur": (185.0, 80.0),
}

def get_coordinates(village: str) -> tuple[float, float]:
    return COORDINATE_MAP.get(village.lower(), (100.0, 100.0))
