from __future__ import annotations

from dataclasses import dataclass
import re

from sqlalchemy.orm import Session

from . import models


@dataclass
class ParsedQuery:
    cuisines: list[str]
    city: str | None
    max_price_tier: int | None
    dietary: list[str]
    ambiance: list[str]
    sort_by: str


def _csv_to_list(value: str | None) -> list[str]:
    if not value:
        return []
    return [item.strip().lower() for item in value.split(",") if item.strip()]


def _parse_price(message: str) -> int | None:
    lowered = message.lower()
    if "cheap" in lowered or "budget" in lowered or "$" in lowered and "$$" not in lowered:
        return 1
    if "$$$" in lowered:
        return 3
    if "$$$$" in lowered or "luxury" in lowered or "fine dining" in lowered:
        return 4
    if "$$" in lowered or "moderate" in lowered or "mid" in lowered:
        return 2
    return None


def _extract_city(message: str, preferred_locations: list[str]) -> str | None:
    lowered = message.lower()
    for location in preferred_locations:
        if location and location in lowered:
            return location

    city_match = re.search(r"in\s+([a-zA-Z\s]+?)(?:\s+(?:under|with|for|near|around)\b|$)", message)
    if city_match:
        return city_match.group(1).strip().lower()
    return None


def parse_query(message: str, user_preferences: models.UserPreference | None) -> ParsedQuery:
    lowered = message.lower()

    default_cuisines = _csv_to_list(user_preferences.cuisines) if user_preferences else []
    default_locations = _csv_to_list(user_preferences.preferred_locations) if user_preferences else []
    default_dietary = _csv_to_list(user_preferences.dietary_needs) if user_preferences else []
    default_ambiance = _csv_to_list(user_preferences.ambiance) if user_preferences else []

    known_cuisines = [
        "italian",
        "chinese",
        "mexican",
        "indian",
        "japanese",
        "american",
        "thai",
        "mediterranean",
        "korean",
        "vietnamese",
    ]
    cuisines = [c for c in known_cuisines if c in lowered] or default_cuisines

    dietary_terms = ["vegan", "vegetarian", "halal", "kosher", "gluten-free"]
    dietary = [d for d in dietary_terms if d in lowered] or default_dietary

    ambiance_terms = ["casual", "romantic", "family", "fine dining", "outdoor", "quiet"]
    ambiance = [a for a in ambiance_terms if a in lowered] or default_ambiance

    max_price_tier = _parse_price(message)
    if max_price_tier is None and user_preferences and user_preferences.price_max:
        max_price_tier = user_preferences.price_max

    city = _extract_city(message, default_locations)

    sort_by = "rating"
    if "distance" in lowered:
        sort_by = "distance"
    elif "price" in lowered:
        sort_by = "price"
    elif "popular" in lowered:
        sort_by = "popularity"

    return ParsedQuery(
        cuisines=cuisines,
        city=city,
        max_price_tier=max_price_tier,
        dietary=dietary,
        ambiance=ambiance,
        sort_by=sort_by,
    )


def _score_restaurant(restaurant: models.Restaurant, parsed: ParsedQuery) -> float:
    score = 0.0

    cuisine = (restaurant.cuisine_type or "").lower()
    description = (restaurant.description or "").lower()
    amenities = (restaurant.amenities or "").lower()
    city = (restaurant.city or "").lower()

    if parsed.cuisines and any(pref in cuisine for pref in parsed.cuisines):
        score += 3.0

    if parsed.city and parsed.city in city:
        score += 2.0

    if parsed.max_price_tier and restaurant.price_tier and restaurant.price_tier <= parsed.max_price_tier:
        score += 1.5

    if parsed.dietary and any(term in description or term in amenities for term in parsed.dietary):
        score += 1.5

    if parsed.ambiance and any(term in description or term in amenities for term in parsed.ambiance):
        score += 1.0

    return score


def recommend_restaurants(
    db: Session,
    user_id: int,
    message: str,
    limit: int = 5,
) -> tuple[dict, list[tuple[models.Restaurant, float]], str]:
    user_preferences = db.get(models.UserPreference, user_id)
    parsed = parse_query(message, user_preferences)

    restaurants = db.query(models.Restaurant).all()

    scored: list[tuple[models.Restaurant, float]] = []
    for restaurant in restaurants:
        score = _score_restaurant(restaurant, parsed)
        if score > 0:
            scored.append((restaurant, score))

    scored.sort(key=lambda item: item[1], reverse=True)
    top_results = scored[:limit]

    if top_results:
        names = ", ".join(r.name for r, _ in top_results[:3])
        reply = f"I found some options you might like: {names}. I can refine further by budget, location, or dietary needs."
    else:
        reply = "I couldn't find strong matches yet. Try adding cuisine, location, or budget details so I can narrow it down."

    extracted = {
        "cuisines": parsed.cuisines,
        "city": parsed.city,
        "max_price_tier": parsed.max_price_tier,
        "dietary": parsed.dietary,
        "ambiance": parsed.ambiance,
        "sort_by": parsed.sort_by,
    }

    return extracted, top_results, reply
