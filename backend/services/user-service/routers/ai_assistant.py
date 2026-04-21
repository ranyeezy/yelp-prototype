from fastapi import APIRouter, Depends
from schemas import AIChatResponse, AIChatRequest, RecommendedRestaurant
from ai_chat_service import recommend_restaurants
from deps import get_current_user

router = APIRouter(prefix="/ai-assistant", tags=["ai-assistant"])


@router.post("/chat", response_model=AIChatResponse)
def chat_with_assistant(
    payload: AIChatRequest,
    current_user=Depends(get_current_user),
):
    user_id = str(current_user["id"])
    extracted_filters, ranked, reply, web_context = recommend_restaurants(
        user_id=user_id,
        message=payload.message,
        conversation_history=[msg.model_dump() for msg in payload.conversation_history],
    )

    recommendations = [
        RecommendedRestaurant(
            id=str(item["restaurant"]["_id"]),
            name=item["restaurant"]["name"],
            cuisine_type=item["restaurant"]["cuisine_type"],
            city=item["restaurant"]["city"],
            rating=item.get("rating"),
            price_tier=item["restaurant"]["price_tier"],
            score=round(float(item["score"]), 2),
            reason=str(item["reason"]),
        )
        for item in ranked
    ]

    return AIChatResponse(
        reply=reply,
        extracted_filters=extracted_filters,
        recommendations=recommendations,
        web_context=web_context,
    )