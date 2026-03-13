from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

#auth
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

#users
class UserCreate(BaseModel):
    name: str = Field(min_length=1)
    email: EmailStr
    password: str = Field(min_length=1)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(default=None)
    about_me: Optional[str] = Field(default=None)
    city: Optional[str] = Field(default=None)
    state: Optional[str] = Field(default=None)
    country: Optional[str] = Field(default=None)
    languages: Optional[str] = Field(default=None)
    gender: Optional[str] = Field(default=None)
    profile_photo: Optional[str] = Field(default=None)

class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    phone: Optional[str] = None
    about_me: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    languages: Optional[str] = None
    gender: Optional[str] = None
    profile_photo: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

#owner
class OwnerCreate(BaseModel):
    name: str = Field(min_length=1)
    email: EmailStr
    password: str = Field(min_length=1)
    restaurant_location: Optional[str] = Field(default=None)

class OwnerLogin(BaseModel):
    email: EmailStr
    password: str

class OwnerUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1)
    email: Optional[EmailStr] = None
    restaurant_location: Optional[str] = Field(default=None)

class OwnerOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    restaurant_location: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        
#user preferences
class UserPreferencesIn(BaseModel):
    cuisines: Optional[str] = None
    price_min: Optional[int] = Field(default=None, ge=1, le=4)
    price_max: Optional[int] = Field(default=None, ge=1, le=4)
    preferred_locations: Optional[str] = None
    search_radius: Optional[int] = None
    dietary_needs: Optional[str] = None
    ambiance: Optional[str] = None
    sort_preference: Optional[str] = None

class UserPreferencesOut(BaseModel):
    user_id: int
    cuisines: Optional[str] = None
    price_min: Optional[int] = Field(default=None, ge=1, le=4)
    price_max: Optional[int] = Field(default=None, ge=1, le=4)
    preferred_locations: Optional[str] = None
    search_radius: Optional[int] = None
    dietary_needs: Optional[str] = None
    ambiance: Optional[str] = None
    sort_preference: Optional[str] = None
    updated_at: datetime

    class Config:
        from_attributes = True