from pathlib import Path
import uuid

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from deps import get_db, get_current_owner
from schemas import RestaurantPhotoUploadOut, OwnerOut, OwnerUpdate
import models
import crud_users_owners as crud
import crud_owner_restaurants as owner_crud

router = APIRouter(prefix="/owners", tags=["owners"])
UPLOADS_DIR = Path(__file__).resolve().parents[0] / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)


@router.post("/uploads/photo", response_model=RestaurantPhotoUploadOut)
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

    return RestaurantPhotoUploadOut(photo_url=f"/uploads/{unique_name}")

@router.get("/claimed-restaurant-ids", response_model=list[int])
def get_all_claimed_restaurant_ids(db: Session = Depends(get_db)):
    """Return all restaurant IDs that have been claimed by any owner."""
    rows = db.query(models.OwnerRestaurant.restaurant_id).distinct().all()
    return [row[0] for row in rows]

@router.get("/me", response_model=OwnerOut)
def get_me(current_owner=Depends(get_current_owner)):
    return current_owner

@router.put("/me", response_model=OwnerOut)
def update_me(
    payload: OwnerUpdate,
    db: Session = Depends(get_db),
    current_owner=Depends(get_current_owner),
):
    return crud.update_owner(db, current_owner, payload)

@router.get("/restaurants/claimed", response_model=list)
def get_my_claimed_restaurants(
    db: Session = Depends(get_db),
    current_owner=Depends(get_current_owner),
):
    return owner_crud.list_claimed_restaurants(db, current_owner.id)

@router.post("/restaurants/{restaurant_id}/claim")
def claim_restaurant(
    restaurant_id: int,
    db: Session = Depends(get_db),
    current_owner=Depends(get_current_owner),
):
    return owner_crud.claim_restaurant(db, current_owner.id, restaurant_id)

@router.delete("/restaurants/{restaurant_id}/unclaim", status_code=204)
def unclaim_restaurant(
    restaurant_id: int,
    db: Session = Depends(get_db),
    current_owner=Depends(get_current_owner),
):
    owner_crud.unclaim_restaurant(db, current_owner.id, restaurant_id)

@router.get("/dashboard")
def get_dashboard(
    db: Session = Depends(get_db),
    current_owner=Depends(get_current_owner),
):
    return owner_crud.get_owner_dashboard(db, current_owner.id)