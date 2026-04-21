from fastapi import APIRouter, Depends
from deps import get_current_user
from schemas import UserPreferencesOut, UserPreferencesIn
import crud_preferences as crud

router = APIRouter(prefix="/preferences", tags=["preferences"])

@router.get("/me", response_model=UserPreferencesOut)
def get_my_preferences(current_user=Depends(get_current_user)):
    user_id = str(current_user["id"])
    prefs = crud.get_user_preferences(user_id)
    if prefs is None:
        prefs = crud.upsert_user_preferences(user_id, UserPreferencesIn())
    return prefs

@router.put("/me", response_model=UserPreferencesOut)
def upsert_my_preferences(
    payload: UserPreferencesIn,
    current_user=Depends(get_current_user),
):
    user_id = str(current_user["id"])
    return crud.upsert_user_preferences(user_id, payload)