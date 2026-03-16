from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from ..deps import get_db, get_current_user
from .. import schemas
from .. import crud_restaurants as crud

router = APIRouter(prefix="/restaurants", tags=["restaurants"])

@router.post("", response_model=schemas.RestaurantOut, status_code=201)
def create_restaurant(
    payload: schemas.RestaurantCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return crud.create_restaurant(db, current_user.id, payload)

@router.get("", response_model=list[schemas.RestaurantOut])
def list_restaurants(
    name: str | None = Query(default=None),
    cuisine_type: str | None = Query(default=None),
    keyword: str | None = Query(default=None),
    city: str | None = Query(default=None),
    zip: str | None = Query(default=None),
    db: Session = Depends(get_db),
):
    return crud.list_restaurants(
        db=db,
        name=name,
        cuisine_type=cuisine_type,
        keyword=keyword,
        city=city,
        zip=zip,
    )

@router.get("/{restaurant_id}", response_model=schemas.RestaurantOut)
def get_restaurant(
    restaurant_id: int,
    db: Session = Depends(get_db),
):
    return crud.get_restaurant(db, restaurant_id)

@router.put("/{restaurant_id}", response_model=schemas.RestaurantOut)
def update_restaurant(
    restaurant_id: int,
    payload: schemas.RestaurantUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    restaurant = crud.get_restaurant(db, restaurant_id)
    if restaurant.listed_by_user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own restaurant listings"
        )
    return crud.update_restaurant(db, restaurant, payload)

@router.delete("/{restaurant_id}", status_code=204)
def delete_restaurant(
    restaurant_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    restaurant = crud.get_restaurant(db, restaurant_id)

    if restaurant.listed_by_user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own restaurant listings"
        )
    crud.delete_restaurant(db, restaurant)