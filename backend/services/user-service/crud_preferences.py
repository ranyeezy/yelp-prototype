from datetime import datetime
from bson import ObjectId
from database import db
import schemas

def get_user_preferences(user_id: str):
    """Get user preferences by user_id"""
    prefs = db.user_preferences.find_one({"user_id": ObjectId(user_id)})
    if prefs:
        prefs["id"] = prefs["_id"]
    return prefs

def upsert_user_preferences(user_id: str, payload: schemas.UserPreferencesIn):
    """Create or update user preferences"""
    prefs = get_user_preferences(user_id)
    data = payload.model_dump(exclude_unset=True)
    data["updated_at"] = datetime.utcnow()
    
    if prefs is None:
        # Create new
        prefs_doc = {
            "user_id": ObjectId(user_id),
            "created_at": datetime.utcnow(),
            **data
        }
        result = db.user_preferences.insert_one(prefs_doc)
        prefs_doc["id"] = result.inserted_id
        return prefs_doc
    else:
        # Update existing
        db.user_preferences.update_one(
            {"_id": ObjectId(prefs["id"])},
            {"$set": data}
        )
        prefs = db.user_preferences.find_one({"_id": ObjectId(prefs["id"])})
        prefs["id"] = prefs["_id"]
        return prefs