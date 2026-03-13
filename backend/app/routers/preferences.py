from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..deps import get_db, get_current_user
from .. import schemas
from .. import crud_preferences as crud

router = APIRouter(prefix="/preferences", tags=["preferences"])

@router.get("/me", response_model=schemas.UserPreferencesOut)
def get_my_preferences(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    prefs = crud.get_user_preferences(db, current_user.id)
    if prefs is None:
        prefs = crud.upsert_user_preferences(db, current_user.id, schemas.UserPreferencesIn())
    return prefs

@router.put("/me", response_model=schemas.UserPreferencesOut)
def upsert_my_preferences(
    payload: schemas.UserPreferencesIn,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return crud.upsert_user_preferences(db, current_user.id, payload)