from pathlib import Path
import uuid
from bson import ObjectId

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from deps import get_current_owner
from schemas import RestaurantPhotoUploadOut, OwnerOut, OwnerUpdate, OwnerRestaurantSummaryOut, OwnerClaimRestaurantOut, OwnerDashboardOut, RestaurantCreate, RestaurantOut, OwnerRestaurantReviewOut
from database import db
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

    unique_name = f"owner_restaurant_{current_owner['id']}_{uuid.uuid4().hex}{extension}"
    destination = UPLOADS_DIR / unique_name
    with destination.open("wb") as output_file:
        output_file.write(photo.file.read())

    return RestaurantPhotoUploadOut(photo_url=f"/uploads/{unique_name}")

@router.get("/claimed-restaurant-ids", response_model=list[str])
def get_all_claimed_restaurant_ids():
    """Return all restaurant IDs that have been claimed by any owner."""
    claims = db.owner_restaurants.find({}, {"restaurant_id": 1})
    return [str(claim["restaurant_id"]) for claim in claims]

@router.get("/me", response_model=OwnerOut)
def get_me(current_owner=Depends(get_current_owner)):
    return current_owner

@router.put("/me", response_model=OwnerOut)
def update_me(
    payload: OwnerUpdate,
    current_owner=Depends(get_current_owner),
):
    owner_id = str(current_owner["id"])
    return crud.update_owner(owner_id, payload)

@router.get("/restaurants/claimed", response_model=list[OwnerRestaurantSummaryOut])
def get_my_claimed_restaurants(
    current_owner=Depends(get_current_owner),
):
    owner_id = str(current_owner["id"])
    return owner_crud.list_claimed_restaurants(owner_id)

@router.post("/restaurants", response_model=RestaurantOut, status_code=202)
def create_owner_restaurant(
    payload: RestaurantCreate,
    current_owner=Depends(get_current_owner),
):
    owner_id = str(current_owner["id"])
    return owner_crud.create_owner_restaurant(owner_id, payload)

@router.get("/restaurants/{restaurant_id}", response_model=RestaurantOut)
def get_owned_restaurant(
    restaurant_id: str,
    current_owner=Depends(get_current_owner),
):
    owner_id = str(current_owner["id"])
    return owner_crud.get_claimed_restaurant(owner_id, restaurant_id)

@router.put("/restaurants/{restaurant_id}", response_model=RestaurantOut, status_code=202)
def update_owned_restaurant(
    restaurant_id: str,
    payload: RestaurantCreate,
    current_owner=Depends(get_current_owner),
):
    owner_id = str(current_owner["id"])
    return owner_crud.update_claimed_restaurant(owner_id, restaurant_id, payload)

@router.get("/restaurants/{restaurant_id}/reviews", response_model=list[OwnerRestaurantReviewOut])
def get_owned_restaurant_reviews(
    restaurant_id: str,
    current_owner=Depends(get_current_owner),
):
    owner_id = str(current_owner["id"])
    return owner_crud.list_claimed_restaurant_reviews(owner_id, restaurant_id)

@router.post("/restaurants/{restaurant_id}/claim", response_model=OwnerClaimRestaurantOut)
def claim_restaurant(
    restaurant_id: str,
    current_owner=Depends(get_current_owner),
):
    owner_id = str(current_owner["id"])
    return owner_crud.claim_restaurant(owner_id, restaurant_id)

@router.delete("/restaurants/{restaurant_id}/unclaim", status_code=204)
def unclaim_restaurant(
    restaurant_id: str,
    current_owner=Depends(get_current_owner),
):
    owner_id = str(current_owner["id"])
    owner_crud.unclaim_restaurant(owner_id, restaurant_id)

@router.get("/dashboard", response_model=OwnerDashboardOut)
def get_dashboard(
    current_owner=Depends(get_current_owner),
):
    owner_id = str(current_owner["id"])
    return owner_crud.get_owner_dashboard(owner_id)