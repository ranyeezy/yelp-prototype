from pathlib import Path
import uuid

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session

from .. import crud_reviews as crud
from .. import schemas
from ..deps import get_current_user, get_db

router = APIRouter(prefix="/reviews", tags=["reviews"])
UPLOADS_DIR = Path(__file__).resolve().parents[2] / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)


@router.post("/uploads/photo", response_model=schemas.ReviewPhotoUploadOut)
def upload_review_photo(
    photo: UploadFile = File(...),
    current_user=Depends(get_current_user),
):
    if not photo.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Photo filename is required")
    extension = Path(photo.filename).suffix.lower()
    if extension not in {".jpg", ".jpeg", ".png", ".webp", ".gif"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported file type")
    unique_name = f"review_{current_user.id}_{uuid.uuid4().hex}{extension}"
    destination = UPLOADS_DIR / unique_name
    with destination.open("wb") as output_file:
        output_file.write(photo.file.read())
    return schemas.ReviewPhotoUploadOut(photo_url=f"/uploads/{unique_name}")


@router.post("", response_model=schemas.ReviewOut, status_code=201)
def create_review(
    payload: schemas.ReviewCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return crud.create_review(db, current_user.id, payload)


@router.get("/restaurant/{restaurant_id}", response_model=list[schemas.ReviewOut])
def list_reviews_for_restaurant(
    restaurant_id: int,
    db: Session = Depends(get_db),
):
    return crud.list_reviews_for_restaurant(db, restaurant_id)


@router.get("/me", response_model=list[schemas.UserReviewHistoryOut])
def list_my_reviews(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return crud.list_reviews_for_user(db, current_user.id)


@router.put("/{review_id}", response_model=schemas.ReviewOut)
def update_review(
    review_id: int,
    payload: schemas.ReviewUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    review = crud.get_review(db, review_id)
    if review.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own review",
        )
    return crud.update_review(db, review, payload)


@router.delete("/{review_id}", status_code=204)
def delete_review(
    review_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    review = crud.get_review(db, review_id)
    if review.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own review",
        )
    crud.delete_review(db, review)
