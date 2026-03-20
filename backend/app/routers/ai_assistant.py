from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import schemas
from ..ai_chat_service import recommend_restaurants
from ..deps import get_current_user, get_db

router = APIRouter(prefix="/ai-assistant", tags=["ai-assistant"])


@router.post("/chat", response_model=schemas.AIChatResponse)
def chat_with_assistant(
    payload: schemas.AIChatRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    extracted_filters, ranked, reply, web_context = recommend_restaurants(
        db=db,
        user_id=current_user.id,
        message=payload.message,
        conversation_history=[msg.model_dump() for msg in payload.conversation_history],
    )

    recommendations = [
        schemas.RecommendedRestaurant(
            id=restaurant.id,
            name=restaurant.name,
            cuisine_type=restaurant.cuisine_type,
            city=restaurant.city,
            price_tier=restaurant.price_tier,
            score=round(score, 2),
            reason=reason,
        )
        for restaurant, score, reason in ranked
    ]

    return schemas.AIChatResponse(
        reply=reply,
        extracted_filters=extracted_filters,
        recommendations=recommendations,
        web_context=web_context,
    )
