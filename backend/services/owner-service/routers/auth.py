from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from deps import get_db
from schemas import OwnerCreate, OwnerLogin, Token
from security import create_access_token
import crud_users_owners as crud

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/owners/signup", status_code=201)
def owner_signup(payload: OwnerCreate, db: Session = Depends(get_db)):
    owner = crud.create_owner(db, payload)
    return {"id": owner.id, "email": owner.email, "name": owner.name}

@router.post("/owners/login", response_model=Token)
def owner_login(payload: OwnerLogin, db: Session = Depends(get_db)):
    owner = crud.authenticate_owner(db, payload.email, payload.password)
    if not owner:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    token = create_access_token(subject=str(owner.id), role="owner")
    return {"access_token": token, "token_type": "bearer"}