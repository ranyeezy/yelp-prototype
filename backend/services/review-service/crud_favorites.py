from fastapi import HTTPException, status
from sqlalchemy.orm import Session

import models


def add_favorite(db: Session, user_id: int, restaurant_id: int):
    restaurant = db.get(models.Restaurant, restaurant_id)
    if not restaurant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Restaurant not found",
        )

    existing = (
        db.query(models.Favorite)
        .filter(
            models.Favorite.user_id == user_id,
            models.Favorite.restaurant_id == restaurant_id,
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Restaurant already in favorites",
        )

    favorite = models.Favorite(user_id=user_id, restaurant_id=restaurant_id)
    db.add(favorite)
    db.commit()
    db.refresh(favorite)
    return favorite


def list_my_favorites(db: Session, user_id: int):
    favorites = (
        db.query(models.Favorite)
        .filter(models.Favorite.user_id == user_id)
        .order_by(models.Favorite.created_at.desc())
        .all()
    )

    result = []
    for favorite in favorites:
        restaurant = db.get(models.Restaurant, favorite.restaurant_id)
        if restaurant is None:
            continue
        result.append(
            {
                "favorite_id": favorite.id,
                "favorited_at": favorite.created_at,
                "restaurant": restaurant,
            }
        )
    return result


def remove_favorite(db: Session, user_id: int, restaurant_id: int):
    favorite = (
        db.query(models.Favorite)
        .filter(
            models.Favorite.user_id == user_id,
            models.Favorite.restaurant_id == restaurant_id,
        )
        .first()
    )
    if not favorite:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Favorite not found",
        )

    db.delete(favorite)
    db.commit()
