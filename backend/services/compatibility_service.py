INCOMPATIBLE_PAIRS = {
    frozenset(("Tomato", "Onion")),
    frozenset(("Banana", "Fish")),
}


def crops_are_compatible(crops: list[str]) -> bool:
    for index, crop in enumerate(crops):
        for other in crops[index + 1 :]:
            if frozenset((crop, other)) in INCOMPATIBLE_PAIRS:
                return False
    return True

