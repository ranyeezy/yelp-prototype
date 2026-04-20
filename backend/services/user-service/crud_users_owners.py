from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
import models
import schemas
from security import hash_password, verify_password

#users
def create_user(db: Session, payload: schemas.UserCreate) -> models.User:
    existing = get_user_by_email(db, payload.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email already exists",
        )

    user = models.User(
        name=payload.name,
        email=payload.email,
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def get_user_by_email(db: Session, email: str) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.email == email).first()

def authenticate_user(db: Session, email: str, password: str) -> Optional[models.User]:
    user = get_user_by_email(db, email)
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user

def update_user(db: Session, user: models.User, payload: schemas.UserUpdate) -> models.User:
    data = payload.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(user, key, value)
    db.commit()
    db.refresh(user)
    return user


#owner
def create_owner(db: Session, payload: schemas.OwnerCreate) -> models.Owner:
    existing = get_owner_by_email(db, payload.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An owner with this email already exists",
        )

    owner = models.Owner(
        name=payload.name,
        email=payload.email,
        password_hash=hash_password(payload.password),
        restaurant_location=payload.restaurant_location,
    )
    db.add(owner)
    db.commit()
    db.refresh(owner)
    return owner

def get_owner_by_email(db: Session, email: str) -> Optional[models.Owner]:
    return db.query(models.Owner).filter(models.Owner.email == email).first()

def authenticate_owner(db: Session, email: str, password: str) -> Optional[models.Owner]:
    owner = get_owner_by_email(db, email)
    if not owner:
        return None
    if not verify_password(password, owner.password_hash):
        return None
    return owner

def update_owner(db: Session, owner: models.Owner, payload: schemas.OwnerUpdate) -> models.Owner:
    data = payload.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(owner, key, value)
    db.commit()
    db.refresh(owner)
    return owner
