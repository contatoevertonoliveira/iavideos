from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User, SocialAccount, YouTubeChannel
from schemas import YouTubeChannelOut, ChannelItemOut, CategoryUpdate, PublishConfigUpdate
from deps import require_user

router = APIRouter(prefix="/api/v1", tags=["Channels"])


@router.get("/accounts/{account_id}/youtube/channels", response_model=list[YouTubeChannelOut])
def list_youtube_channels(account_id: int, user: User = Depends(require_user), db: Session = Depends(get_db)):
    account = db.query(SocialAccount).filter(SocialAccount.id == account_id, SocialAccount.user_id == user.id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    channels = db.query(YouTubeChannel).filter(YouTubeChannel.account_id == account_id).all()
    return channels


@router.get("/channels", response_model=list[ChannelItemOut])
def list_channels(social_account_id: int | None = None, user: User = Depends(require_user), db: Session = Depends(get_db)):
    query = db.query(YouTubeChannel).join(SocialAccount).filter(SocialAccount.user_id == user.id)
    if social_account_id:
        query = query.filter(YouTubeChannel.account_id == social_account_id)
    channels = query.all()
    return [
        ChannelItemOut(
            id=c.id,
            name=c.name,
            category=c.category or "general",
            publish_config={"auto_publish": c.auto_publish},
        )
        for c in channels
    ]


@router.put("/channels/{channel_id}/category")
def update_channel_category(channel_id: int, body: CategoryUpdate, user: User = Depends(require_user), db: Session = Depends(get_db)):
    channel = db.query(YouTubeChannel).filter(YouTubeChannel.id == channel_id).first()
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    channel.category = body.category
    db.commit()
    return {"id": channel.id, "updated": True, "category": body.category}


@router.put("/channels/{channel_id}/publish-config")
def update_channel_publish_config(channel_id: int, body: PublishConfigUpdate, user: User = Depends(require_user), db: Session = Depends(get_db)):
    channel = db.query(YouTubeChannel).filter(YouTubeChannel.id == channel_id).first()
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    channel.auto_publish = body.auto_publish
    db.commit()
    return {"id": channel.id, "updated": True, "publish_config": {"auto_publish": body.auto_publish}}
