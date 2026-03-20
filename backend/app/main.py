from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import Base, engine
from . import models
from .routers import auth, users, owners, preferences, ai_assistant

app = FastAPI(title="Yelp Prototype API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3006"],
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

@app.get("/")
def health():
    return {"status": "ok"}