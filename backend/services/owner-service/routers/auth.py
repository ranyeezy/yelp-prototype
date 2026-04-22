from datetime import datetime, timedelta
from bson import ObjectId
from fastapi import APIRouter, HTTPException, status
from schemas import OwnerCreate, OwnerLogin, Token
from security import create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
from database import db
import crud_users_owners as crud

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/owners/signup", status_code=201)
def owner_signup(payload: OwnerCreate):
    owner = crud.create_owner(payload)
    return {"id": str(owner["id"]), "email": owner["email"], "name": owner["name"]}

@router.post("/owners/login", response_model=Token)
def owner_login(payload: OwnerLogin):
    owner = crud.authenticate_owner(payload.email, payload.password)
    if not owner:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    token = create_access_token(subject=str(owner["id"]), role="owner")
    db.sessions.insert_one({
        "user_id": ObjectId(str(owner["id"])),
        "role": "owner",
        "token": token,
        "created_at": datetime.utcnow(),
        "expires_at": datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    })
    return {"access_token": token, "token_type": "bearer"}