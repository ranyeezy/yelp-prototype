from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from . import models


def _attach_restaurant_photo_url(restaurant: models.Restaurant):
    photos = getattr(restaurant, "photos", None) or []
    primary_photo_url = photos[0].photo_url if photos else None
    setattr(restaurant, "photo_url", primary_photo_url)
    return restaurant


def _set_primary_photo(db: Session, restaurant_id: int, photo_url: str | None):
    existing_photos = (
        db.query(models.RestaurantPhoto)
        .filter(models.RestaurantPhoto.restaurant_id == restaurant_id)
        .order_by(models.RestaurantPhoto.id.asc())
        .all()
    )

    if not photo_url:
        for photo in existing_photos:
            db.delete(photo)
        return

    if existing_photos:
        existing_photos[0].photo_url = photo_url
        for extra_photo in existing_photos[1:]:
            db.delete(extra_photo)
        return

    db.add(models.RestaurantPhoto(restaurant_id=restaurant_id, photo_url=photo_url))


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
        .filter(models.OwnerRestaurant.restaurant_id == restaurant_id)
        .first()
    )
    if existing:
        if existing.owner_id == owner_id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Restaurant already claimed by this owner",
            )
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Restaurant is already claimed by another owner",
        )

    claim = models.OwnerRestaurant(owner_id=owner_id, restaurant_id=restaurant_id)
    db.add(claim)
    db.commit()
    db.refresh(claim)
    return claim


def create_owner_restaurant(db: Session, owner_id: int, payload):
    payload_data = payload.model_dump(exclude={"photo_url"})
    restaurant = models.Restaurant(**payload_data)
    db.add(restaurant)
    db.commit()
    db.refresh(restaurant)

    claim = models.OwnerRestaurant(owner_id=owner_id, restaurant_id=restaurant.id)
    db.add(claim)

    if payload.photo_url:
        _set_primary_photo(db, restaurant.id, payload.photo_url)

    db.commit()
    db.refresh(restaurant)
    return _attach_restaurant_photo_url(restaurant)


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
    ratings_distribution = {str(value): 0 for value in range(1, 6)}
    positive_reviews = 0
    neutral_reviews = 0
    negative_reviews = 0
    total_views = 0
    recent_reviews = []

    if restaurant_ids:
        favorites_count = (
            db.query(func.count(models.Favorite.id))
            .filter(models.Favorite.restaurant_id.in_(restaurant_ids))
            .scalar()
        )
        total_views = int(favorites_count or 0)

        rating_rows = (
            db.query(models.Review.rating)
            .filter(models.Review.restaurant_id.in_(restaurant_ids))
            .all()
        )
        for (rating_value,) in rating_rows:
            normalized_rating = int(rating_value)
            if str(normalized_rating) in ratings_distribution:
                ratings_distribution[str(normalized_rating)] += 1

            if normalized_rating >= 4:
                positive_reviews += 1
            elif normalized_rating <= 2:
                negative_reviews += 1
            else:
                neutral_reviews += 1

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

    sentiment_summary = "Neutral"
    if positive_reviews > max(neutral_reviews, negative_reviews):
        sentiment_summary = "Mostly Positive"
    elif negative_reviews > max(neutral_reviews, positive_reviews):
        sentiment_summary = "Mostly Negative"

    return {
        "claimed_restaurants": claimed_restaurants,
        "total_reviews": total_reviews,
        "total_views": total_views,
        "avg_rating": avg_rating,
        "ratings_distribution": ratings_distribution,
        "positive_reviews": positive_reviews,
        "neutral_reviews": neutral_reviews,
        "negative_reviews": negative_reviews,
        "sentiment_summary": sentiment_summary,
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
    return _attach_restaurant_photo_url(restaurant)


def update_claimed_restaurant(db: Session, owner_id: int, restaurant_id: int, payload):
    restaurant = get_claimed_restaurant(db, owner_id, restaurant_id)
    data = payload.model_dump(exclude_unset=True, exclude={"photo_url"})
    for key, value in data.items():
        setattr(restaurant, key, value)

    if "photo_url" in payload.model_fields_set:
        _set_primary_photo(db, restaurant.id, payload.photo_url)

    db.commit()
    db.refresh(restaurant)
    return _attach_restaurant_photo_url(restaurant)


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
            "photo_url": review.photo_url,
            "created_at": review.created_at,
            "updated_at": review.updated_at,
        }
        for review, user in rows
    ]
