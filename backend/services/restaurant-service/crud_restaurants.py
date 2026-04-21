from datetime import datetime
from bson import ObjectId
from fastapi import HTTPException, status
from database import db
import schemas


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


def create_restaurant(user_id: str, payload: schemas.RestaurantCreate):
    """Create a new restaurant"""
    payload_data = payload.model_dump(exclude={"photo_url"})
    
    restaurant_doc = {
        **payload_data,
        "listed_by_user_id": ObjectId(user_id),
        "photos": [],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    
    result = db.restaurants.insert_one(restaurant_doc)
    restaurant_doc["id"] = result.inserted_id

    if payload.photo_url:
        _set_primary_photo(str(result.inserted_id), payload.photo_url)
        restaurant_doc["photos"] = [payload.photo_url]

    return _attach_restaurant_photo_url(restaurant_doc)


def get_restaurant(restaurant_id: str):
    """Get restaurant by ID"""
    restaurant = db.restaurants.find_one({"_id": ObjectId(restaurant_id)})
    if not restaurant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Restaurant not found"
        )
    restaurant["id"] = restaurant["_id"]
    return _attach_restaurant_photo_url(restaurant)


def list_restaurants(
    name: str | None = None,
    cuisine_type: str | None = None,
    keyword: str | None = None,
    city: str | None = None,
    zip: str | None = None,
    skip: int = 0,
    limit: int = 50,
):
    """List restaurants with optional filters"""
    filters = {}
    
    if name:
        filters["name"] = {"$regex": name, "$options": "i"}
    if cuisine_type:
        filters["cuisine_type"] = {"$regex": cuisine_type, "$options": "i"}
    if city:
        filters["city"] = {"$regex": city, "$options": "i"}
    if zip:
        filters["zip"] = {"$regex": zip, "$options": "i"}
    
    if keyword:
        # Search across multiple fields
        filters["$or"] = [
            {"name": {"$regex": keyword, "$options": "i"}},
            {"description": {"$regex": keyword, "$options": "i"}},
            {"amenities": {"$regex": keyword, "$options": "i"}},
            {"cuisine_type": {"$regex": keyword, "$options": "i"}},
        ]
    
    restaurants = list(
        db.restaurants.find(filters)
        .sort("_id", -1)
        .skip(skip)
        .limit(limit)
    )
    
    for restaurant in restaurants:
        restaurant["id"] = restaurant["_id"]
        _attach_restaurant_photo_url(restaurant)
    
    return restaurants


def update_restaurant(restaurant_id: str, payload: schemas.RestaurantUpdate):
    """Update restaurant"""
    data = payload.model_dump(exclude_unset=True, exclude={"photo_url"})
    data["updated_at"] = datetime.utcnow()
    
    result = db.restaurants.update_one(
        {"_id": ObjectId(restaurant_id)},
        {"$set": data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Restaurant not found"
        )
    
    if "photo_url" in payload.model_fields_set:
        _set_primary_photo(restaurant_id, payload.photo_url)
    
    restaurant = db.restaurants.find_one({"_id": ObjectId(restaurant_id)})
    restaurant["id"] = restaurant["_id"]
    return _attach_restaurant_photo_url(restaurant)


def delete_restaurant(restaurant_id: str):
    """Delete restaurant"""
    result = db.restaurants.delete_one({"_id": ObjectId(restaurant_id)})
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Restaurant not found"
        )