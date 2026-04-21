from pathlib import Path
import uuid
import logging

from fastapi import APIRouter, Depends, Query, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session

import crud_restaurants as crud
from schemas import RestaurantOut, RestaurantCreate, RestaurantUpdate, RestaurantPhotoUploadOut
from deps import get_db, get_current_user_or_owner
from kafka_producer_restaurant import publish_restaurant_created, publish_restaurant_updated

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/restaurants", tags=["restaurants"])
UPLOADS_DIR = Path(__file__).resolve().parents[0] / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)


@router.post("/uploads/photo", response_model=RestaurantPhotoUploadOut)
def upload_restaurant_photo(
    photo: UploadFile = File(...),
    current_user=Depends(get_current_user_or_owner),
):
    if not photo.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Photo filename is required")
    extension = Path(photo.filename).suffix.lower()
    if extension not in {".jpg", ".jpeg", ".png", ".webp", ".gif"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported file type")
    unique_name = f"restaurant_{current_user.id}_{uuid.uuid4().hex}{extension}"
    destination = UPLOADS_DIR / unique_name
    with destination.open("wb") as output_file:
        output_file.write(photo.file.read())
    return RestaurantPhotoUploadOut(photo_url=f"/uploads/{unique_name}")


@router.post("", status_code=202)
def create_restaurant(
    payload: RestaurantCreate,
    current_user=Depends(get_current_user_or_owner),
):
    publish_restaurant_created(
        owner_id=current_user.id,
        name=payload.name,
        cuisine_type=payload.cuisine_type,
        address=payload.address,
        city=payload.city,
        state=payload.state,
        zip=payload.zip,
        country=payload.country,
        description=payload.description,
        phone=payload.phone,
        price_tier=payload.price_tier,
        hours=payload.hours,
        amenities=payload.amenities,
        photo_url=payload.photo_url,
    )
    return {"status": "accepted", "message": "Restaurant is being processed"}


@router.get("", response_model=list[RestaurantOut])
def list_restaurants(
    name: str | None = Query(default=None),
    cuisine_type: str | None = Query(default=None),
    keyword: str | None = Query(default=None),
    city: str | None = Query(default=None),
    zip: str | None = Query(default=None),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    return crud.list_restaurants(
        db=db,
        name=name,
        cuisine_type=cuisine_type,
        keyword=keyword,
        city=city,
        zip=zip,
        skip=skip,
        limit=limit,
    )


@router.get("/{restaurant_id}", response_model=RestaurantOut)
def get_restaurant(
    restaurant_id: int,
    db: Session = Depends(get_db),
):
    restaurant = crud.get_restaurant(db, restaurant_id)
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    return restaurant


@router.put("/{restaurant_id}", response_model=RestaurantOut)
def update_restaurant(
    restaurant_id: int,
    payload: RestaurantUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user_or_owner),
):
    restaurant = crud.get_restaurant(db, restaurant_id)
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    if restaurant.listed_by_user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own restaurant",
        )
    
    restaurant = crud.update_restaurant(db, restaurant, payload)
    
    # Publish Kafka event
    try:
        publish_restaurant_updated(
            restaurant_id=restaurant.id,
            name=restaurant.name,
            cuisine_type=restaurant.cuisine_type,
            address=restaurant.address,
            city=restaurant.city
        )
    except Exception as e:
        logger.warning("Failed to publish restaurant.updated event: %s", e)
    
    return restaurant


@router.delete("/{restaurant_id}", status_code=204)
def delete_restaurant(
    restaurant_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user_or_owner),
):
    restaurant = crud.get_restaurant(db, restaurant_id)
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    if restaurant.listed_by_user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own restaurant",
        )
    crud.delete_restaurant(db, restaurant)