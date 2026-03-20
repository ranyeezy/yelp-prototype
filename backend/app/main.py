from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .database import Base, engine
from . import models
from .routers import auth, users, owners, preferences, ai_assistant, reviews, favorites, restaurants

app = FastAPI(title="Yelp Prototype API")
uploads_path = Path(__file__).resolve().parents[1] / "uploads"
uploads_path.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_path)), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3006",
        "http://127.0.0.1:3006",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup():
    # Keeps backend minimal: auto-creates tables if missing
    Base.metadata.create_all(bind=engine)
    
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(owners.router)
app.include_router(preferences.router)
app.include_router(ai_assistant.router)
app.include_router(reviews.router)
app.include_router(favorites.router)
app.include_router(restaurants.router)

@app.get("/")
def health():
    return {"status": "ok"}