from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from . import models


def _ensure_claim(db: Session, owner_id: int, restaurant_id: int):
    claim = (
        db.query(models.OwnerRestaurant)
        .filter(
            models.OwnerRestaurant.owner_id == owner_id,
            models.OwnerRestaurant.restaurant_id == restaurant_id,
        )
        .first()
    )
    if claim is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only manage restaurants you have claimed",
        )
    return claim


def claim_restaurant(db: Session, owner_id: int, restaurant_id: int):
    restaurant = db.get(models.Restaurant, restaurant_id)
    if not restaurant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Restaurant not found",
        )

    existing = (
        db.query(models.OwnerRestaurant)
        .filter(
            models.OwnerRestaurant.owner_id == owner_id,
            models.OwnerRestaurant.restaurant_id == restaurant_id,
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Restaurant already claimed by this owner",
        )

    claim = models.OwnerRestaurant(owner_id=owner_id, restaurant_id=restaurant_id)
    db.add(claim)
    db.commit()
    db.refresh(claim)
    return claim


def list_claimed_restaurants(db: Session, owner_id: int):
    claims = (
        db.query(models.OwnerRestaurant)
        .filter(models.OwnerRestaurant.owner_id == owner_id)
        .all()
    )

    summaries = []
    for claim in claims:
        restaurant = db.get(models.Restaurant, claim.restaurant_id)
        if restaurant is None:
            continue

        rating_stats = (
            db.query(
                func.avg(models.Review.rating).label("avg_rating"),
                func.count(models.Review.id).label("review_count"),
            )
            .filter(models.Review.restaurant_id == restaurant.id)
            .one()
        )

        avg_rating = float(rating_stats.avg_rating) if rating_stats.avg_rating is not None else None
        review_count = int(rating_stats.review_count or 0)

        summaries.append(
            {
                "id": restaurant.id,
                "name": restaurant.name,
                "cuisine_type": restaurant.cuisine_type,
                "city": restaurant.city,
                "avg_rating": avg_rating,
                "review_count": review_count,
            }
        )

    return summaries


def get_owner_dashboard(db: Session, owner_id: int):
    restaurants = list_claimed_restaurants(db, owner_id)

    claimed_restaurants = len(restaurants)
    total_reviews = sum(item["review_count"] for item in restaurants)

    rating_values = [item["avg_rating"] for item in restaurants if item["avg_rating"] is not None]
    avg_rating = None
    if rating_values:
        avg_rating = round(sum(rating_values) / len(rating_values), 2)

    restaurant_ids = [item["id"] for item in restaurants]
    recent_reviews = []
    if restaurant_ids:
        rows = (
            db.query(models.Review, models.Restaurant)
            .join(models.Restaurant, models.Review.restaurant_id == models.Restaurant.id)
            .filter(models.Review.restaurant_id.in_(restaurant_ids))
            .order_by(models.Review.created_at.desc())
            .limit(10)
            .all()
        )
        recent_reviews = [
            {
                "review_id": review.id,
                "restaurant_id": restaurant.id,
                "restaurant_name": restaurant.name,
                "rating": review.rating,
                "comment": review.comment,
                "created_at": review.created_at,
            }
            for review, restaurant in rows
        ]

    return {
        "claimed_restaurants": claimed_restaurants,
        "total_reviews": total_reviews,
        "avg_rating": avg_rating,
        "restaurants": restaurants,
        "recent_reviews": recent_reviews,
    }


def get_claimed_restaurant(db: Session, owner_id: int, restaurant_id: int):
    _ensure_claim(db, owner_id, restaurant_id)
    restaurant = db.get(models.Restaurant, restaurant_id)
    if restaurant is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Restaurant not found",
        )
    return restaurant


def update_claimed_restaurant(db: Session, owner_id: int, restaurant_id: int, payload):
    restaurant = get_claimed_restaurant(db, owner_id, restaurant_id)
    data = payload.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(restaurant, key, value)
    db.commit()
    db.refresh(restaurant)
    return restaurant


def list_claimed_restaurant_reviews(db: Session, owner_id: int, restaurant_id: int):
    _ensure_claim(db, owner_id, restaurant_id)
    rows = (
        db.query(models.Review, models.User)
        .join(models.User, models.Review.user_id == models.User.id)
        .filter(models.Review.restaurant_id == restaurant_id)
        .order_by(models.Review.created_at.desc())
        .all()
    )

    return [
        {
            "id": review.id,
            "user_id": review.user_id,
            "user_name": user.name,
            "restaurant_id": review.restaurant_id,
            "rating": review.rating,
            "comment": review.comment,
            "created_at": review.created_at,
            "updated_at": review.updated_at,
        }
        for review, user in rows
    ]
