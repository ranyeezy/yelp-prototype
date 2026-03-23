from pathlib import Path
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session
from ..deps import get_db, get_current_user
from .. import schemas
from .. import crud_users_owners as crud

router = APIRouter(prefix="/users", tags=["users"])

UPLOADS_DIR = Path(__file__).resolve().parents[2] / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

@router.get("/me", response_model=schemas.UserOut)
def get_me(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return current_user

@router.put("/me", response_model=schemas.UserOut)
def update_me(
    payload: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return crud.update_user(db, current_user, payload)


@router.post("/me/profile-photo", response_model=schemas.UserOut)
def upload_profile_photo(
    photo: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if not photo.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Photo filename is required")

    extension = Path(photo.filename).suffix.lower()
    if extension not in {".jpg", ".jpeg", ".png", ".webp", ".gif"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported file type")

    unique_name = f"user_{current_user.id}_{uuid.uuid4().hex}{extension}"
    destination = UPLOADS_DIR / unique_name
    with destination.open("wb") as output_file:
        output_file.write(photo.file.read())

    current_user.profile_photo = f"/uploads/{unique_name}"
    db.commit()
    db.refresh(current_user)
    return current_user