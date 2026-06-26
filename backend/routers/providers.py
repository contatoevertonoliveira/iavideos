from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User, AIProvider
from schemas import (
    AIProviderOut, AIProviderCreate, AIProviderUpdate,
    ProviderStatusOut, DiscoverRequest,
)
from deps import require_user, require_superadmin

router = APIRouter(prefix="/api/v1", tags=["AI Providers"])


@router.get("/providers", response_model=list[AIProviderOut])
def list_providers(kind: str | None = None, user: User = Depends(require_user), db: Session = Depends(get_db)):
    query = db.query(AIProvider)
    if kind:
        query = query.filter(AIProvider.kind == kind)
    return query.all()


@router.post("/providers")
def create_provider(body: AIProviderCreate, user: User = Depends(require_superadmin), db: Session = Depends(get_db)):
    provider = AIProvider(
        name=body.name,
        kind=body.kind,
        enabled=body.enabled,
        api_base=body.api_base,
        api_key=body.api_key,
        meta=body.meta,
    )
    db.add(provider)
    db.commit()
    db.refresh(provider)
    return provider


@router.put("/providers/{provider_id}")
def update_provider(provider_id: int, body: AIProviderUpdate, user: User = Depends(require_superadmin), db: Session = Depends(get_db)):
    provider = db.query(AIProvider).filter(AIProvider.id == provider_id).first()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    if body.name is not None:
        provider.name = body.name
    if body.api_base is not None:
        provider.api_base = body.api_base
    if body.api_key is not None:
        provider.api_key = body.api_key
    if body.enabled is not None:
        provider.enabled = body.enabled
    if body.meta is not None:
        provider.meta = body.meta
    db.commit()
    db.refresh(provider)
    return provider


@router.patch("/providers/{provider_id}/toggle")
def toggle_provider(provider_id: int, user: User = Depends(require_superadmin), db: Session = Depends(get_db)):
    provider = db.query(AIProvider).filter(AIProvider.id == provider_id).first()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    provider.enabled = not provider.enabled
    db.commit()
    db.refresh(provider)
    return provider


@router.get("/providers/status")
def provider_statuses(user: User = Depends(require_user), db: Session = Depends(get_db)):
    providers = db.query(AIProvider).all()
    return [ProviderStatusOut(id=p.id, state="connected" if p.enabled else "disconnected") for p in providers]


@router.get("/ai/providers/health")
def ai_providers_health(user: User = Depends(require_user)):
    return {"providers": [{"id": 1, "status": "healthy", "latency_ms": 120}, {"id": 2, "status": "healthy", "latency_ms": 340}]}


@router.get("/ai/providers/quota")
def ai_providers_quota(user: User = Depends(require_user)):
    return {"providers": [{"id": 1, "remaining": 8500, "limit": 10000}, {"id": 2, "remaining": 200, "limit": 1000}]}


@router.post("/ai/providers/discover")
def discover_provider(body: DiscoverRequest, user: User = Depends(require_superadmin)):
    return {"provider": {"name": body.name or "Discovered", "base_url": body.base_url, "status": "connected"}}


@router.get("/ai/providers/routes")
def get_routes(user: User = Depends(require_user)):
    return {
        "text_gen": {"primary": ["openai"], "fallback": ["piapi"], "policy": "balanced"},
        "image_gen": {"primary": ["piapi"], "fallback": [], "policy": "lowest_latency"},
        "video_gen": {"primary": ["piapi-video"], "fallback": [], "policy": "lowest_cost"},
    }


@router.put("/ai/providers/routes")
def update_routes(body: dict, user: User = Depends(require_superadmin)):
    return body


@router.post("/ai/providers/task")
def ai_task(body: dict, user: User = Depends(require_user)):
    """Proxy for AI task execution - returns mock result."""
    return {
        "status": "completed",
        "result": {"text": "Conteúdo gerado pela IA", "model": body.get("model", "gpt-4o-mini")},
    }
