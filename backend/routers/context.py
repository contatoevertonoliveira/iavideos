from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User
from deps import get_current_user

router = APIRouter(prefix="/api/v1", tags=["Context"])


@router.get("/me/context")
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
