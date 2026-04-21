from pathlib import Path
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from deps import get_current_user
from schemas import UserOut, UserUpdate
from database import db
import crud_users_owners as crud

router = APIRouter(prefix="/users", tags=["users"])

UPLOADS_DIR = Path(__file__).resolve().parents[0] / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

@router.get("/me", response_model=UserOut)
def get_me(current_user=Depends(get_current_user)):
    return current_user

@router.put("/me", response_model=UserOut)
def update_me(
    payload: UserUpdate,
    current_user=Depends(get_current_user),
):
    user_id = str(current_user["id"])
    return crud.update_user(user_id, payload)


@router.post("/me/profile-photo", response_model=UserOut)
def upload_profile_photo(
    photo: UploadFile = File(...),
    current_user=Depends(get_current_user),
):
    if not photo.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Photo filename is required")

    extension = Path(photo.filename).suffix.lower()
    if extension not in {".jpg", ".jpeg", ".png", ".webp", ".gif"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported file type")

    unique_name = f"user_{current_user['id']}_{uuid.uuid4().hex}{extension}"
    destination = UPLOADS_DIR / unique_name
    with destination.open("wb") as output_file:
        output_file.write(photo.file.read())

    user_id = str(current_user["id"])
    updated = crud.update_user(user_id, UserUpdate(profile_photo=f"/uploads/{unique_name}"))
    return updated