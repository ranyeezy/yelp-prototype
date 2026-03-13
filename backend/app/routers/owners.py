from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..deps import get_db, get_current_owner
from .. import schemas
from .. import crud_users_owners as crud

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