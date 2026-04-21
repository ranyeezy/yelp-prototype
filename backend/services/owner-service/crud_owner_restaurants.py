from datetime import datetime
from bson import ObjectId
from fastapi import HTTPException, status
from database import db


def _attach_restaurant_photo_url(restaurant: dict):
    """Attach primary photo URL to restaurant document"""
    photos = restaurant.get("photos", [])
    primary_photo_url = photos[0] if photos else None
    restaurant["photo_url"] = primary_photo_url
    return restaurant


def _set_primary_photo(restaurant_id: str, photo_url: str | None):
    """Update or set primary photo for restaurant"""
    if not photo_url:
        # Remove all photos
        db.restaurants.update_one(
            {"_id": ObjectId(restaurant_id)},
            {"$set": {"photos": []}}
        )
        return

    # Get existing photos
    restaurant = db.restaurants.find_one({"_id": ObjectId(restaurant_id)})
    existing_photos = restaurant.get("photos", [])

    if existing_photos:
        # Replace first photo, remove others
        db.restaurants.update_one(
            {"_id": ObjectId(restaurant_id)},
            {"$set": {"photos": [photo_url]}}
        )
    else:
        # Add new photo
        db.restaurants.update_one(
            {"_id": ObjectId(restaurant_id)},
            {"$push": {"photos": photo_url}}
        )


def _ensure_claim(owner_id: str, restaurant_id: str):
    """Verify owner has claimed this restaurant"""
    claim = db.owner_restaurants.find_one({
        "owner_id": ObjectId(owner_id),
        "restaurant_id": ObjectId(restaurant_id),
    })
    if claim is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only manage restaurants you have claimed",
        )
    return claim


def claim_restaurant(owner_id: str, restaurant_id: str):
    """Owner claims a restaurant"""
    restaurant = db.restaurants.find_one({"_id": ObjectId(restaurant_id)})
    if not restaurant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Restaurant not found",
        )

    existing = db.owner_restaurants.find_one({
        "restaurant_id": ObjectId(restaurant_id)
    })
    if existing:
        if str(existing["owner_id"]) == owner_id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Restaurant already claimed by this owner",
            )
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Restaurant is already claimed by another owner",
        )

    claim_doc = {
        "owner_id": ObjectId(owner_id),
        "restaurant_id": ObjectId(restaurant_id),
        "created_at": datetime.utcnow(),
    }
    result = db.owner_restaurants.insert_one(claim_doc)
    claim_doc["id"] = result.inserted_id
    return claim_doc


def create_owner_restaurant(owner_id: str, payload):
    """Owner creates a new restaurant they automatically claim"""
    payload_data = payload.model_dump(exclude={"photo_url"})
    
    restaurant_doc = {
        **payload_data,
        "listed_by_user_id": ObjectId(owner_id),
        "photos": [],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    
    result = db.restaurants.insert_one(restaurant_doc)
    restaurant_doc["id"] = result.inserted_id

    # Auto-claim restaurant for owner
    claim_doc = {
        "owner_id": ObjectId(owner_id),
        "restaurant_id": result.inserted_id,
        "created_at": datetime.utcnow(),
    }
    db.owner_restaurants.insert_one(claim_doc)

    if payload.photo_url:
        _set_primary_photo(str(result.inserted_id), payload.photo_url)
        restaurant_doc["photos"] = [payload.photo_url]

    return _attach_restaurant_photo_url(restaurant_doc)


def unclaim_restaurant(owner_id: str, restaurant_id: str):
    """Owner unclaims a restaurant"""
    _ensure_claim(owner_id, restaurant_id)
    db.owner_restaurants.delete_one({
        "owner_id": ObjectId(owner_id),
        "restaurant_id": ObjectId(restaurant_id),
    })


def list_claimed_restaurants(owner_id: str):
    """List all restaurants claimed by owner with ratings"""
    claims = list(db.owner_restaurants.find({"owner_id": ObjectId(owner_id)}))

    summaries = []
    for claim in claims:
        restaurant = db.restaurants.find_one({"_id": claim["restaurant_id"]})
        if restaurant is None:
            continue

        # Calculate rating stats
        reviews = list(db.reviews.find({"restaurant_id": restaurant["_id"]}))
        ratings = [r["rating"] for r in reviews]
        
        avg_rating = None
        if ratings:
            avg_rating = sum(ratings) / len(ratings)
        
        review_count = len(reviews)

        summaries.append({
            "id": restaurant["_id"],
            "name": restaurant["name"],
            "cuisine_type": restaurant["cuisine_type"],
            "city": restaurant["city"],
            "avg_rating": avg_rating,
            "review_count": review_count,
        })

    return summaries


def get_owner_dashboard(owner_id: str):
    """Get owner dashboard with analytics"""
    restaurants = list_claimed_restaurants(owner_id)

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
    total_favorites = 0
    recent_reviews = []

    if restaurant_ids:
        # Count favorites
        total_favorites = db.favorites.count_documents({
            "restaurant_id": {"$in": restaurant_ids}
        })

        # Analyze ratings distribution
        reviews = list(db.reviews.find({"restaurant_id": {"$in": restaurant_ids}}))
        
        for review in reviews:
            rating_value = review["rating"]
            normalized_rating = int(rating_value)
            if str(normalized_rating) in ratings_distribution:
                ratings_distribution[str(normalized_rating)] += 1

            if normalized_rating >= 4:
                positive_reviews += 1
            elif normalized_rating <= 2:
                negative_reviews += 1
            else:
                neutral_reviews += 1

        # Get recent reviews
        recent_review_docs = list(
            db.reviews.find({"restaurant_id": {"$in": restaurant_ids}})
            .sort("created_at", -1)
            .limit(10)
        )
        
        for review in recent_review_docs:
            restaurant = db.restaurants.find_one({"_id": review["restaurant_id"]})
            if restaurant:
                recent_reviews.append({
                    "review_id": review["_id"],
                    "restaurant_id": review["restaurant_id"],
                    "restaurant_name": restaurant["name"],
                    "rating": review["rating"],
                    "comment": review["comment"],
                    "created_at": review["created_at"],
                })

    sentiment_summary = "Neutral"
    if positive_reviews > max(neutral_reviews, negative_reviews):
        sentiment_summary = "Mostly Positive"
    elif negative_reviews > max(neutral_reviews, positive_reviews):
        sentiment_summary = "Mostly Negative"

    return {
        "claimed_restaurants": claimed_restaurants,
        "total_reviews": total_reviews,
        "total_favorites": total_favorites,
        "avg_rating": avg_rating,
        "ratings_distribution": ratings_distribution,
        "positive_reviews": positive_reviews,
        "neutral_reviews": neutral_reviews,
        "negative_reviews": negative_reviews,
        "sentiment_summary": sentiment_summary,
        "restaurants": restaurants,
        "recent_reviews": recent_reviews,
    }


def get_claimed_restaurant(owner_id: str, restaurant_id: str):
    """Get a claimed restaurant (verify ownership)"""
    _ensure_claim(owner_id, restaurant_id)
    restaurant = db.restaurants.find_one({"_id": ObjectId(restaurant_id)})
    if restaurant is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Restaurant not found",
        )
    restaurant["id"] = restaurant["_id"]
    return _attach_restaurant_photo_url(restaurant)


def update_claimed_restaurant(owner_id: str, restaurant_id: str, payload):
    """Update a claimed restaurant"""
    restaurant = get_claimed_restaurant(owner_id, restaurant_id)
    data = payload.model_dump(exclude_unset=True, exclude={"photo_url"})
    data["updated_at"] = datetime.utcnow()
    
    db.restaurants.update_one(
        {"_id": ObjectId(restaurant_id)},
        {"$set": data}
    )

    if "photo_url" in payload.model_fields_set:
        _set_primary_photo(restaurant_id, payload.photo_url)

    restaurant = db.restaurants.find_one({"_id": ObjectId(restaurant_id)})
    restaurant["id"] = restaurant["_id"]
    return _attach_restaurant_photo_url(restaurant)


def list_claimed_restaurant_reviews(owner_id: str, restaurant_id: str):
    """List reviews for a claimed restaurant"""
    _ensure_claim(owner_id, restaurant_id)
    
    reviews = list(
        db.reviews.find({"restaurant_id": ObjectId(restaurant_id)})
        .sort("created_at", -1)
    )

    result = []
    for review in reviews:
        user = db.users.find_one({"_id": review["user_id"]})
        if user is None:
            continue
        
        result.append({
            "id": review["_id"],
            "user_id": review["user_id"],
            "user_name": user["name"],
            "restaurant_id": review["restaurant_id"],
            "rating": review["rating"],
            "comment": review["comment"],
            "photo_url": review["photo_url"],
            "created_at": review["created_at"],
            "updated_at": review["updated_at"],
        })
    
    return result