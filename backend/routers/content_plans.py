from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User, ContentPlan
from deps import require_user
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

router = APIRouter(prefix="/api/v1/content-plans", tags=["Content Plans"])


class PlanOut(BaseModel):
    id: int
    title: str
    day_of_week: Optional[int] = None
    subject: Optional[str] = None
    keywords: Optional[list] = None
    style: Optional[str] = None
    platform: Optional[str] = None
    is_active: bool = True
    created_at: Optional[str] = None

    class Config:
        from_attributes = True


class PlanCreate(BaseModel):
    title: str
    day_of_week: Optional[int] = None
    subject: Optional[str] = None
    keywords: Optional[list] = None
    style: Optional[str] = "story"
    platform: Optional[str] = None


class PlanUpdate(BaseModel):
    title: Optional[str] = None
    day_of_week: Optional[int] = None
    subject: Optional[str] = None
    keywords: Optional[list] = None
    style: Optional[str] = None
    platform: Optional[str] = None
    is_active: Optional[bool] = None


@router.get("")
def list_plans(user: User = Depends(require_user), db: Session = Depends(get_db)):
    items = db.query(ContentPlan).filter(ContentPlan.user_id == user.id).order_by(ContentPlan.day_of_week).all()
    return [PlanOut(
        id=p.id, title=p.title, day_of_week=p.day_of_week,
        subject=p.subject, keywords=p.keywords,
        style=p.style, platform=p.platform,
        is_active=p.is_active,
        created_at=p.created_at.isoformat() if p.created_at else None,
    ) for p in items]


@router.post("")
def create_plan(body: PlanCreate, user: User = Depends(require_user), db: Session = Depends(get_db)):
    plan = ContentPlan(
        user_id=user.id, title=body.title, day_of_week=body.day_of_week,
        subject=body.subject, keywords=body.keywords,
        style=body.style, platform=body.platform,
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return PlanOut(
        id=plan.id, title=plan.title, day_of_week=plan.day_of_week,
        subject=plan.subject, keywords=plan.keywords,
        style=plan.style, platform=plan.platform,
        is_active=plan.is_active,
        created_at=plan.created_at.isoformat() if plan.created_at else None,
    )


@router.put("/{plan_id}")
def update_plan(plan_id: int, body: PlanUpdate, user: User = Depends(require_user), db: Session = Depends(get_db)):
    p = db.query(ContentPlan).filter(ContentPlan.id == plan_id, ContentPlan.user_id == user.id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Plan not found")
    for field in ["title", "day_of_week", "subject", "keywords", "style", "platform", "is_active"]:
        val = getattr(body, field, None)
        if val is not None:
            setattr(p, field, val)
    db.commit()
    return {"ok": True}


@router.delete("/{plan_id}")
def delete_plan(plan_id: int, user: User = Depends(require_user), db: Session = Depends(get_db)):
    p = db.query(ContentPlan).filter(ContentPlan.id == plan_id, ContentPlan.user_id == user.id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Plan not found")
    db.delete(p)
    db.commit()
    return {"ok": True}


@router.post("/generate")
def generate_content(user: User = Depends(require_user), db: Session = Depends(get_db)):
    """Simula IA gerando conteúdo baseado nos planos ativos."""
    plans = db.query(ContentPlan).filter(
        ContentPlan.user_id == user.id,
        ContentPlan.is_active == True,
    ).all()
    generated = []
    for p in plans:
        generated.append({
            "plan_id": p.id,
            "title": f"{p.subject or p.title} - Episódio",
            "status": "generated",
        })
    return {"generated": generated, "count": len(generated)}
