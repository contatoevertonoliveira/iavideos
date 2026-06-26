import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from contextlib import asynccontextmanager

from database import engine, get_db, Base
from models import User
from seed import seed_all
from deps import get_current_user
from routers import (
    auth, accounts, channels, analytics, calendar, composer,
    assistant, providers, settings, admin, publications, sse,
    context, api_keys, projects, series, scheduled_posts,
    content_plans, viral_templates, google_gemini,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    Base.metadata.create_all(bind=engine)
    db = next(get_db())
    try:
        seed_all(db)
        print("✅ Database seeded with initial data")
    except Exception as e:
        print(f"⚠️ Seed warning: {e}")
    finally:
        db.close()
    yield
    # Shutdown
    print("Server shutting down")


app = FastAPI(
    title="NeuralCineFlow API",
    description="Backend API for NeuralCineFlow - Video Automation Platform",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS - allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5180", "http://127.0.0.1:5173", "http://127.0.0.1:5175"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router)
app.include_router(accounts.router)
app.include_router(channels.router)
app.include_router(analytics.router)
app.include_router(calendar.router)
app.include_router(composer.router)
app.include_router(assistant.router)
app.include_router(providers.router)
app.include_router(settings.router)
app.include_router(admin.router)
app.include_router(publications.router)
app.include_router(sse.router)
app.include_router(context.router)
app.include_router(api_keys.router)
app.include_router(projects.router)
app.include_router(series.router)
app.include_router(scheduled_posts.router)
app.include_router(content_plans.router)
app.include_router(viral_templates.router)
app.include_router(google_gemini.router)

# Serve frontend static files
from fastapi.staticfiles import StaticFiles
frontend_dir = os.path.join(os.path.dirname(__file__), "frontend")
if os.path.isdir(frontend_dir):
    app.mount("/app", StaticFiles(directory=frontend_dir, html=True), name="frontend")
    print(f"✅ Frontend mounted at /app from {frontend_dir}")


# ─── Context endpoint ────────────────────────────────────────────────────────
@app.get("/me/context")
def me_context(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "picture": user.picture,
    }


@app.get("/")
def root():
    return {"name": "NeuralCineFlow API", "version": "1.0.0", "status": "running"}
