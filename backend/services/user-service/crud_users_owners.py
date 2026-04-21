from typing import Optional
from datetime import datetime
from bson import ObjectId
from fastapi import HTTPException, status
from database import db
import schemas
from security import hash_password, verify_password

# ===== USERS =====

def create_user(payload: schemas.UserCreate):
    """Create a new user"""
    existing = get_user_by_email(payload.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email already exists",
        )

    user_doc = {
        "name": payload.name,
        "email": payload.email,
        "password_hash": hash_password(payload.password),
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "phone": None,
        "about_me": None,
        "city": None,
        "state": None,
        "country": None,
        "languages": None,
        "gender": None,
        "profile_photo": None,
    }
    
    result = db.users.insert_one(user_doc)
    user_doc["id"] = result.inserted_id
    return user_doc

def get_user_by_email(email: str):
    """Get user by email"""
    user = db.users.find_one({"email": email})
    if user:
        user["id"] = user["_id"]
    return user

def get_user_by_id(user_id: str):
    """Get user by ID"""
    user = db.users.find_one({"_id": ObjectId(user_id)})
    if user:
        user["id"] = user["_id"]
    return user

def authenticate_user(email: str, password: str):
    """Authenticate user with email and password"""
    user = get_user_by_email(email)
    if not user:
        return None
    if not verify_password(password, user["password_hash"]):
        return None
    return user

def update_user(user_id: str, payload: schemas.UserUpdate):
    """Update user"""
    data = payload.model_dump(exclude_unset=True)
    data["updated_at"] = datetime.utcnow()
    
    result = db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user = db.users.find_one({"_id": ObjectId(user_id)})
    user["id"] = user["_id"]
    return user

# ===== OWNERS =====

def create_owner(payload: schemas.OwnerCreate):
    """Create a new owner"""
    existing = get_owner_by_email(payload.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An owner with this email already exists",
        )

    owner_doc = {
        "name": payload.name,
        "email": payload.email,
        "password_hash": hash_password(payload.password),
        "restaurant_location": payload.restaurant_location,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "phone": None,
        "about_me": None,
        "city": None,
        "state": None,
        "country": None,
        "languages": None,
        "gender": None,
        "profile_photo": None,
    }
    
    result = db.owners.insert_one(owner_doc)
    owner_doc["id"] = result.inserted_id
    return owner_doc

def get_owner_by_email(email: str):
    """Get owner by email"""
    owner = db.owners.find_one({"email": email})
    if owner:
        owner["id"] = owner["_id"]
    return owner

def get_owner_by_id(owner_id: str):
    """Get owner by ID"""
    owner = db.owners.find_one({"_id": ObjectId(owner_id)})
    if owner:
        owner["id"] = owner["_id"]
    return owner

def authenticate_owner(email: str, password: str):
    """Authenticate owner with email and password"""
    owner = get_owner_by_email(email)
    if not owner:
        return None
    if not verify_password(password, owner["password_hash"]):
        return None
    return owner

def update_owner(owner_id: str, payload: schemas.OwnerUpdate):
    """Update owner"""
    data = payload.model_dump(exclude_unset=True)
    data["updated_at"] = datetime.utcnow()
    
    result = db.owners.update_one(
        {"_id": ObjectId(owner_id)},
        {"$set": data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Owner not found"
        )
    
    owner = db.owners.find_one({"_id": ObjectId(owner_id)})
    owner["id"] = owner["_id"]
    return owner