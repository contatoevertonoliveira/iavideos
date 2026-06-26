from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User, ScheduledPost, VideoProject
from deps import require_user
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone

router = APIRouter(prefix="/api/v1/scheduled-posts", tags=["Scheduled Posts"])


class PostOut(BaseModel):
    id: int
    project_id: Optional[int] = None
    series_id: Optional[int] = None
    social_account_id: int
    platform: str
    title: str
    description: Optional[str] = None
    status: str
    scheduled_at: Optional[str] = None
    needs_approval: bool = True
    external_id: Optional[str] = None
    error_message: Optional[str] = None
    created_at: Optional[str] = None

    class Config:
        from_attributes = True


class PostCreate(BaseModel):
    project_id: Optional[int] = None
    series_id: Optional[int] = None
    social_account_id: int
    platform: str
    title: str
    description: Optional[str] = None
    scheduled_at: Optional[str] = None
    needs_approval: bool = True


@router.get("")
def list_posts(status: Optional[str] = None, user: User = Depends(require_user), db: Session = Depends(get_db)):
    query = db.query(ScheduledPost).filter(ScheduledPost.user_id == user.id)
    if status:
        query = query.filter(ScheduledPost.status == status)
    posts = query.order_by(ScheduledPost.scheduled_at.desc().nullslast()).all()
    return [PostOut(
        id=p.id, project_id=p.project_id, series_id=p.series_id,
        social_account_id=p.social_account_id, platform=p.platform,
        title=p.title, description=p.description, status=p.status,
        scheduled_at=p.scheduled_at.isoformat() if p.scheduled_at else None,
        needs_approval=p.needs_approval,
        external_id=p.external_id, error_message=p.error_message,
        created_at=p.created_at.isoformat() if p.created_at else None,
    ) for p in posts]


@router.post("")
def create_post(body: PostCreate, user: User = Depends(require_user), db: Session = Depends(get_db)):
    scheduled = None
    if body.scheduled_at:
        try:
            scheduled = datetime.fromisoformat(body.scheduled_at.replace("Z", "+00:00"))
        except:
            scheduled = datetime.now(timezone.utc) + timedelta(hours=1)

    post = ScheduledPost(
        user_id=user.id, project_id=body.project_id, series_id=body.series_id,
        social_account_id=body.social_account_id, platform=body.platform,
        title=body.title, description=body.description,
        scheduled_at=scheduled, needs_approval=body.needs_approval,
        status="scheduled",
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    return PostOut(
        id=post.id, project_id=post.project_id, series_id=post.series_id,
        social_account_id=post.social_account_id, platform=post.platform,
        title=post.title, description=post.description, status=post.status,
        scheduled_at=post.scheduled_at.isoformat() if post.scheduled_at else None,
        needs_approval=post.needs_approval,
        created_at=post.created_at.isoformat() if post.created_at else None,
    )


@router.post("/{post_id}/approve")
def approve_post(post_id: int, user: User = Depends(require_user), db: Session = Depends(get_db)):
    post = db.query(ScheduledPost).filter(ScheduledPost.id == post_id, ScheduledPost.user_id == user.id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    post.status = "approved"
    post.approved_at = datetime.now(timezone.utc)
    post.needs_approval = False
    db.commit()
    return {"ok": True, "status": "approved"}


@router.post("/{post_id}/publish")
def publish_post(post_id: int, user: User = Depends(require_user), db: Session = Depends(get_db)):
    post = db.query(ScheduledPost).filter(ScheduledPost.id == post_id, ScheduledPost.user_id == user.id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    # Simulate publishing
    post.status = "published"
    post.published_at = datetime.now(timezone.utc)
    post.external_id = f"mock_{post.id}_{int(datetime.now(timezone.utc).timestamp())}"
    db.commit()
    return {"ok": True, "status": "published", "external_id": post.external_id}


@router.delete("/{post_id}")
def delete_post(post_id: int, user: User = Depends(require_user), db: Session = Depends(get_db)):
    post = db.query(ScheduledPost).filter(ScheduledPost.id == post_id, ScheduledPost.user_id == user.id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    db.delete(post)
    db.commit()
    return {"ok": True}
