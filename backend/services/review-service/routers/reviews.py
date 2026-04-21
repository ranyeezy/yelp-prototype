from pathlib import Path
import uuid
import logging

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File

import crud_reviews as crud
from schemas import ReviewOut, ReviewCreate, ReviewUpdate, ReviewPhotoUploadOut, UserReviewHistoryOut
from deps import get_current_user
from kafka_producer import publish_review_created, publish_review_updated, publish_review_deleted

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/reviews", tags=["reviews"])
UPLOADS_DIR = Path(__file__).resolve().parents[0] / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)


@router.post("/uploads/photo", response_model=ReviewPhotoUploadOut)
def upload_review_photo(
    photo: UploadFile = File(...),
    current_user=Depends(get_current_user),
):
    if not photo.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Photo filename is required")
    extension = Path(photo.filename).suffix.lower()
    if extension not in {".jpg", ".jpeg", ".png", ".webp", ".gif"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported file type")
    unique_name = f"review_{current_user['id']}_{uuid.uuid4().hex}{extension}"
    destination = UPLOADS_DIR / unique_name
    with destination.open("wb") as output_file:
        output_file.write(photo.file.read())
    return ReviewPhotoUploadOut(photo_url=f"/uploads/{unique_name}")


@router.post("", status_code=202)
def create_review(
    payload: ReviewCreate,
    current_user=Depends(get_current_user),
):
    user_id = str(current_user["id"])
    # Validate restaurant exists and user hasn't already reviewed it
    crud.validate_review_create(user_id, payload)

    publish_review_created(
        review_id=None,
        restaurant_id=str(payload.restaurant_id),
        user_id=user_id,
        rating=payload.rating,
        comment=payload.comment,
        photo_url=payload.photo_url,
    )
    return {"status": "accepted", "message": "Review is being processed"}


@router.get("/restaurant/{restaurant_id}", response_model=list[ReviewOut])
def list_reviews_for_restaurant(restaurant_id: str):
    return crud.list_reviews_for_restaurant(restaurant_id)


@router.get("/me", response_model=list[UserReviewHistoryOut])
def list_my_reviews(
    current_user=Depends(get_current_user),
):
    user_id = str(current_user["id"])
    return crud.list_reviews_for_user(user_id)


@router.put("/{review_id}", status_code=202)
def update_review(
    review_id: str,
    payload: ReviewUpdate,
    current_user=Depends(get_current_user),
):
    user_id = str(current_user["id"])
    review = crud.get_review(review_id)
    
    if str(review["user_id"]) != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own review",
        )

    publish_review_updated(
        review_id=review_id,
        restaurant_id=str(review["restaurant_id"]),
        user_id=user_id,
        rating=payload.rating if payload.rating is not None else review["rating"],
        comment=payload.comment if payload.comment is not None else review["comment"],
    )
    return {"status": "accepted", "message": "Review update is being processed"}


@router.delete("/{review_id}", status_code=202)
def delete_review(
    review_id: str,
    current_user=Depends(get_current_user),
):
    user_id = str(current_user["id"])
    review = crud.get_review(review_id)
    
    if str(review["user_id"]) != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own review",
        )

    publish_review_deleted(review_id=review_id)
    return {"status": "accepted", "message": "Review deletion is being processed"}