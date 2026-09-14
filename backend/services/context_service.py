VILLAGE_DICTIONARY = {
    "melma": {"canonical": "Melma", "lat": 12.516, "lng": 79.158},
    "melma village": {"canonical": "Melma", "lat": 12.516, "lng": 79.158},
    "melmavur": {"canonical": "Melma", "lat": 12.516, "lng": 79.158},
    "athur": {"canonical": "Athur", "lat": 12.55, "lng": 79.2},
    "attur": {"canonical": "Athur", "lat": 12.55, "lng": 79.2},
    "aathur": {"canonical": "Athur", "lat": 12.55, "lng": 79.2},
    "sevoor": {"canonical": "Sevoor", "lat": 12.49, "lng": 79.25},
    "sethur": {"canonical": "Sevoor", "lat": 12.49, "lng": 79.25},
    "sevur": {"canonical": "Sevoor", "lat": 12.49, "lng": 79.25},
    "vallam": {"canonical": "Vallam", "lat": 12.79, "lng": 79.71},
    "orikkai": {"canonical": "Orikkai", "lat": 12.81, "lng": 79.71},
    "walajabad": {"canonical": "Walajabad", "lat": 12.79, "lng": 79.82},
    "kancheepuram": {"canonical": "Kancheepuram", "lat": 12.83, "lng": 79.70},
}

CROP_ALIASES = {
    "thakkali": "Tomato",
    "takali": "Tomato",
    "tomatoe": "Tomato",
    "tomato": "Tomato",
    "tomatoes": "Tomato",
    "brinjal": "Brinjal",
    "baingan": "Brinjal",
    "eggplant": "Brinjal",
    "kathirikai": "Brinjal",
    "onion": "Onion",
    "onions": "Onion",
    "vengayam": "Onion",
    "banana": "Banana",
    "bananas": "Banana",
    "vazhai": "Banana",
    "paddy": "Paddy",
    "rice": "Paddy",
    "mango": "Mango",
    "mangoes": "Mango",
}


def normalize_village(text: str) -> str:
    lowered = text.lower()
    for key, value in VILLAGE_DICTIONARY.items():
        if key in lowered:
            return str(value["canonical"])
    return "Unknown Village"


def normalize_crop(text: str) -> str:
    lowered = text.lower()
    for alias, crop in CROP_ALIASES.items():
        if alias in lowered:
            return crop
    return "Unknown Crop"
