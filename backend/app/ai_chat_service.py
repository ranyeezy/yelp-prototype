from __future__ import annotations

from dataclasses import dataclass
import os
import re
import json

from sqlalchemy.orm import Session

from . import models

try:
    from langchain_core.prompts import ChatPromptTemplate
except Exception:
    ChatPromptTemplate = None

try:
    from tavily import TavilyClient
except Exception:
    TavilyClient = None


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


def _langchain_extract(message: str) -> dict | None:
    if ChatPromptTemplate is None:
        return None

    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                "Extract only explicit restaurant-search filters as JSON with keys: "
                "cuisines (list), city (string|null), max_price_tier (int|null), "
                "dietary (list), ambiance (list), sort_by (string|null).",
            ),
            ("human", "{message}"),
        ]
    )

    rendered = prompt.format_prompt(message=message).to_messages()
    if not rendered:
        return None

    content = rendered[-1].content if hasattr(rendered[-1], "content") else ""
    if not isinstance(content, str):
        return None

    try:
        maybe_json = content.strip()
        if maybe_json.startswith("{") and maybe_json.endswith("}"):
            parsed = json.loads(maybe_json)
            return parsed if isinstance(parsed, dict) else None
    except Exception:
        return None

    return None


def _merge_with_langchain(parsed: ParsedQuery, extracted: dict | None) -> ParsedQuery:
    if not extracted:
        return parsed

    cuisines = extracted.get("cuisines") if isinstance(extracted.get("cuisines"), list) else parsed.cuisines
    dietary = extracted.get("dietary") if isinstance(extracted.get("dietary"), list) else parsed.dietary
    ambiance = extracted.get("ambiance") if isinstance(extracted.get("ambiance"), list) else parsed.ambiance

    city = extracted.get("city") if isinstance(extracted.get("city"), str) else parsed.city
    max_price_tier = extracted.get("max_price_tier") if isinstance(extracted.get("max_price_tier"), int) else parsed.max_price_tier
    sort_by = extracted.get("sort_by") if isinstance(extracted.get("sort_by"), str) else parsed.sort_by

    return ParsedQuery(
        cuisines=[str(c).lower() for c in cuisines] if cuisines else parsed.cuisines,
        city=city.lower() if isinstance(city, str) else parsed.city,
        max_price_tier=max_price_tier,
        dietary=[str(d).lower() for d in dietary] if dietary else parsed.dietary,
        ambiance=[str(a).lower() for a in ambiance] if ambiance else parsed.ambiance,
        sort_by=sort_by,
    )


def _get_tavily_context(message: str, limit: int = 3) -> list[dict]:
    if TavilyClient is None:
        return []

    api_key = os.getenv("TAVILY_API_KEY")
    if not api_key:
        return []

    try:
        client = TavilyClient(api_key=api_key)
        result = client.search(query=message, max_results=limit)
        rows = result.get("results", []) if isinstance(result, dict) else []
        context = []
        for row in rows:
            if not isinstance(row, dict):
                continue
            context.append(
                {
                    "title": row.get("title"),
                    "url": row.get("url"),
                    "content": row.get("content"),
                }
            )
        return context
    except Exception:
        return []


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
) -> tuple[dict, list[tuple[models.Restaurant, float]], str, list[dict]]:
    user_preferences = db.get(models.UserPreference, user_id)
    parsed = parse_query(message, user_preferences)
    langchain_extracted = _langchain_extract(message)
    parsed = _merge_with_langchain(parsed, langchain_extracted)

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

    web_context = _get_tavily_context(message)

    return extracted, top_results, reply, web_context
