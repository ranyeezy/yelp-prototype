"""
AI Chat Service — LangChain + Groq (LLaMA 3) + MySQL

Flow:
1. Load user preferences from DB
2. Fetch all restaurants from DB
3. Build a system prompt with user prefs + restaurant data
4. Send user message + conversation history to LLaMA 3 via Groq
5. LLM decides what to recommend and writes a natural response
6. Parse restaurant IDs mentioned in reply, attach them as structured recommendations
"""
from __future__ import annotations

import os
import re

from sqlalchemy import func
from sqlalchemy.orm import Session

from . import models

# ── LangChain / Groq ─────────────────────────────────────────────────────────
try:
    from langchain_groq import ChatGroq
    _GROQ_AVAILABLE = True
except ImportError:
    _GROQ_AVAILABLE = False

try:
    from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
    _LC_MESSAGES_AVAILABLE = True
except ImportError:
    _LC_MESSAGES_AVAILABLE = False

# ── Tavily web search ─────────────────────────────────────────────────────────
try:
    from tavily import TavilyClient
    _TAVILY_AVAILABLE = True
except ImportError:
    _TAVILY_AVAILABLE = False

# Keywords that suggest the user wants live/web context
_TAVILY_TRIGGER_WORDS = (
    "hours", "open", "closed", "opening", "closing",
    "event", "events", "special", "trending", "popular",
    "today", "tonight", "this week", "weekend", "now",
    "news", "new", "latest", "recently opened",
)


def _should_use_tavily(message: str) -> bool:
    """Only call Tavily when the user asks about live/real-world context."""
    lowered = message.lower()
    return any(word in lowered for word in _TAVILY_TRIGGER_WORDS)


def _tavily_search(query: str, max_results: int = 3) -> str:
    """Run a Tavily web search and return a compact context string."""
    if not _TAVILY_AVAILABLE:
        return ""
    api_key = os.getenv("TAVILY_API_KEY", "").strip()
    if not api_key:
        return ""
    try:
        client = TavilyClient(api_key=api_key)
        response = client.search(
            query=query,
            search_depth="basic",
            max_results=max_results,
            include_answer=True,
        )
        # Build a compact summary: direct answer + top result snippets
        parts = []
        if response.get("answer"):
            parts.append(f"Web answer: {response['answer']}")
        for result in response.get("results", [])[:max_results]:
            title = result.get("title", "")
            content = result.get("content", "")[:200]
            url = result.get("url", "")
            if content:
                parts.append(f"- {title}: {content} ({url})")
        return "\n".join(parts)
    except Exception as e:
        return f"(Tavily search unavailable: {str(e)[:80]})"


# ── Helpers ───────────────────────────────────────────────────────────────────

def _price_symbol(tier) -> str:
    if not isinstance(tier, int) or tier < 1:
        return "N/A"
    return "$" * min(max(tier, 1), 4)


def _csv_to_list(value) -> list:
    if not value:
        return []
    return [item.strip() for item in value.split(",") if item.strip()]


def _get_avg_ratings(db: Session) -> dict:
    rows = (
        db.query(models.Review.restaurant_id, func.avg(models.Review.rating))
        .group_by(models.Review.restaurant_id)
        .all()
    )
    return {rid: round(float(avg), 2) for rid, avg in rows if avg is not None}


def _build_restaurant_catalog(restaurants: list, rating_map: dict, limit: int = 40) -> str:
    lines = []
    for r in restaurants[:limit]:
        avg = rating_map.get(r.id)
        rating_str = f"{avg:.1f}" if avg else "no ratings yet"
        lines.append(
            f'ID:{r.id} | "{r.name}" | {r.cuisine_type} | {r.city}'
            f' | {_price_symbol(r.price_tier)} | star:{rating_str}'
            f' | {(r.description or "")[:80]}'
        )
    return "\n".join(lines)


def _build_system_prompt(user_prefs, restaurant_catalog: str, tavily_context: str = "") -> str:
    pref_block = ""
    if user_prefs:
        pref_parts = []
        if user_prefs.cuisines:
            pref_parts.append(f"Favourite cuisines: {user_prefs.cuisines}")
        if user_prefs.preferred_locations:
            pref_parts.append(f"Preferred locations: {user_prefs.preferred_locations}")
        if user_prefs.price_max:
            pref_parts.append(f"Max price tier: {_price_symbol(user_prefs.price_max)}")
        if user_prefs.dietary_needs:
            pref_parts.append(f"Dietary needs: {user_prefs.dietary_needs}")
        if user_prefs.ambiance:
            pref_parts.append(f"Preferred ambiance: {user_prefs.ambiance}")
        if pref_parts:
            pref_block = "User saved preferences:\n" + "\n".join(f"  - {p}" for p in pref_parts)

    tavily_block = ""
    if tavily_context and tavily_context.strip():
        tavily_block = f"\nLive web context (from Tavily search — use this for hours, events, trending info):\n{tavily_context}"

    return f"""You are a friendly, knowledgeable dining assistant for a Yelp-like restaurant discovery app.
Your job is to help users find great restaurants through natural, warm conversation.

{pref_block if pref_block else "No saved preferences on file for this user yet."}
{tavily_block}
Available restaurants in our database (use ONLY these, never invent restaurants):
{restaurant_catalog}

Instructions:
- Respond naturally and conversationally, like a helpful friend who knows food well.
- If the user greets you, chats casually, or asks something off-topic, respond warmly and guide them toward finding a restaurant.
- When making recommendations, reference restaurants from the list above by their exact name.
- Format recommendations as a numbered list: Name (cuisine, price, rating, city) - why it fits.
- Always use the user's saved preferences to personalise suggestions when relevant.
- Ask clarifying follow-up questions when the query is vague (e.g. "Which city?" or "Any dietary preferences?").
- Keep casual replies short (1-2 sentences). Keep recommendation replies focused (max 3-4 picks with reasoning).
- NEVER make up restaurants not in the database list.
- After your reply, if you recommended specific restaurants, append exactly this on a new line:
  RECOMMENDED_IDS: [id1, id2, id3]
  (use the ID numbers from the database list above)
"""


def _call_llm(system_prompt: str, conversation_history: list, user_message: str) -> str:
    if not _GROQ_AVAILABLE or not _LC_MESSAGES_AVAILABLE:
        return _fallback_response(user_message)

    api_key = os.getenv("GROQ_API_KEY", "").strip()
    if not api_key:
        return _fallback_response(user_message)

    try:
        llm = ChatGroq(
            api_key=api_key,
            model="llama-3.1-8b-instant",
            temperature=0.7,
            max_tokens=1024,
        )

        messages = [SystemMessage(content=system_prompt)]

        for msg in conversation_history[-8:]:
            role = str(msg.get("role", "")).lower()
            content = str(msg.get("content", "")).strip()
            if role == "user":
                messages.append(HumanMessage(content=content))
            elif role == "assistant":
                messages.append(AIMessage(content=content))

        messages.append(HumanMessage(content=user_message))

        response = llm.invoke(messages)
        return response.content if hasattr(response, "content") else str(response)

    except Exception as e:
        return f"I'm having a little trouble right now — please try again in a moment. (Error: {str(e)[:120]})"


def _fallback_response(user_message: str) -> str:
    lowered = user_message.lower().strip()
    greeting_pattern = re.compile(r'\b(hi|hello|hey|howdy|greetings|sup|yo)\b')
    if greeting_pattern.search(lowered) and len(lowered) < 30:
        return (
            "Hi there! I'm your dining assistant.\n"
            "Tell me what you're in the mood for — cuisine, budget, occasion, or city — "
            "and I'll find the perfect spot for you!\n\n"
            "Note: Add a GROQ_API_KEY to your .env to enable full AI responses."
        )
    return (
        "I'd love to help you find a great restaurant! "
        "Tell me what cuisine, city, or occasion you have in mind.\n\n"
        "Note: Add a GROQ_API_KEY to your .env to enable full AI responses."
    )


def _extract_recommended_ids(llm_reply: str) -> list:
    match = re.search(r"RECOMMENDED_IDS:\s*\[([^\]]*)\]", llm_reply, re.IGNORECASE)
    if not match:
        return []
    try:
        return [int(x.strip()) for x in match.group(1).split(",") if x.strip().isdigit()]
    except Exception:
        return []


def _clean_reply(llm_reply: str) -> str:
    return re.sub(r"\n?RECOMMENDED_IDS:\s*\[[^\]]*\]", "", llm_reply).strip()


# ── Main entry point ──────────────────────────────────────────────────────────

def recommend_restaurants(
    db: Session,
    user_id: int,
    message: str,
    conversation_history=None,
    limit: int = 5,
):
    conversation_history = conversation_history or []

    user_prefs = db.get(models.UserPreference, user_id)
    all_restaurants = db.query(models.Restaurant).all()
    rating_map = _get_avg_ratings(db)

    restaurant_catalog = _build_restaurant_catalog(all_restaurants, rating_map, limit=40)

    # Fetch live web context via Tavily only when query is about hours/events/trending
    tavily_context = ""
    if _should_use_tavily(message):
        tavily_context = _tavily_search(f"restaurant {message}")

    system_prompt = _build_system_prompt(user_prefs, restaurant_catalog, tavily_context)

    llm_reply = _call_llm(system_prompt, conversation_history, message)

    recommended_ids = _extract_recommended_ids(llm_reply)
    clean_reply = _clean_reply(llm_reply)

    restaurant_map = {r.id: r for r in all_restaurants}
    ranked = []
    for rid in recommended_ids[:limit]:
        r = restaurant_map.get(rid)
        if r:
            ranked.append({
                "restaurant": r,
                "score": 1.0,
                "reason": "recommended by AI assistant",
                "rating": rating_map.get(r.id),
            })

    extracted = {
        "cuisines": [],
        "city": None,
        "max_price_tier": None,
        "dietary": [],
        "ambiance": [],
        "occasion": [],
        "sort_by": "rating",
    }

    return extracted, ranked, clean_reply, []
