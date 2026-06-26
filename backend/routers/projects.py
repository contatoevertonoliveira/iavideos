from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User, VideoProject
from deps import require_user
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone

router = APIRouter(prefix="/api/v1/projects", tags=["Video Projects"])


class VideoProjectOut(BaseModel):
    id: int
    title: str
    prompt: Optional[str] = None
    script_text: Optional[str] = None
    voice: Optional[str] = None
    background_music: Optional[str] = None
    style: Optional[str] = None
    niche: Optional[str] = None
    status: str
    preview_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    duration_secs: Optional[int] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    class Config:
        from_attributes = True


class VideoProjectCreate(BaseModel):
    title: str = ""
    prompt: Optional[str] = None
    script_text: Optional[str] = None
    voice: Optional[str] = None
    background_music: Optional[str] = None
    style: Optional[str] = None  # story | asmr | longform | brainrot | ugc
    niche: Optional[str] = None


class VideoProjectUpdate(BaseModel):
    title: Optional[str] = None
    prompt: Optional[str] = None
    script_text: Optional[str] = None
    voice: Optional[str] = None
    background_music: Optional[str] = None
    style: Optional[str] = None
    niche: Optional[str] = None
    status: Optional[str] = None


@router.get("")
def list_projects(user: User = Depends(require_user), db: Session = Depends(get_db)):
    projects = db.query(VideoProject).filter(
        VideoProject.user_id == user.id
    ).order_by(VideoProject.created_at.desc()).all()
    return [
        VideoProjectOut(
            id=p.id, title=p.title, prompt=p.prompt,
            script_text=p.script_text, voice=p.voice,
            background_music=p.background_music, style=p.style,
            niche=p.niche, status=p.status,
            preview_url=p.preview_url, thumbnail_url=p.thumbnail_url,
            duration_secs=p.duration_secs,
            created_at=p.created_at.isoformat() if p.created_at else None,
            updated_at=p.updated_at.isoformat() if p.updated_at else None,
        )
        for p in projects
    ]


@router.post("")
def create_project(body: VideoProjectCreate, user: User = Depends(require_user), db: Session = Depends(get_db)):
    project = VideoProject(
        user_id=user.id,
        title=body.title or "Novo Projeto",
        prompt=body.prompt,
        script_text=body.script_text,
        voice=body.voice,
        background_music=body.background_music,
        style=body.style,
        niche=body.niche,
        status="draft",
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return VideoProjectOut(
        id=project.id, title=project.title, prompt=project.prompt,
        script_text=project.script_text, voice=project.voice,
        background_music=project.background_music, style=project.style,
        niche=project.niche, status=project.status,
        preview_url=project.preview_url, thumbnail_url=project.thumbnail_url,
        duration_secs=project.duration_secs,
        created_at=project.created_at.isoformat() if project.created_at else None,
        updated_at=project.updated_at.isoformat() if project.updated_at else None,
    )


@router.get("/{project_id}")
def get_project(project_id: int, user: User = Depends(require_user), db: Session = Depends(get_db)):
    project = db.query(VideoProject).filter(
        VideoProject.id == project_id, VideoProject.user_id == user.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return VideoProjectOut(
        id=project.id, title=project.title, prompt=project.prompt,
        script_text=project.script_text, voice=project.voice,
        background_music=project.background_music, style=project.style,
        niche=project.niche, status=project.status,
        preview_url=project.preview_url, thumbnail_url=project.thumbnail_url,
        duration_secs=project.duration_secs,
        created_at=project.created_at.isoformat() if project.created_at else None,
        updated_at=project.updated_at.isoformat() if project.updated_at else None,
    )


@router.put("/{project_id}")
def update_project(project_id: int, body: VideoProjectUpdate, user: User = Depends(require_user), db: Session = Depends(get_db)):
    project = db.query(VideoProject).filter(
        VideoProject.id == project_id, VideoProject.user_id == user.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if body.title is not None:
        project.title = body.title
    if body.prompt is not None:
        project.prompt = body.prompt
    if body.script_text is not None:
        project.script_text = body.script_text
    if body.voice is not None:
        project.voice = body.voice
    if body.background_music is not None:
        project.background_music = body.background_music
    if body.style is not None:
        project.style = body.style
    if body.niche is not None:
        project.niche = body.niche
    if body.status is not None:
        project.status = body.status
    project.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(project)
    return VideoProjectOut(
        id=project.id, title=project.title, prompt=project.prompt,
        script_text=project.script_text, voice=project.voice,
        background_music=project.background_music, style=project.style,
        niche=project.niche, status=project.status,
        preview_url=project.preview_url, thumbnail_url=project.thumbnail_url,
        duration_secs=project.duration_secs,
        created_at=project.created_at.isoformat() if project.created_at else None,
        updated_at=project.updated_at.isoformat() if project.updated_at else None,
    )


@router.delete("/{project_id}")
def delete_project(project_id: int, user: User = Depends(require_user), db: Session = Depends(get_db)):
    project = db.query(VideoProject).filter(
        VideoProject.id == project_id, VideoProject.user_id == user.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    db.delete(project)
    db.commit()
    return {"ok": True}
