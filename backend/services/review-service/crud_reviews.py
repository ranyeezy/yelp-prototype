from datetime import datetime
from bson import ObjectId
from fastapi import HTTPException, status
from database import db
import schemas


def validate_review_create(user_id: str, payload: schemas.ReviewCreate):
    """Validate review creation - check restaurant exists and no duplicate review"""
    restaurant = db.restaurants.find_one({"_id": ObjectId(payload.restaurant_id)})
    if not restaurant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Restaurant not found",
        )

    existing_review = db.reviews.find_one({
        "user_id": ObjectId(user_id),
        "restaurant_id": ObjectId(payload.restaurant_id),
    })
    if existing_review:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You have already reviewed this restaurant",
        )


def create_review(user_id: str, payload: schemas.ReviewCreate):
    """Create a new review"""
    review_doc = {
        "user_id": ObjectId(user_id),
        "restaurant_id": ObjectId(payload.restaurant_id),
        "rating": payload.rating,
        "comment": payload.comment,
        "photo_url": payload.photo_url,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    
    result = db.reviews.insert_one(review_doc)
    review_doc["id"] = result.inserted_id
    return review_doc


def list_reviews_for_restaurant(restaurant_id: str):
    """List all reviews for a restaurant with user details"""
    # Check restaurant exists
    restaurant = db.restaurants.find_one({"_id": ObjectId(restaurant_id)})
    if not restaurant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Restaurant not found",
        )

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


def get_review(review_id: str):
    """Get review by ID"""
    review = db.reviews.find_one({"_id": ObjectId(review_id)})
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found",
        )
    review["id"] = review["_id"]
    return review


def update_review(review_id: str, payload: schemas.ReviewUpdate):
    """Update review"""
    data = payload.model_dump(exclude_unset=True)
    data["updated_at"] = datetime.utcnow()
    
    result = db.reviews.update_one(
        {"_id": ObjectId(review_id)},
        {"$set": data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found",
        )
    
    review = db.reviews.find_one({"_id": ObjectId(review_id)})
    review["id"] = review["_id"]
    return review


def delete_review(review_id: str):
    """Delete review"""
    result = db.reviews.delete_one({"_id": ObjectId(review_id)})
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found",
        )


def list_reviews_for_user(user_id: str):
    """List all reviews by a user with restaurant details"""
    reviews = list(
        db.reviews.find({"user_id": ObjectId(user_id)})
        .sort("created_at", -1)
    )

    result = []
    for review in reviews:
        user = db.users.find_one({"_id": review["user_id"]})
        restaurant = db.restaurants.find_one({"_id": review["restaurant_id"]})
        
        if user is None or restaurant is None:
            continue
        
        result.append({
            "id": review["_id"],
            "user_name": user["name"],
            "restaurant_id": review["restaurant_id"],
            "restaurant_name": restaurant["name"],
            "restaurant_city": restaurant["city"],
            "rating": review["rating"],
            "comment": review["comment"],
            "photo_url": review["photo_url"],
            "created_at": review["created_at"],
            "updated_at": review["updated_at"],
        })
    
    return result