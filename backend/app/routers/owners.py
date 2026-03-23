from pathlib import Path
import uuid

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from ..deps import get_db, get_current_owner
from .. import schemas
from .. import models
from .. import crud_users_owners as crud
from .. import crud_owner_restaurants as owner_crud

router = APIRouter(prefix="/owners", tags=["owners"])
UPLOADS_DIR = Path(__file__).resolve().parents[2] / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)


@router.post("/uploads/photo", response_model=schemas.RestaurantPhotoUploadOut)
def upload_owner_restaurant_photo(
    photo: UploadFile = File(...),
    current_owner=Depends(get_current_owner),
):
    if not photo.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Photo filename is required")

    extension = Path(photo.filename).suffix.lower()
    if extension not in {".jpg", ".jpeg", ".png", ".webp", ".gif"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported file type")

    unique_name = f"owner_restaurant_{current_owner.id}_{uuid.uuid4().hex}{extension}"
    destination = UPLOADS_DIR / unique_name
    with destination.open("wb") as output_file:
        output_file.write(photo.file.read())

    return schemas.RestaurantPhotoUploadOut(photo_url=f"/uploads/{unique_name}")

@router.get("/claimed-restaurant-ids", response_model=list[int])
def get_all_claimed_restaurant_ids(db: Session = Depends(get_db)):
    """Return all restaurant IDs that have been claimed by any owner."""
    rows = db.query(models.OwnerRestaurant.restaurant_id).distinct().all()
    return [row[0] for row in rows]

@router.get("/me", response_model=schemas.OwnerOut)
def get_me(current_owner=Depends(get_current_owner)):
    return current_owner

@router.put("/me", response_model=schemas.OwnerOut)
def update_me(
    payload: schemas.OwnerUpdate,
    db: Session = Depends(get_db),
    current_owner=Depends(get_current_owner),
):
    return crud.update_owner(db, current_owner, payload)


@router.post("/restaurants/{restaurant_id}/claim", response_model=schemas.OwnerClaimRestaurantOut, status_code=201)
def claim_restaurant(
    restaurant_id: int,
    db: Session = Depends(get_db),
    current_owner=Depends(get_current_owner),
):
    return owner_crud.claim_restaurant(db, current_owner.id, restaurant_id)


@router.post("/restaurants", response_model=schemas.RestaurantOut, status_code=201)
def create_owner_restaurant(
    payload: schemas.RestaurantCreate,
    db: Session = Depends(get_db),
    current_owner=Depends(get_current_owner),
):
    return owner_crud.create_owner_restaurant(db, current_owner.id, payload)


@router.get("/restaurants", response_model=list[schemas.OwnerRestaurantSummaryOut])
def list_my_restaurants(
    db: Session = Depends(get_db),
    current_owner=Depends(get_current_owner),
):
    return owner_crud.list_claimed_restaurants(db, current_owner.id)


@router.get("/restaurants/{restaurant_id}", response_model=schemas.RestaurantOut)
def get_claimed_restaurant(
    restaurant_id: int,
    db: Session = Depends(get_db),
    current_owner=Depends(get_current_owner),
):
    return owner_crud.get_claimed_restaurant(db, current_owner.id, restaurant_id)


@router.put("/restaurants/{restaurant_id}", response_model=schemas.RestaurantOut)
def update_claimed_restaurant(
    restaurant_id: int,
    payload: schemas.RestaurantUpdate,
    db: Session = Depends(get_db),
    current_owner=Depends(get_current_owner),
):
    return owner_crud.update_claimed_restaurant(db, current_owner.id, restaurant_id, payload)


@router.get("/restaurants/{restaurant_id}/reviews", response_model=list[schemas.OwnerRestaurantReviewOut])
def list_claimed_restaurant_reviews(
    restaurant_id: int,
    db: Session = Depends(get_db),
    current_owner=Depends(get_current_owner),
):
    return owner_crud.list_claimed_restaurant_reviews(db, current_owner.id, restaurant_id)


@router.get("/dashboard", response_model=schemas.OwnerDashboardOut)
def owner_dashboard(
    db: Session = Depends(get_db),
    current_owner=Depends(get_current_owner),
):
    return owner_crud.get_owner_dashboard(db, current_owner.id)