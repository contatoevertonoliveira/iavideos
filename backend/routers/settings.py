from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import User
from schemas import (
    AiTaskRequest, AiSettingsOut, AiSettingsUpdate,
    IntegrationsResponse, IntegrationProviderOut,
    NotificationsSettingsOut, NotificationsSettingsUpdate,
    PreferencesSettingsOut, PreferencesSettingsUpdate,
    SessionItemOut, LogItemOut,
)
from models import AiSettings, NotificationsSettings, PreferencesSettings, UserSession, AuditLog, SocialAccount
from deps import require_user
from datetime import datetime, timezone

router = APIRouter(prefix="/api/v1/settings", tags=["Settings"])


# ─── Integrations ────────────────────────────────────────────────────────────
@router.get("/integrations")
def get_integrations(user: User = Depends(require_user), db: Session = Depends(get_db)):
    accounts = db.query(SocialAccount).filter(SocialAccount.user_id == user.id).all()
    providers = []
    for acc in accounts:
        providers.append(IntegrationProviderOut(
            provider=acc.provider,
            status=acc.status,
            scopes=acc.scopes or [],
            last_refresh=acc.created_at.isoformat() if acc.created_at else None,
            expires_at=acc.expires_at.isoformat() if acc.expires_at else None,
        ))
    return IntegrationsResponse(providers=providers)


@router.post("/integrations/{provider}/reconnect")
def reconnect_integration(provider: str, user: User = Depends(require_user)):
    return {"ok": True, "provider": provider}


@router.delete("/integrations/{provider}/revoke")
def revoke_integration(provider: str, user: User = Depends(require_user), db: Session = Depends(get_db)):
    accounts = db.query(SocialAccount).filter(
        SocialAccount.user_id == user.id,
        SocialAccount.provider == provider,
    ).all()
    for acc in accounts:
        acc.status = "revoked"
    db.commit()
    return {"ok": True, "provider": provider}


# ─── AI Settings ────────────────────────────────────────────────────────────
@router.get("/ai")
def get_ai_settings(user: User = Depends(require_user), db: Session = Depends(get_db)):
    s = db.query(AiSettings).filter(AiSettings.user_id == user.id).first()
    if not s:
        s = AiSettings(user_id=user.id)
        db.add(s)
        db.commit()
        db.refresh(s)
    return AiSettingsOut(
        model=s.model,
        temperature=s.temperature,
        auto_tags=s.auto_tags,
        auto_schedule=s.auto_schedule,
        auto_repost=s.auto_repost,
    )


@router.patch("/ai")
def update_ai_settings(body: AiSettingsUpdate, user: User = Depends(require_user), db: Session = Depends(get_db)):
    s = db.query(AiSettings).filter(AiSettings.user_id == user.id).first()
    if not s:
        s = AiSettings(user_id=user.id)
        db.add(s)
    if body.model is not None:
        s.model = body.model
    if body.temperature is not None:
        s.temperature = body.temperature
    if body.auto_tags is not None:
        s.auto_tags = body.auto_tags
    if body.auto_schedule is not None:
        s.auto_schedule = body.auto_schedule
    if body.auto_repost is not None:
        s.auto_repost = body.auto_repost
    db.commit()
    return {"ok": True, **body.model_dump(exclude_none=True)}


# ─── Notifications Settings ─────────────────────────────────────────────────
@router.get("/notifications")
def get_notifications_settings(user: User = Depends(require_user), db: Session = Depends(get_db)):
    s = db.query(NotificationsSettings).filter(NotificationsSettings.user_id == user.id).first()
    if not s:
        s = NotificationsSettings(user_id=user.id)
        db.add(s)
        db.commit()
        db.refresh(s)
    return {
        "data": NotificationsSettingsOut(
            performance=s.performance,
            quota=s.quota,
            tokens=s.tokens,
            ai_suggestions=s.ai_suggestions,
            system=s.system,
            channels={"email": s.email, "push": s.push},
        )
    }


@router.patch("/notifications")
def update_notifications_settings(body: NotificationsSettingsUpdate, user: User = Depends(require_user), db: Session = Depends(get_db)):
    s = db.query(NotificationsSettings).filter(NotificationsSettings.user_id == user.id).first()
    if not s:
        s = NotificationsSettings(user_id=user.id)
        db.add(s)
    if body.performance is not None:
        s.performance = body.performance
    if body.quota is not None:
        s.quota = body.quota
    if body.tokens is not None:
        s.tokens = body.tokens
    if body.ai_suggestions is not None:
        s.ai_suggestions = body.ai_suggestions
    if body.system is not None:
        s.system = body.system
    db.commit()
    return {"ok": True, **body.model_dump(exclude_none=True)}


# ─── Preferences Settings ───────────────────────────────────────────────────
@router.get("/preferences")
def get_preferences(user: User = Depends(require_user), db: Session = Depends(get_db)):
    s = db.query(PreferencesSettings).filter(PreferencesSettings.user_id == user.id).first()
    if not s:
        s = PreferencesSettings(user_id=user.id)
        db.add(s)
        db.commit()
        db.refresh(s)
    return {
        "data": PreferencesSettingsOut(
            language=s.language,
            theme=s.theme,
            timezone=s.timezone,
            dashboard_layout=s.dashboard_layout,
        )
    }


@router.patch("/preferences")
def update_preferences(body: PreferencesSettingsUpdate, user: User = Depends(require_user), db: Session = Depends(get_db)):
    s = db.query(PreferencesSettings).filter(PreferencesSettings.user_id == user.id).first()
    if not s:
        s = PreferencesSettings(user_id=user.id)
        db.add(s)
    if body.language is not None:
        s.language = body.language
    if body.theme is not None:
        s.theme = body.theme
    if body.timezone is not None:
        s.timezone = body.timezone
    if body.dashboard_layout is not None:
        s.dashboard_layout = body.dashboard_layout
    db.commit()
    return {"ok": True, **body.model_dump(exclude_none=True)}


# ─── Security / Sessions ────────────────────────────────────────────────────
@router.get("/security/sessions")
def list_sessions(user: User = Depends(require_user), db: Session = Depends(get_db)):
    sessions = db.query(UserSession).filter(UserSession.user_id == user.id).all()
    return {
        "sessions": [
            SessionItemOut(
                id=s.id,
                device=s.device or "Unknown device",
                ip=s.ip or "0.0.0.0",
                last_active=s.last_active.isoformat() if s.last_active else "",
            )
            for s in sessions
        ]
    }


@router.delete("/security/sessions/{session_id}")
def delete_session(session_id: str, user: User = Depends(require_user), db: Session = Depends(get_db)):
    s = db.query(UserSession).filter(UserSession.id == session_id, UserSession.user_id == user.id).first()
    if s:
        db.delete(s)
        db.commit()
    return {"ok": True, "id": session_id}


# ─── Logs ────────────────────────────────────────────────────────────────────
@router.get("/logs")
def list_logs(limit: int = 50, user: User = Depends(require_user), db: Session = Depends(get_db)):
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(limit).all()
    return {
        "logs": [
            LogItemOut(
                timestamp=log.timestamp.isoformat() if log.timestamp else "",
                level=log.level,
                source=log.source or "",
                message=log.message or "",
            )
            for log in logs
        ]
    }


@router.get("/logs/export")
def export_logs(
    format: str = "json",
    user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    return {"ok": True, "format": format, "generated_at": datetime.now(timezone.utc).isoformat()}
