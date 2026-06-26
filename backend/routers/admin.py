from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User, AdminRequest, BillingSettings
from schemas import AdminRequestCreate, AdminRequestOut, BillingSettingsOut, BillingSettingsUpdate, AdminUserOut, OkResponse
from deps import require_user, require_superadmin
from models import User as UserModel

router = APIRouter(prefix="/api/v1/admin", tags=["Admin"])


@router.post("/users/seed")
def seed_users(user: User = Depends(require_superadmin), db: Session = Depends(get_db)):
    from seed import _seed_users
    old_count = db.query(UserModel).count()
    _seed_users(db)
    db.commit()
    new_count = db.query(UserModel).count()
    return {"ok": True, "created": new_count - old_count}


@router.get("/users", response_model=list[AdminUserOut])
def list_admin_users(user: User = Depends(require_superadmin), db: Session = Depends(get_db)):
    users = db.query(UserModel).all()
    return [AdminUserOut(id=u.id, email=u.email, role=u.role, last_login_at=None) for u in users]


@router.patch("/users/{user_id}/role")
def set_user_role(user_id: int, body: dict, user: User = Depends(require_superadmin), db: Session = Depends(get_db)):
    target = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    target.role = body.get("role", target.role)
    db.commit()
    return {"ok": True, "id": user_id, "role": target.role}


@router.post("/requests")
def create_admin_request(body: AdminRequestCreate, user: User = Depends(require_user), db: Session = Depends(get_db)):
    req = AdminRequest(
        author_id=user.id,
        type=body.type,
        resource=body.resource,
        resource_id=body.resource_id,
        reason=body.reason,
        status="pending",
    )
    db.add(req)
    db.commit()
    db.refresh(req)
    return {"ok": True, **body.model_dump(), "id": req.id, "status": "pending"}


@router.get("/requests", response_model=list[AdminRequestOut])
def list_admin_requests(
    status: str = "pending",
    user: User = Depends(require_superadmin),
    db: Session = Depends(get_db),
):
    return db.query(AdminRequest).filter(AdminRequest.status == status).all()


@router.post("/requests/{req_id}/approve")
def approve_request(req_id: int, user: User = Depends(require_superadmin), db: Session = Depends(get_db)):
    req = db.query(AdminRequest).filter(AdminRequest.id == req_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    req.status = "approved"
    db.commit()
    return {"ok": True, "id": req.id, "status": "approved"}


@router.post("/requests/{req_id}/reject")
def reject_request(req_id: int, user: User = Depends(require_superadmin), db: Session = Depends(get_db)):
    req = db.query(AdminRequest).filter(AdminRequest.id == req_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    req.status = "rejected"
    db.commit()
    return {"ok": True, "id": req.id, "status": "rejected"}


@router.get("/billing/settings")
def get_billing(user: User = Depends(require_superadmin), db: Session = Depends(get_db)):
    s = db.query(BillingSettings).first()
    if not s:
        s = BillingSettings()
        db.add(s)
        db.commit()
        db.refresh(s)
    return BillingSettingsOut(site_mode=s.site_mode, plans_enabled=s.plans_enabled)


@router.patch("/billing/settings")
def update_billing(body: BillingSettingsUpdate, user: User = Depends(require_superadmin), db: Session = Depends(get_db)):
    s = db.query(BillingSettings).first()
    if not s:
        s = BillingSettings()
        db.add(s)
    if body.site_mode is not None:
        s.site_mode = body.site_mode
    db.commit()
    return {"ok": True, "site_mode": s.site_mode, "plans_enabled": s.plans_enabled}
