from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from ..deps import get_db
from .. import schemas
from ..security import create_access_token
from .. import crud_users_owners as crud

router = APIRouter(prefix="/auth", tags=["auth"])
#users
@router.post("/users/signup", response_model=schemas.UserOut, status_code=201)
def user_signup(payload: schemas.UserCreate, db: Session = Depends(get_db)):
    return crud.create_user(db, payload)

@router.post("/users/login", response_model=schemas.Token)
def user_login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = crud.authenticate_user(db, form.username, form.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    token = create_access_token(subject=str(user.id), role="user")
    return {"access_token": token, "token_type": "bearer"}

#owners
@router.post("/owners/signup", response_model=schemas.OwnerOut, status_code=201)
def owner_signup(payload: schemas.OwnerCreate, db: Session = Depends(get_db)):
    return crud.create_owner(db, payload)

@router.post("/owners/login", response_model=schemas.Token)
def owner_login(payload: schemas.OwnerLogin, db: Session = Depends(get_db)):
    owner = crud.authenticate_owner(db, payload.email, payload.password)
    if not owner:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    token = create_access_token(subject=str(owner.id), role="owner")
    return {"access_token": token, "token_type": "bearer"}