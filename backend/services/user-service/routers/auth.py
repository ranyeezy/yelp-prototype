from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from schemas import UserCreate, OwnerCreate, OwnerLogin, Token
from security import create_access_token
import crud_users_owners as crud

router = APIRouter(prefix="/auth", tags=["auth"])

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
    return {"access_token": token, "token_type": "bearer"}