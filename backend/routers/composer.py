from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import User, ComposerJob, VideoPost
from schemas import (
    ComposerRequest, ComposerPreviewResponse, PreviewItem,
    ComposerPrepareResponse, ComposerQueueResponse, EnqueuedItem,
    PlatformConfig,
)
from deps import require_user
import random

router = APIRouter(prefix="/api/v1/composer", tags=["Composer"])


@router.post("/preview")
def composer_preview(body: ComposerRequest, user: User = Depends(require_user), db: Session = Depends(get_db)):
    previews = []
    for p in body.platforms:
        warnings = []
        if len(p.title) > 100:
            warnings.append("Título excede 100 caracteres para YouTube")
        if len(p.description) > 5000:
            warnings.append("Descrição muito longa")
        previews.append(PreviewItem(
            provider=p.provider,
            social_account_id=p.social_account_id,
            title=p.title or "Sem título",
            description=p.description or "Sem descrição",
            tags=p.tags,
            estimated_duration="30s",
            warnings=warnings,
        ))
    return ComposerPreviewResponse(previews=previews)


@router.post("/prepare")
def composer_prepare(body: ComposerRequest, user: User = Depends(require_user), db: Session = Depends(get_db)):
    # Create a draft videopost
    post = VideoPost(
        user_id=user.id,
        title=body.platforms[0].title if body.platforms else "Prepared post",
        platform=body.platforms[0].provider if body.platforms else None,
        social_account_id=body.platforms[0].social_account_id if body.platforms else None,
        status="draft",
        progress=50,
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    return ComposerPrepareResponse(ok=True, id=post.id)


@router.post("/queue")
def composer_queue(body: ComposerRequest, user: User = Depends(require_user), db: Session = Depends(get_db)):
    enqueued = []
    for i, p in enumerate(body.platforms):
        job = ComposerJob(
            user_id=user.id,
            video_post_id=body.video_post_id,
            media_asset_id=body.media_asset_id,
            provider=p.provider,
            social_account_id=p.social_account_id,
            status="queued",
        )
        db.add(job)
        db.flush()
        enqueued.append(EnqueuedItem(
            provider=p.provider,
            social_account_id=p.social_account_id,
            video_post_id=body.video_post_id,
            job_id=job.id,
        ))

    # Update videopost status
    post = db.query(VideoPost).filter(VideoPost.id == body.video_post_id).first()
    if post:
        post.status = "queued"

    db.commit()
    return ComposerQueueResponse(enqueued=enqueued, errors=[])
