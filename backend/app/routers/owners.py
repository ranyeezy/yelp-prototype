from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..deps import get_db, get_current_owner
from .. import schemas
from .. import crud_users_owners as crud
from .. import crud_owner_restaurants as owner_crud

router = APIRouter(prefix="/owners", tags=["owners"])

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