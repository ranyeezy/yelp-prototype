from datetime import datetime
from bson import ObjectId
from fastapi import HTTPException, status
from database import db


def add_favorite(user_id: str, restaurant_id: str):
    """Add restaurant to user favorites"""
    # Check restaurant exists
    restaurant = db.restaurants.find_one({"_id": ObjectId(restaurant_id)})
    if not restaurant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Restaurant not found",
        )

    # Check if already favorited
    existing = db.favorites.find_one({
        "user_id": ObjectId(user_id),
        "restaurant_id": ObjectId(restaurant_id),
    })
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Restaurant already in favorites",
        )

    favorite_doc = {
        "user_id": ObjectId(user_id),
        "restaurant_id": ObjectId(restaurant_id),
        "created_at": datetime.utcnow(),
    }
    
    result = db.favorites.insert_one(favorite_doc)
    favorite_doc["id"] = result.inserted_id
    return favorite_doc


def list_my_favorites(user_id: str):
    """List all favorites for a user with restaurant details"""
    favorites = list(
        db.favorites.find({"user_id": ObjectId(user_id)})
        .sort("created_at", -1)
    )

    result = []
    for favorite in favorites:
        restaurant = db.restaurants.find_one({"_id": favorite["restaurant_id"]})
        if restaurant is None:
            continue
        
        restaurant["id"] = restaurant["_id"]
        result.append({
            "favorite_id": favorite["_id"],
            "favorited_at": favorite["created_at"],
            "restaurant": restaurant,
        })
    
    return result


def remove_favorite(user_id: str, restaurant_id: str):
    """Remove restaurant from favorites"""
    favorite = db.favorites.find_one({
        "user_id": ObjectId(user_id),
        "restaurant_id": ObjectId(restaurant_id),
    })
    
    if not favorite:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Favorite not found",
        )

    db.favorites.delete_one({
        "user_id": ObjectId(user_id),
        "restaurant_id": ObjectId(restaurant_id),
    })