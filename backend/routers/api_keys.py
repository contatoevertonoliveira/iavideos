from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User, ApiKey
from schemas import OkResponse
from deps import require_user
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone

router = APIRouter(prefix="/api/v1/settings/api-keys", tags=["API Keys"])


class ApiKeyOut(BaseModel):
    id: int
    provider: str
    api_base: Optional[str] = None
    label: Optional[str] = None
    is_active: bool
    is_default: bool = False
    created_at: Optional[str] = None
    # NEVER expose the full key - only mask
    key_preview: str = ""

    class Config:
        from_attributes = True


class ApiKeyCreate(BaseModel):
    provider: str
    api_key: str
    api_base: Optional[str] = None
    label: Optional[str] = None
    is_default: bool = False


class ApiKeyUpdate(BaseModel):
    api_key: Optional[str] = None
    api_base: Optional[str] = None
    label: Optional[str] = None
    is_active: Optional[bool] = None
    is_default: Optional[bool] = None


def mask_key(key: str) -> str:
    if len(key) <= 8:
        return "****"
    return key[:4] + "****" + key[-4:]


def ensure_single_default(db: Session, user_id: int, exclude_id: int = None):
    """Ensure only one API key is marked as default for this user."""
    default_keys = db.query(ApiKey).filter(
        ApiKey.user_id == user_id,
        ApiKey.is_default == True,
    )
    if exclude_id:
        default_keys = default_keys.filter(ApiKey.id != exclude_id)
    for k in default_keys:
        k.is_default = False


@router.get("")
def list_api_keys(user: User = Depends(require_user), db: Session = Depends(get_db)):
    keys = db.query(ApiKey).filter(ApiKey.user_id == user.id).all()
    return [
        ApiKeyOut(
            id=k.id,
            provider=k.provider,
            api_base=k.api_base,
            label=k.label,
            is_active=k.is_active,
            is_default=k.is_default,
            created_at=k.created_at.isoformat() if k.created_at else None,
            key_preview=mask_key(k.api_key),
        )
        for k in keys
    ]


@router.get("/default")
def get_default_key(user: User = Depends(require_user), db: Session = Depends(get_db)):
    """Retorna a chave default ativa, ou Google se disponível, ou None."""
    default = db.query(ApiKey).filter(
        ApiKey.user_id == user.id,
        ApiKey.is_default == True,
        ApiKey.is_active == True,
    ).first()
    if not default:
        # Fallback: Google ativa como default
        default = db.query(ApiKey).filter(
            ApiKey.user_id == user.id,
            ApiKey.provider.in_(["google", "gemini"]),
            ApiKey.is_active == True,
        ).first()
    if not default:
        # Qualquer chave ativa
        default = db.query(ApiKey).filter(
            ApiKey.user_id == user.id,
            ApiKey.is_active == True,
        ).first()
    if not default:
        return {"has_default": False, "provider": None, "id": None}
    return {
        "has_default": True,
        "provider": default.provider,
        "id": default.id,
        "key_preview": mask_key(default.api_key),
        "is_active": default.is_active,
    }


@router.post("")
def create_api_key(body: ApiKeyCreate, user: User = Depends(require_user), db: Session = Depends(get_db)):
    existing = db.query(ApiKey).filter(
        ApiKey.user_id == user.id,
        ApiKey.provider == body.provider,
    ).first()
    is_default = body.is_default
    if is_default:
        ensure_single_default(db, user.id)
    else:
        # Se não tem nenhuma default ainda, esta vira default
        has_any = db.query(ApiKey).filter(ApiKey.user_id == user.id, ApiKey.is_default == True).count()
        if has_any == 0:
            is_default = True

    if existing:
        existing.api_key = body.api_key
        if body.api_base is not None:
            existing.api_base = body.api_base
        if body.label is not None:
            existing.label = body.label
        if is_default:
            existing.is_default = True
        existing.updated_at = datetime.now(timezone.utc)
        existing.is_active = True
        db.commit()
        db.refresh(existing)
        return ApiKeyOut(
            id=existing.id, provider=existing.provider,
            api_base=existing.api_base, label=existing.label,
            is_active=existing.is_active, is_default=existing.is_default,
            created_at=existing.created_at.isoformat() if existing.created_at else None,
            key_preview=mask_key(existing.api_key),
        )
    
    key = ApiKey(
        user_id=user.id, provider=body.provider,
        api_key=body.api_key, api_base=body.api_base,
        label=body.label, is_active=True, is_default=is_default,
    )
    db.add(key)
    db.commit()
    db.refresh(key)
    return ApiKeyOut(
        id=key.id, provider=key.provider,
        api_base=key.api_base, label=key.label,
        is_active=key.is_active, is_default=key.is_default,
        created_at=key.created_at.isoformat() if key.created_at else None,
        key_preview=mask_key(key.api_key),
    )


@router.put("/{key_id}")
def update_api_key(key_id: int, body: ApiKeyUpdate, user: User = Depends(require_user), db: Session = Depends(get_db)):
    key = db.query(ApiKey).filter(ApiKey.id == key_id, ApiKey.user_id == user.id).first()
    if not key:
        raise HTTPException(status_code=404, detail="API Key not found")
    if body.api_key is not None:
        key.api_key = body.api_key
    if body.api_base is not None:
        key.api_base = body.api_base
    if body.label is not None:
        key.label = body.label
    if body.is_active is not None:
        key.is_active = body.is_active
    if body.is_default is not None and body.is_default:
        ensure_single_default(db, user.id, key_id)
        key.is_default = True
    key.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(key)
    return ApiKeyOut(
        id=key.id, provider=key.provider,
        api_base=key.api_base, label=key.label,
        is_active=key.is_active, is_default=key.is_default,
        created_at=key.created_at.isoformat() if key.created_at else None,
        key_preview=mask_key(key.api_key),
    )


@router.post("/{key_id}/set-default")
def set_default_key(key_id: int, user: User = Depends(require_user), db: Session = Depends(get_db)):
    """Define esta chave como default (e remove das outras)."""
    key = db.query(ApiKey).filter(ApiKey.id == key_id, ApiKey.user_id == user.id).first()
    if not key:
        raise HTTPException(status_code=404, detail="API Key not found")
    ensure_single_default(db, user.id, key_id)
    key.is_default = True
    key.updated_at = datetime.now(timezone.utc)
    db.commit()
    return {"ok": True, "provider": key.provider, "is_default": True}


@router.delete("/{key_id}")
def delete_api_key(key_id: int, user: User = Depends(require_user), db: Session = Depends(get_db)):
    key = db.query(ApiKey).filter(ApiKey.id == key_id, ApiKey.user_id == user.id).first()
    if not key:
        raise HTTPException(status_code=404, detail="API Key not found")
    db.delete(key)
    db.commit()
    return {"ok": True}


@router.post("/test/{provider}")
def test_api_key(provider: str, user: User = Depends(require_user), db: Session = Depends(get_db)):
    """Test if an API key for the given provider is configured and active."""
    key = db.query(ApiKey).filter(
        ApiKey.user_id == user.id,
        ApiKey.provider == provider,
        ApiKey.is_active == True,
    ).first()
    if not key:
        raise HTTPException(status_code=404, detail=f"No active API key found for {provider}")
    return {
        "provider": provider,
        "configured": True,
        "active": True,
        "key_preview": mask_key(key.api_key),
    }
