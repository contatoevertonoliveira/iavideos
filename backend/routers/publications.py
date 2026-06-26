from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User, ComposerJob
from schemas import PublicationEntryOut, JobStatusOut
from deps import require_user

router = APIRouter(prefix="/api/v1", tags=["Publications & Jobs"])


@router.get("/publications")
def list_publications(job_id: int | None = None, user: User = Depends(require_user), db: Session = Depends(get_db)):
    query = db.query(ComposerJob).filter(ComposerJob.user_id == user.id)
    if job_id:
        query = query.filter(ComposerJob.id == job_id)
    jobs = query.all()
    return {
        "items": [
            PublicationEntryOut(
                id=j.id,
                platform=j.provider,
                status=j.status,
                external_id=j.external_id,
                error_message=j.error_message,
            )
            for j in jobs
        ]
    }


@router.get("/jobs/{job_id}")
def get_job_status(job_id: int, user: User = Depends(require_user), db: Session = Depends(get_db)):
    job = db.query(ComposerJob).filter(ComposerJob.id == job_id, ComposerJob.user_id == user.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return JobStatusOut(status=job.status)
