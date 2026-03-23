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
    state: Optional[str] = Field(default=None, max_length=2)
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
    restaurant_location: str = Field(min_length=1)

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


class OwnerClaimRestaurantOut(BaseModel):
    id: int
    owner_id: int
    restaurant_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class OwnerRestaurantSummaryOut(BaseModel):
    id: int
    name: str
    cuisine_type: str
    city: str
    avg_rating: Optional[float] = None
    review_count: int


class OwnerRecentReviewOut(BaseModel):
    review_id: int
    restaurant_id: int
    restaurant_name: str
    rating: int
    comment: Optional[str] = None
    created_at: datetime


class OwnerDashboardOut(BaseModel):
    claimed_restaurants: int
    total_reviews: int
    total_views: int = 0
    avg_rating: Optional[float] = None
    ratings_distribution: dict[str, int] = {}
    positive_reviews: int = 0
    neutral_reviews: int = 0
    negative_reviews: int = 0
    sentiment_summary: str = "Neutral"
    restaurants: list[OwnerRestaurantSummaryOut]
    recent_reviews: list[OwnerRecentReviewOut] = []


class OwnerRestaurantReviewOut(BaseModel):
    id: int
    user_id: int
    user_name: str
    restaurant_id: int
    rating: int
    comment: Optional[str] = None
    photo_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime
        
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

#restaunrant
class RestaurantCreate(BaseModel):
    name: str
    cuisine_type: str
    address: str
    city: str
    state: Optional[str] = None
    zip: Optional[str] = None
    country: Optional[str] = None
    description: Optional[str] = None
    phone: Optional[str] = None
    price_tier: Optional[int] = None
    hours: Optional[str] = None
    amenities: Optional[str] = None
    photo_url: Optional[str] = None

class RestaurantUpdate(BaseModel):
    name: Optional[str] = None
    cuisine_type: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip: Optional[str] = None
    country: Optional[str] = None
    description: Optional[str] = None
    phone: Optional[str] = None
    price_tier: Optional[int] = None
    hours: Optional[str] = None
    amenities: Optional[str] = None
    photo_url: Optional[str] = None

class RestaurantOut(BaseModel):
    id: int
    name: str
    cuisine_type: str
    address: str
    city: str
    state: Optional[str] = None
    zip: Optional[str] = None
    country: Optional[str] = None
    description: Optional[str] = None
    phone: Optional[str] = None
    price_tier: Optional[int] = None
    hours: Optional[str] = None
    amenities: Optional[str] = None
    photo_url: Optional[str] = None
    listed_by_user_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class RestaurantPhotoUploadOut(BaseModel):
    photo_url: str


# review
class ReviewCreate(BaseModel):
    restaurant_id: int
    rating: int = Field(ge=1, le=5)
    comment: Optional[str] = None
    photo_url: Optional[str] = None


class ReviewUpdate(BaseModel):
    rating: Optional[int] = Field(default=None, ge=1, le=5)
    comment: Optional[str] = None
    photo_url: Optional[str] = None


class ReviewOut(BaseModel):
    id: int
    user_id: int
    user_name: Optional[str] = None
    restaurant_id: int
    rating: int
    comment: Optional[str] = None
    photo_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserReviewHistoryOut(BaseModel):
    id: int
    user_name: Optional[str] = None
    restaurant_id: int
    restaurant_name: str
    restaurant_city: Optional[str] = None
    rating: int
    comment: Optional[str] = None
    photo_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class ReviewPhotoUploadOut(BaseModel):
    photo_url: str


# favorites
class FavoriteOut(BaseModel):
    id: int
    user_id: int
    restaurant_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class FavoriteRestaurantOut(BaseModel):
    favorite_id: int
    favorited_at: datetime
    restaurant: RestaurantOut


# Q11 - AI assistant chatbot
class ChatMessage(BaseModel):
    role: str
    content: str


class AIChatRequest(BaseModel):
    message: str = Field(min_length=1)
    conversation_history: list[ChatMessage] = Field(default_factory=list)


class RecommendedRestaurant(BaseModel):
    id: int
    name: str
    cuisine_type: str
    city: str
    rating: Optional[float] = None
    price_tier: Optional[int] = None
    score: float
    reason: str


class AIChatResponse(BaseModel):
    reply: str
    extracted_filters: dict
    recommendations: list[RecommendedRestaurant]
    web_context: list[dict] = []
        