from bson import ObjectId
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import jwt
from jwt import InvalidTokenError
from database import db
from security import JWT_SECRET, JWT_ALGORITHM

# Auth dependencies
oauth2_user = OAuth2PasswordBearer(tokenUrl="/auth/users/login")
oauth2_owner = OAuth2PasswordBearer(tokenUrl="/auth/owners/login")

def _decode_token(token: str):
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except InvalidTokenError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token") from exc

def get_current_user(token: str = Depends(oauth2_user)):
    payload = _decode_token(token)
    token_role = payload.get("role")
    if token_role != "user":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid user token")
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")

    user = db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    user["id"] = user["_id"]
    return user

def get_current_owner(token: str = Depends(oauth2_owner)):
    payload = _decode_token(token)
    token_role = payload.get("role")
    if token_role != "owner":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid owner token")
    owner_id = payload.get("sub")
    if not owner_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")

    owner = db.owners.find_one({"_id": ObjectId(owner_id)})
    if not owner:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Owner not found")

    owner["id"] = owner["_id"]
    return owner
