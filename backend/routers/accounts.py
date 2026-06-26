from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import User, SocialAccount
from schemas import SocialAccountOut, OkResponse, ProviderLinkResponse
from deps import require_user

router = APIRouter(prefix="/api/v1", tags=["Accounts"])


@router.get("/accounts", response_model=list[SocialAccountOut])
def list_accounts(user: User = Depends(require_user), db: Session = Depends(get_db)):
    return db.query(SocialAccount).filter(SocialAccount.user_id == user.id).all()


@router.delete("/accounts/{account_id}")
def delete_account(account_id: int, user: User = Depends(require_user), db: Session = Depends(get_db)):
    account = db.query(SocialAccount).filter(SocialAccount.id == account_id, SocialAccount.user_id == user.id).first()
    if account:
        db.delete(account)
        db.commit()
    return {"ok": True}


@router.post("/accounts/{account_id}/refresh")
def refresh_account(account_id: int, user: User = Depends(require_user), db: Session = Depends(get_db)):
    account = db.query(SocialAccount).filter(SocialAccount.id == account_id, SocialAccount.user_id == user.id).first()
    if account:
        account.status = "active"
        db.commit()
    return {"ok": True}


@router.post("/accounts/google/exchange")
def account_google_exchange(code: str, user: User = Depends(require_user), db: Session = Depends(get_db)):
    """Mock: creates a Google social account linked to the user."""
    account = SocialAccount(
        user_id=user.id,
        provider="google",
        display_name=user.name,
        username=user.email.split("@")[0],
        status="active",
        scopes=["yt-analytics.readonly", "youtube.upload"],
    )
    db.add(account)
    db.commit()
    db.refresh(account)
    return account


@router.post("/accounts/{provider}/link")
def link_account(provider: str, user: User = Depends(require_user), db: Session = Depends(get_db)):
    return ProviderLinkResponse()
