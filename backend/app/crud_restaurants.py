from sqlalchemy.orm import Session
from sqlalchemy import or_
from fastapi import HTTPException, status
from . import models, schemas


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

def create_restaurant(db: Session, user_id: int, payload: schemas.RestaurantCreate):
    payload_data = payload.model_dump(exclude={"photo_url"})
    restaurant = models.Restaurant(
        **payload_data,
        listed_by_user_id=user_id
    )
    db.add(restaurant)
    db.commit()
    db.refresh(restaurant)

    if payload.photo_url:
        _set_primary_photo(db, restaurant.id, payload.photo_url)
        db.commit()
        db.refresh(restaurant)

    return _attach_restaurant_photo_url(restaurant)

def get_restaurant(db: Session, restaurant_id: int):
    restaurant = db.get(models.Restaurant, restaurant_id)
    if not restaurant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Restaurant not found"
        )
    return _attach_restaurant_photo_url(restaurant)

def list_restaurants(
    db: Session,
    name: str | None = None,
    cuisine_type: str | None = None,
    keyword: str | None = None,
    city: str | None = None,
    zip: str | None = None,
):
    query = db.query(models.Restaurant)
    if name:
        query = query.filter(models.Restaurant.name.ilike(f"%{name}%"))
    if cuisine_type:
        query = query.filter(models.Restaurant.cuisine_type.ilike(f"%{cuisine_type}%"))
    if city:
        query = query.filter(models.Restaurant.city.ilike(f"%{city}%"))
    if zip:
        query = query.filter(models.Restaurant.zip.ilike(f"%{zip}%"))
    if keyword:
        query = query.filter(
            or_(
                models.Restaurant.name.ilike(f"%{keyword}%"),
                models.Restaurant.description.ilike(f"%{keyword}%"),
                models.Restaurant.amenities.ilike(f"%{keyword}%"),
                models.Restaurant.cuisine_type.ilike(f"%{keyword}%"),
            )
        )
    restaurants = query.order_by(models.Restaurant.id.desc()).all()
    return [_attach_restaurant_photo_url(restaurant) for restaurant in restaurants]

def update_restaurant(db: Session, restaurant, payload: schemas.RestaurantUpdate):
    data = payload.model_dump(exclude_unset=True, exclude={"photo_url"})
    for k, v in data.items():
        setattr(restaurant, k, v)

    if "photo_url" in payload.model_fields_set:
        _set_primary_photo(db, restaurant.id, payload.photo_url)

    db.commit()
    db.refresh(restaurant)
    return _attach_restaurant_photo_url(restaurant)

def delete_restaurant(db: Session, restaurant):
    db.delete(restaurant)
    db.commit()