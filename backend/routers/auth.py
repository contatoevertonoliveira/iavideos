from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from auth import hash_password, verify_password, create_access_token, create_refresh_token
from models import User
from schemas import TokenResponse, UserOut, OkResponse
from deps import require_user, get_current_user

router = APIRouter(prefix="/api/v1/auth", tags=["Auth"])


@router.post("/login")
def login(email: str, password: str, remember: bool = True, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=401, detail="Credenciais inválidas")

    access = create_access_token({"sub": str(user.id), "role": user.role, "email": user.email})
    refresh = create_refresh_token({"sub": str(user.id)})

    return {
        "access": access,
        "refresh": refresh,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "picture": user.picture,
            "avatar_url": user.avatar_url,
        },
    }


@router.get("/me")
def me(user: User = Depends(require_user)):
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "picture": user.picture,
    }


@router.post("/google/exchange")
def google_exchange(code: str, db: Session = Depends(get_db)):
    """Mock Google OAuth exchange - creates/returns a user."""
    user = db.query(User).filter(User.email == "google@example.com").first()
    if not user:
        user = User(
            email="google@example.com",
            password_hash=hash_password("google-oauth-placeholder"),
            name="Usuário Google",
            role="user",
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    access = create_access_token({"sub": str(user.id), "role": user.role, "email": user.email})
    refresh = create_refresh_token({"sub": str(user.id)})

    return {
        "access_token": access,
        "refresh_token": refresh,
        "user": {"name": user.name, "picture": user.picture, "email": user.email},
    }
