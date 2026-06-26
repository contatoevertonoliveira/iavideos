from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User, ViralTemplate
from deps import require_user, get_current_user
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

router = APIRouter(prefix="/api/v1/viral-templates", tags=["Viral Templates"])


class TemplateOut(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    platform: Optional[str] = None
    style_prompt: Optional[str] = None
    thumbnail_url: Optional[str] = None
    source_url: Optional[str] = None
    views_estimate: Optional[int] = None
    is_featured: bool = False
    created_at: Optional[str] = None

    class Config:
        from_attributes = True


class TemplateCreate(BaseModel):
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    platform: Optional[str] = None
    style_prompt: Optional[str] = None
    source_url: Optional[str] = None
    views_estimate: Optional[int] = None


@router.get("")
def list_templates(
    category: Optional[str] = None,
    platform: Optional[str] = None,
    featured_only: bool = False,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(ViralTemplate)
    if category:
        query = query.filter(ViralTemplate.category == category)
    if platform:
        query = query.filter(ViralTemplate.platform == platform)
    if featured_only:
        query = query.filter(ViralTemplate.is_featured == True)
    items = query.order_by(ViralTemplate.views_estimate.desc().nullslast()).limit(20).all()
    return [TemplateOut(
        id=t.id, title=t.title, description=t.description,
        category=t.category, platform=t.platform,
        style_prompt=t.style_prompt,
        thumbnail_url=t.thumbnail_url, source_url=t.source_url,
        views_estimate=t.views_estimate, is_featured=t.is_featured,
        created_at=t.created_at.isoformat() if t.created_at else None,
    ) for t in items]


@router.post("")
def create_template(body: TemplateCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    temp = ViralTemplate(
        user_id=user.id if user else None, title=body.title,
        description=body.description, category=body.category,
        platform=body.platform, style_prompt=body.style_prompt,
        source_url=body.source_url, views_estimate=body.views_estimate,
    )
    db.add(temp)
    db.commit()
    db.refresh(temp)
    return TemplateOut(
        id=temp.id, title=temp.title, description=temp.description,
        category=temp.category, platform=temp.platform,
        style_prompt=temp.style_prompt,
        thumbnail_url=temp.thumbnail_url, source_url=temp.source_url,
        views_estimate=temp.views_estimate, is_featured=temp.is_featured,
        created_at=temp.created_at.isoformat() if temp.created_at else None,
    )


@router.delete("/{template_id}")
def delete_template(template_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    temp = db.query(ViralTemplate).filter(ViralTemplate.id == template_id).first()
    if not temp:
        raise HTTPException(status_code=404, detail="Template not found")
    db.delete(temp)
    db.commit()
    return {"ok": True}
