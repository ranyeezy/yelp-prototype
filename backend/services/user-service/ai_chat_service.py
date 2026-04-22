"""
AI Chat Service — LangChain + Groq (LLaMA 3) + MongoDB
Flow:
1. Load user preferences from MongoDB
2. Fetch all restaurants from MongoDB
3. Build a system prompt with user prefs + restaurant data
4. Send user message + conversation history to LLaMA 3 via Groq
5. LLM decides what to recommend and writes a natural response
6. Parse restaurant IDs mentioned in reply, attach them as structured recommendations
"""
from __future__ import annotations
import os
import re
from bson import ObjectId
from database import db

# ── LangChain / Groq ─────────────────────────────────────────────────────────
try:
    from langchain_groq import ChatGroq
    _GROQ_AVAILABLE = True
except ImportError:
    _GROQ_AVAILABLE = False

try:
    from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
    _LANGCHAIN_AVAILABLE = True
except ImportError:
    _LANGCHAIN_AVAILABLE = False

import logging

logger = logging.getLogger(__name__)

# ── Helper: Load User Preferences from MongoDB ───────────────────────────────
def get_user_preferences(user_id: str) -> dict:
    """Fetch user preferences from MongoDB"""
    try:
        user = db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            return {}
        
        prefs = db.user_preferences.find_one({"user_id": ObjectId(user_id)})
        if not prefs:
            return {"cuisine_types": [], "price_range": "any"}

        return {
            "cuisine_types": prefs.get("cuisines", ""),
            "price_range": f"{prefs.get('price_min', '')}-{prefs.get('price_max', '')}".strip("-") or "any",
            "dietary_restrictions": prefs.get("dietary_needs", ""),
            "distance_preference": prefs.get("search_radius", "any"),
            "preferred_locations": prefs.get("preferred_locations", ""),
            "ambiance": prefs.get("ambiance", ""),
        }
    except Exception as e:
        logger.error(f"Error fetching user preferences: {e}")
        return {}

# ── Helper: Load All Restaurants from MongoDB ────────────────────────────────
def get_all_restaurants() -> list[dict]:
    """Fetch all restaurants from MongoDB"""
    try:
        restaurants = list(db.restaurants.find().limit(50))  # Limit to 50 for context window
        
        # Convert ObjectId to string
        for r in restaurants:
            r["id"] = str(r["_id"])
            r["listed_by_user_id"] = str(r.get("listed_by_user_id"))
        
        return restaurants
    except Exception as e:
        logger.error(f"Error fetching restaurants: {e}")
        return []

# ── Helper: Parse Restaurant IDs from LLM Response ──────────────────────────
def parse_restaurant_recommendations(response_text: str, restaurants: list[dict]) -> list[str]:
    """
    Parse restaurant IDs from LLM response.
    Looks for patterns like "Restaurant ID: 507f1f77bcf86cd799439011" or restaurant names.
    """
    recommended_ids = []
    
    # Try to extract ObjectId-like patterns (24 hex chars)
    id_pattern = r'[a-f0-9]{24}'
    matches = re.findall(id_pattern, response_text)
    
    for match in matches:
        try:
            # Verify it's a valid ObjectId that exists in our restaurants
            if any(r["id"] == match for r in restaurants):
                recommended_ids.append(match)
        except Exception:
            pass
    
    # Also try to match by restaurant name
    for restaurant in restaurants:
        name = restaurant.get("name", "").lower()
        if name and name in response_text.lower():
            if restaurant["id"] not in recommended_ids:
                recommended_ids.append(restaurant["id"])
    
    return recommended_ids[:5]  # Limit to 5 recommendations

# ── Main AI Chat Function ────────────────────────────────────────────────────
def recommend_restaurants(
    user_id: str,
    user_message: str,
    conversation_history: list[dict] = None,
) -> dict:
    """
    AI-powered restaurant recommendation using LangChain + Groq.
    
    Args:
        user_id: MongoDB user ID (string)
        user_message: User's query
        conversation_history: List of previous messages in format [{"role": "user"/"assistant", "content": "..."}]
    
    Returns:
        {
            "response": "Natural language response from LLM",
            "recommendations": ["restaurant_id_1", "restaurant_id_2", ...],
            "error": None or error message
        }
    """
    
    if not _GROQ_AVAILABLE or not _LANGCHAIN_AVAILABLE:
        return {
            "response": "AI recommendations are currently unavailable. Please try browsing restaurants manually.",
            "recommendations": [],
            "error": "LangChain or Groq not installed"
        }
    
    try:
        # Load user data from MongoDB
        user_prefs = get_user_preferences(user_id)
        all_restaurants = get_all_restaurants()
        
        if not all_restaurants:
            return {
                "response": "No restaurants available at the moment.",
                "recommendations": [],
                "error": None
            }
        
        # Build restaurant context for LLM
        restaurant_context = "Available Restaurants:\n"
        for r in all_restaurants[:20]:  # Include first 20 for context
            restaurant_context += f"\n- {r.get('name')} (ID: {r['id']})"
            restaurant_context += f"\n  Cuisine: {r.get('cuisine_type', 'N/A')}"
            restaurant_context += f"\n  Price Tier: {r.get('price_tier', 'N/A')}"
            restaurant_context += f"\n  City: {r.get('city', 'N/A')}"
            restaurant_context += f"\n  Rating: {r.get('rating', 'Not rated yet')}"
        
        # Build system prompt
        system_prompt = f"""You are a helpful restaurant recommendation assistant.

User Preferences:
- Cuisine Types: {user_prefs.get('cuisine_types') or 'Any'}
- Price Range: {user_prefs.get('price_range') or 'Any'}
- Dietary Restrictions: {user_prefs.get('dietary_restrictions') or 'None'}
- Preferred Locations: {user_prefs.get('preferred_locations') or 'Any'}
- Ambiance: {user_prefs.get('ambiance') or 'Any'}

{restaurant_context}

When recommending restaurants, mention their names and IDs from the list above.
Respect the user's dietary restrictions and ambiance preferences strongly.
Be conversational and helpful. If you recommend restaurants, include their exact IDs."""
        
        # Initialize Groq LLM
        llm = ChatGroq(
            model="llama-3.3-70b-versatile",
            temperature=0.7,
            groq_api_key=os.getenv("GROQ_API_KEY"),
        )
        
        # Build message history
        messages = [SystemMessage(content=system_prompt)]
        
        if conversation_history:
            for msg in conversation_history:
                if msg["role"] == "user":
                    messages.append(HumanMessage(content=msg["content"]))
                elif msg["role"] == "assistant":
                    messages.append(AIMessage(content=msg["content"]))
        
        # Add current user message
        messages.append(HumanMessage(content=user_message))
        
        # Get response from Groq
        response = llm.invoke(messages)
        response_text = response.content
        
        # Parse recommendations from response
        recommendations = parse_restaurant_recommendations(response_text, all_restaurants)
        
        return {
            "response": response_text,
            "recommendations": recommendations,
            "error": None
        }
    
    except Exception as e:
        logger.error(f"Error in recommend_restaurants: {e}")
        return {
            "response": "I encountered an error while processing your request. Please try again.",
            "recommendations": [],
            "error": str(e)
        }