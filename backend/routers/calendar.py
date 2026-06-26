from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User, Notification, VideoPost, ComposerJob
from schemas import (
    NotificationOut, NotificationStats, PerformanceAlertOut, QuotaAlertOut,
    CalendarItemOut, ScheduleUpdate, BestTimesResponse, BestTimeSlot,
)
from deps import require_user
from datetime import datetime, timezone

router = APIRouter(prefix="/api/v1", tags=["Videoposts & Calendar"])


# ─── Calendar / Videoposts ──────────────────────────────────────────────────
@router.get("/videoposts/calendar", response_model=list[CalendarItemOut])
def calendar(
    start: str | None = None,
    end: str | None = None,
    user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    posts = db.query(VideoPost).filter(VideoPost.user_id == user.id).all()
    return posts


@router.patch("/videoposts/{post_id}/schedule")
def update_schedule(post_id: int, body: ScheduleUpdate, user: User = Depends(require_user), db: Session = Depends(get_db)):
    post = db.query(VideoPost).filter(VideoPost.id == post_id, VideoPost.user_id == user.id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    try:
        post.scheduled_at = datetime.fromisoformat(body.scheduled_at.replace("Z", "+00:00"))
    except ValueError:
        post.scheduled_at = datetime.now(timezone.utc)
    db.commit()
    return {"ok": True}


@router.post("/videoposts/{post_id}/requeue")
def requeue_post(post_id: int, user: User = Depends(require_user), db: Session = Depends(get_db)):
    post = db.query(VideoPost).filter(VideoPost.id == post_id, VideoPost.user_id == user.id).first()
    if post:
        post.status = "queued"
        post.progress = 0
        db.commit()
    return {"ok": True}


@router.delete("/videoposts/{post_id}")
def delete_post(post_id: int, user: User = Depends(require_user), db: Session = Depends(get_db)):
    post = db.query(VideoPost).filter(VideoPost.id == post_id, VideoPost.user_id == user.id).first()
    if post:
        db.delete(post)
        db.commit()
    return {"ok": True}


# ─── Scheduler Best Times ──────────────────────────────────────────────────
@router.get("/scheduler/best_times")
def best_times(
    social_account_id: int | None = None,
    platform: str | None = None,
    user: User = Depends(require_user),
):
    import random
    times = []
    for h in [8, 10, 12, 14, 16, 18, 20]:
        times.append(BestTimeSlot(
            datetime=f"2026-06-27T{h:02d}:00:00",
            confidence=round(random.uniform(0.5, 0.95), 2),
        ))
    times.sort(key=lambda t: t.confidence, reverse=True)
    return BestTimesResponse(times=times[:5])


# ─── Notifications ──────────────────────────────────────────────────────────
@router.get("/notifications", response_model=list[NotificationOut])
def list_notifications(
    unread_only: bool = False,
    limit: int = 50,
    user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    query = db.query(Notification).filter(Notification.user_id == user.id)
    if unread_only:
        query = query.filter(Notification.read_at.is_(None))
    return query.order_by(Notification.created_at.desc()).limit(limit).all()


@router.patch("/notifications/{notif_id}/read")
def mark_read(notif_id: int, user: User = Depends(require_user), db: Session = Depends(get_db)):
    notif = db.query(Notification).filter(Notification.id == notif_id, Notification.user_id == user.id).first()
    if notif:
        notif.read_at = datetime.now(timezone.utc)
        db.commit()
    return {"ok": True}


@router.patch("/notifications/read_all")
def mark_all_read(user: User = Depends(require_user), db: Session = Depends(get_db)):
    db.query(Notification).filter(Notification.user_id == user.id, Notification.read_at.is_(None)).update(
        {"read_at": datetime.now(timezone.utc)}
    )
    db.commit()
    return {"ok": True}


@router.get("/notifications/stats")
def notification_stats(user: User = Depends(require_user), db: Session = Depends(get_db)):
    total = db.query(Notification).filter(Notification.user_id == user.id).count()
    unread = db.query(Notification).filter(Notification.user_id == user.id, Notification.read_at.is_(None)).count()
    critical = db.query(Notification).filter(Notification.user_id == user.id, Notification.severity == "critical").count()
    warning = db.query(Notification).filter(Notification.user_id == user.id, Notification.severity == "warning").count()
    info = db.query(Notification).filter(Notification.user_id == user.id, Notification.severity == "info").count()
    return NotificationStats(total=total, unread=unread, critical=critical, warning=warning, info=info)


# ─── Alerts ──────────────────────────────────────────────────────────────────
@router.get("/alerts/performance")
def performance_alerts(user: User = Depends(require_user)):
    import random
    return {
        "alerts": [
            PerformanceAlertOut(type="views_drop", message="Queda de 15% nas visualizações na última semana", severity="warning", metric="views", delta=-15.0),
            PerformanceAlertOut(type="ctr_drop", message=f"CTR caiu {round(random.uniform(0.5, 3), 1)}% no último mês", severity="info", metric="ctr", delta=round(random.uniform(-3, -0.5), 1)),
            PerformanceAlertOut(type="subs_gain", message="Ganho de 23 inscritos esta semana", severity="info", metric="subs_net", delta=23.0),
        ]
    }


@router.get("/alerts/quota")
def quota_alerts(
    provider: str = "youtube",
    user: User = Depends(require_user),
):
    import random
    used = random.uniform(5000, 9000)
    return QuotaAlertOut(
        provider=provider,
        remaining=round(10000 - used, 1),
        quota_max=10000,
        reset_at="2026-06-27T00:00:00Z",
    )
