from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User, Series
from deps import require_user
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone

router = APIRouter(prefix="/api/v1/series", tags=["Series"])


class SeriesOut(BaseModel):
    id: int
    name: str
    topic: Optional[str] = None
    niche: Optional[str] = None
    style: Optional[str] = None
    voice: Optional[str] = None
    background_music: Optional[str] = None
    frequency: str = "daily"
    days_of_week: Optional[str] = None
    publish_time: Optional[str] = None
    target_accounts: Optional[list] = None
    auto_approve: bool = False
    is_active: bool = True
    episodes_total: int = 0
    episodes_published: int = 0
    duration_secs: int = 60
    created_at: Optional[str] = None

    class Config:
        from_attributes = True


class SeriesCreate(BaseModel):
    name: str
    topic: Optional[str] = None
    niche: Optional[str] = None
    style: Optional[str] = "story"
    voice: Optional[str] = "adam"
    background_music: Optional[str] = None
    frequency: str = "daily"
    days_of_week: Optional[str] = None
    publish_time: Optional[str] = "08:00"
    target_accounts: Optional[list] = None
    auto_approve: bool = False
    duration_secs: int = 60


class SeriesUpdate(BaseModel):
    name: Optional[str] = None
    topic: Optional[str] = None
    niche: Optional[str] = None
    style: Optional[str] = None
    voice: Optional[str] = None
    background_music: Optional[str] = None
    frequency: Optional[str] = None
    days_of_week: Optional[str] = None
    publish_time: Optional[str] = None
    target_accounts: Optional[list] = None
    auto_approve: Optional[bool] = None
    is_active: Optional[bool] = None
    duration_secs: Optional[int] = None


@router.get("")
def list_series(user: User = Depends(require_user), db: Session = Depends(get_db)):
    items = db.query(Series).filter(Series.user_id == user.id).order_by(Series.created_at.desc()).all()
    return [
        SeriesOut(
            id=s.id, name=s.name, topic=s.topic, niche=s.niche,
            style=s.style, voice=s.voice, background_music=s.background_music,
            frequency=s.frequency, days_of_week=s.days_of_week,
            publish_time=s.publish_time,
            target_accounts=s.target_accounts,
            auto_approve=s.auto_approve, is_active=s.is_active,
            episodes_total=s.episodes_total, episodes_published=s.episodes_published,
            duration_secs=s.duration_secs or 60,
            created_at=s.created_at.isoformat() if s.created_at else None,
        )
        for s in items
    ]


@router.post("")
def create_series(body: SeriesCreate, user: User = Depends(require_user), db: Session = Depends(get_db)):
    series = Series(
        user_id=user.id, name=body.name, topic=body.topic,
        niche=body.niche, style=body.style, voice=body.voice,
        background_music=body.background_music, frequency=body.frequency,
        days_of_week=body.days_of_week, publish_time=body.publish_time,
        target_accounts=body.target_accounts, auto_approve=body.auto_approve,
        duration_secs=body.duration_secs,
    )
    db.add(series)
    db.commit()
    db.refresh(series)
    return SeriesOut(
        id=series.id, name=series.name, topic=series.topic,
        niche=series.niche, style=series.style, voice=series.voice,
        background_music=series.background_music, frequency=series.frequency,
        days_of_week=series.days_of_week, publish_time=series.publish_time,
        target_accounts=series.target_accounts, auto_approve=series.auto_approve,
        is_active=series.is_active, episodes_total=series.episodes_total,
        episodes_published=series.episodes_published,
        duration_secs=series.duration_secs or 60,
        created_at=series.created_at.isoformat() if series.created_at else None,
    )


@router.put("/{series_id}")
def update_series(series_id: int, body: SeriesUpdate, user: User = Depends(require_user), db: Session = Depends(get_db)):
    s = db.query(Series).filter(Series.id == series_id, Series.user_id == user.id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Series not found")
    for field in ["name", "topic", "niche", "style", "voice", "background_music", "frequency", "days_of_week", "publish_time", "target_accounts", "auto_approve", "is_active"]:
        val = getattr(body, field, None)
        if val is not None:
            setattr(s, field, val)
    s.updated_at = datetime.now(timezone.utc)
    db.commit()
    return {"ok": True}


@router.delete("/{series_id}")
def delete_series(series_id: int, user: User = Depends(require_user), db: Session = Depends(get_db)):
    s = db.query(Series).filter(Series.id == series_id, Series.user_id == user.id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Series not found")
    db.delete(s)
    db.commit()
    return {"ok": True}


@router.post("/{series_id}/generate")
def generate_episode(series_id: int, user: User = Depends(require_user), db: Session = Depends(get_db)):
    """Gera um novo episódio da série usando IA e cria projeto na biblioteca."""
    from models import VideoProject
    s = db.query(Series).filter(Series.id == series_id, Series.user_id == user.id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Series not found")
    if not s.is_active:
        raise HTTPException(status_code=400, detail="Series is paused. Resume it first.")

    # Cria o projeto na biblioteca
    episode_num = s.episodes_total + 1
    project = VideoProject(
        user_id=user.id,
        title=f"{s.name} - Episódio {episode_num}",
        prompt=f"Episódio gerado automaticamente da série '{s.name}' sobre {s.topic or s.name}",
        script_text="",
        voice=s.voice or "adam",
        style=s.style or "story",
        niche=s.niche or "",
        status="processing",  # começa como processando
        duration_secs=s.duration_secs or 60,
    )
    db.add(project)
    s.episodes_total = episode_num
    s.episodes_published = episode_num
    s.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(project)

    return {
        "ok": True,
        "episode": episode_num,
        "project_id": project.id,
        "project_title": project.title,
        "message": f"Episódio {episode_num} gerado!",
    }


@router.post("/{series_id}/play")
def play_series(series_id: int, user: User = Depends(require_user), db: Session = Depends(get_db)):
    """Ativa/retoma a série."""
    s = db.query(Series).filter(Series.id == series_id, Series.user_id == user.id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Series not found")
    s.is_active = True
    s.updated_at = datetime.now(timezone.utc)
    db.commit()
    return {"ok": True, "status": "playing"}


@router.post("/{series_id}/pause")
def pause_series(series_id: int, user: User = Depends(require_user), db: Session = Depends(get_db)):
    """Pausa a série (não gera novos episódios)."""
    s = db.query(Series).filter(Series.id == series_id, Series.user_id == user.id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Series not found")
    s.is_active = False
    s.updated_at = datetime.now(timezone.utc)
    db.commit()
    return {"ok": True, "status": "paused"}


@router.post("/{series_id}/stop")
def stop_series(series_id: int, user: User = Depends(require_user), db: Session = Depends(get_db)):
    """Para a série completamente e desmarca como ativa."""
    s = db.query(Series).filter(Series.id == series_id, Series.user_id == user.id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Series not found")
    s.is_active = False
    s.updated_at = datetime.now(timezone.utc)
    db.commit()
    return {"ok": True, "status": "stopped"}
