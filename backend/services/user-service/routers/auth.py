from datetime import datetime, timedelta
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from schemas import UserCreate, OwnerCreate, OwnerLogin, Token
from security import create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
from database import db
import crud_users_owners as crud

router = APIRouter(prefix="/auth", tags=["auth"])


def _create_session(user_id: str, role: str, token: str):
    expires_at = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    db.sessions.insert_one({
        "user_id": ObjectId(user_id),
        "role": role,
        "token": token,
        "created_at": datetime.utcnow(),
        "expires_at": expires_at,
    })


# Users
@router.post("/users/signup", status_code=201)
def user_signup(payload: UserCreate):
    user = crud.create_user(payload)
    return {"id": str(user["id"]), "email": user["email"], "name": user["name"]}

@router.post("/users/login", response_model=Token)
def user_login(form: OAuth2PasswordRequestForm = Depends()):
    user = crud.authenticate_user(form.username, form.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    token = create_access_token(subject=str(user["id"]), role="user")
    _create_session(str(user["id"]), "user", token)
    return {"access_token": token, "token_type": "bearer"}

# Owners
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
    _create_session(str(owner["id"]), "owner", token)
    return {"access_token": token, "token_type": "bearer"}