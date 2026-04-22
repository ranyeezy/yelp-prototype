from fastapi import APIRouter, Depends, HTTPException
from schemas import AIChatResponse, AIChatRequest, RecommendedRestaurant
from ai_chat_service import recommend_restaurants, get_all_restaurants
from deps import get_current_user
from database import db

router = APIRouter(prefix="/ai-assistant", tags=["ai-assistant"])


def _get_ratings(db) -> dict:
    pipeline = [
        {"$group": {"_id": "$restaurant_id", "avg": {"$avg": "$rating"}}}
    ]
    return {str(doc["_id"]): round(doc["avg"], 1) for doc in db.reviews.aggregate(pipeline)}


@router.post("/chat", response_model=AIChatResponse)
def chat_with_assistant(
    payload: AIChatRequest,
    current_user=Depends(get_current_user),
):
    user_id = str(current_user["id"])
    result = recommend_restaurants(
        user_id=user_id,
        user_message=payload.message,
        conversation_history=[msg.model_dump() for msg in payload.conversation_history],
    )

    if result.get("error") and not result.get("response"):
        raise HTTPException(status_code=500, detail=result["error"])

    ratings = _get_ratings(db)
    all_restaurants = get_all_restaurants()
    restaurant_map = {r["id"]: r for r in all_restaurants}

    recommendations = []
    for i, rid in enumerate(result.get("recommendations", [])):
        r = restaurant_map.get(rid)
        if r:
            photos = r.get("photos") or []
            photo_url = photos[0] if photos else r.get("photo_url")
            recommendations.append(RecommendedRestaurant(
                id=rid,
                name=r.get("name", ""),
                cuisine_type=r.get("cuisine_type", ""),
                city=r.get("city", ""),
                rating=ratings.get(rid),
                price_tier=r.get("price_tier"),
                score=round(1.0 - i * 0.1, 2),
                reason="Recommended based on your query",
                photo_url=photo_url,
            ))

    return AIChatResponse(
        reply=result.get("response", ""),
        extracted_filters={},
        recommendations=recommendations,
        web_context=[],
    )
