from fastapi import APIRouter, Depends, status

import crud_favorites as crud
from schemas import FavoriteOut, FavoriteRestaurantOut
from deps import get_current_user

router = APIRouter(prefix="/favorites", tags=["favorites"])


@router.post("/{restaurant_id}", response_model=FavoriteOut, status_code=201)
def add_favorite(
	restaurant_id: str,
	current_user=Depends(get_current_user),
):
	user_id = str(current_user["id"])
	return crud.add_favorite(user_id, restaurant_id)


@router.get("/me", response_model=list[FavoriteRestaurantOut])
def list_my_favorites(
	current_user=Depends(get_current_user),
):
	user_id = str(current_user["id"])
	return crud.list_my_favorites(user_id)


@router.delete("/{restaurant_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_favorite(
	restaurant_id: str,
	current_user=Depends(get_current_user),
):
	user_id = str(current_user["id"])
	crud.remove_favorite(user_id, restaurant_id)