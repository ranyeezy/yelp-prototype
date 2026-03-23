from typing import Generator
from sqlalchemy.orm import Session
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import jwt
from jwt import InvalidTokenError
from .database import SessionLocal
from .security import JWT_SECRET, JWT_ALGORITHM
from . import models

#db session dependency
def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        
#auth dependencies
oauth2_user = OAuth2PasswordBearer(tokenUrl="/auth/users/login")
oauth2_owner = OAuth2PasswordBearer(tokenUrl="/auth/owners/login")

def _decode_token(token: str):    
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except InvalidTokenError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token") from exc

def get_current_user(token: str = Depends(oauth2_user), db: Session = Depends(get_db)):
    payload = _decode_token(token)
    token_role = payload.get("role")
    if token_role != "user":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid user token")
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
    user = db.get(models.User, int(user_id))
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user

def get_current_owner(token: str = Depends(oauth2_owner), db: Session = Depends(get_db)):
    payload = _decode_token(token)
    token_role = payload.get("role")
    if token_role != "owner":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid owner token")
    owner_id = payload.get("sub")
    if not owner_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
    owner = db.get(models.Owner, int(owner_id))
    if not owner:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Owner not found")
    return owner