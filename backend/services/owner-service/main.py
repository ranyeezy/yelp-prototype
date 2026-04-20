from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# Import routers
from routers import owners, auth

app = FastAPI(title="Yelp Owner Service")

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploads
uploads_path = Path(__file__).resolve().parents[0] / "uploads"
uploads_path.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_path)), name="uploads")

# Database startup
from database import Base, engine

@app.on_event("startup")
def startup():
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        print(f"Warning: Could not create tables at startup: {e}")
        pass

# Include routers
app.include_router(owners.router)
app.include_router(auth.router)

@app.get("/")
def health():
    return {"status": "ok", "service": "owner-service"}