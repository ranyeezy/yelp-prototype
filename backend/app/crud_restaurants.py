from sqlalchemy.orm import Session
from sqlalchemy import or_
from fastapi import HTTPException, status
from . import models, schemas

def create_restaurant(db: Session, user_id: int, payload: schemas.RestaurantCreate):
    restaurant = models.Restaurant(
        **payload.model_dump(),
        listed_by_user_id=user_id
    )
    db.add(restaurant)
    db.commit()
    db.refresh(restaurant)
    return restaurant

def get_restaurant(db: Session, restaurant_id: int):
    restaurant = db.get(models.Restaurant, restaurant_id)
    if not restaurant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Restaurant not found"
        )
    return restaurant

def list_restaurants(
    db: Session,
    name: str | None = None,
    cuisine_type: str | None = None,
    keyword: str | None = None,
    city: str | None = None,
    zip_code: str | None = None,
):
    query = db.query(models.Restaurant)
    if name:
        query = query.filter(models.Restaurant.name.ilike(f"%{name}%"))
    if cuisine_type:
        query = query.filter(models.Restaurant.cuisine_type.ilike(f"%{cuisine_type}%"))
    if city:
        query = query.filter(models.Restaurant.city.ilike(f"%{city}%"))
    if zip_code:
        query = query.filter(models.Restaurant.zip.ilike(f"%{zip_code}%"))
    if keyword:
        query = query.filter(
            or_(
                models.Restaurant.name.ilike(f"%{keyword}%"),
                models.Restaurant.description.ilike(f"%{keyword}%"),
                models.Restaurant.amenities.ilike(f"%{keyword}%"),
                models.Restaurant.cuisine_type.ilike(f"%{keyword}%"),
            )
        )
    return query.order_by(models.Restaurant.id.desc()).all()

def update_restaurant(db: Session, restaurant, payload: schemas.RestaurantUpdate):
    data = payload.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(restaurant, k, v)
    db.commit()
    db.refresh(restaurant)
    return restaurant

def delete_restaurant(db: Session, restaurant):
    db.delete(restaurant)
    db.commit()