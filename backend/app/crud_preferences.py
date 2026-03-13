from sqlalchemy.orm import Session
from . import models, schemas

def get_user_preferences(db: Session, user_id: int) -> models.UserPreference | None:
    return db.get(models.UserPreference, user_id)

def upsert_user_preferences(db: Session, user_id: int, payload: schemas.UserPreferencesIn) -> models.UserPreference:
    prefs = db.get(models.UserPreference, user_id)

    data = payload.model_dump(exclude_unset=True)

    if prefs is None:
        prefs = models.UserPreference(user_id=user_id, **data)
        db.add(prefs)
    else:
        for k, v in data.items():
            setattr(prefs, k, v)

    db.commit()
    db.refresh(prefs)
    return prefs