from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from . import models, schemas


def create_review(db: Session, user_id: int, payload: schemas.ReviewCreate):
    restaurant = db.get(models.Restaurant, payload.restaurant_id)
    if not restaurant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Restaurant not found",
        )

    existing_review = (
        db.query(models.Review)
        .filter(
            models.Review.user_id == user_id,
            models.Review.restaurant_id == payload.restaurant_id,
        )
        .first()
    )
    if existing_review:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You have already reviewed this restaurant",
        )

    review = models.Review(
        user_id=user_id,
        restaurant_id=payload.restaurant_id,
        rating=payload.rating,
        comment=payload.comment,
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return review


def list_reviews_for_restaurant(db: Session, restaurant_id: int):
    restaurant = db.get(models.Restaurant, restaurant_id)
    if not restaurant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Restaurant not found",
        )

    return (
        db.query(models.Review)
        .filter(models.Review.restaurant_id == restaurant_id)
        .order_by(models.Review.created_at.desc())
        .all()
    )


def get_review(db: Session, review_id: int):
    review = db.get(models.Review, review_id)
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found",
        )
    return review


def update_review(db: Session, review: models.Review, payload: schemas.ReviewUpdate):
    data = payload.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(review, key, value)

    db.commit()
    db.refresh(review)
    return review


def delete_review(db: Session, review: models.Review):
    db.delete(review)
    db.commit()
