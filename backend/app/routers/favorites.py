from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from .. import crud_favorites as crud
from .. import schemas
from ..deps import get_current_user, get_db

router = APIRouter(prefix="/favorites", tags=["favorites"])


@router.post("/{restaurant_id}", response_model=schemas.FavoriteOut, status_code=201)
def add_favorite(
	restaurant_id: int,
	db: Session = Depends(get_db),
	current_user=Depends(get_current_user),
):
	return crud.add_favorite(db, current_user.id, restaurant_id)


@router.get("/me", response_model=list[schemas.FavoriteRestaurantOut])
def list_my_favorites(
	db: Session = Depends(get_db),
	current_user=Depends(get_current_user),
):
	return crud.list_my_favorites(db, current_user.id)


@router.delete("/{restaurant_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_favorite(
	restaurant_id: int,
	db: Session = Depends(get_db),
	current_user=Depends(get_current_user),
):
	crud.remove_favorite(db, current_user.id, restaurant_id)
