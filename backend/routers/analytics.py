from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import User, VideoPost
from schemas import (
    OverviewResponse, AnalyticsTotals, TimeseriesPoint, TrafficSource,
    RetentionPoint, TopVideo, CompareAccountsResponse, CompareAccountSeries,
    CompareAccountKPI, ComparePlatformsResponse, ComparePlatformKPI,
    ABThumbnailsResponse, ABExperiment, ABThumbnail,
    LimitsResponse,
)
from deps import require_user
import math
from datetime import datetime, timedelta, timezone

router = APIRouter(prefix="/api/v1/analytics", tags=["Analytics"])


def _generate_timeseries(days: int = 30):
    """Generate mock timeseries data."""
    import random
    now = datetime.now(timezone.utc)
    points = []
    for i in range(days):
        d = (now - timedelta(days=days - 1 - i)).strftime("%Y-%m-%d")
        points.append(TimeseriesPoint(
            date=d,
            views=random.randint(500, 5000),
            watch_hours=round(random.uniform(10, 300), 1),
            impressions=random.randint(2000, 20000),
            ctr=round(random.uniform(1.0, 8.0), 1),
        ))
    return points


@router.get("/overview")
def overview(
    start: str | None = None,
    end: str | None = None,
    social_account_id: int | None = None,
    platform: str | None = None,
    user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    import random
    posts = db.query(VideoPost).filter(VideoPost.user_id == user.id).all()
    published = [p for p in posts if p.status == "published"]

    return OverviewResponse(
        totals=AnalyticsTotals(
            views=sum(p.duration_secs or 0 * random.randint(1, 10) for p in published) or 15234,
            watch_hours=round(sum((p.duration_secs or 0) * random.uniform(0.001, 0.01) for p in published), 1) or 312.5,
            avg_view_duration_sec=round(sum(p.duration_secs or 0 for p in published) / max(len(published), 1) * random.uniform(0.3, 0.6), 1) or 215.0,
            ctr=round(random.uniform(3.0, 6.0), 1),
            impressions=sum(p.duration_secs or 0 * random.randint(2, 20) for p in published) or 285000,
            likes=random.randint(100, 2000),
            comments=random.randint(10, 500),
            shares=random.randint(5, 300),
            subs_net=random.randint(-50, 200),
            revenue=round(random.uniform(0, 500), 2),
        ),
        timeseries=_generate_timeseries(30),
        traffic_sources=[
            TrafficSource(source="YouTube Search", views=random.randint(3000, 10000), watch_hours=round(random.uniform(50, 500), 1)),
            TrafficSource(source="Suggested videos", views=random.randint(2000, 8000), watch_hours=round(random.uniform(30, 400), 1)),
            TrafficSource(source="External", views=random.randint(500, 3000), watch_hours=round(random.uniform(10, 150), 1)),
            TrafficSource(source="Direct / Unknown", views=random.randint(200, 1500), watch_hours=round(random.uniform(5, 80), 1)),
        ],
        retention=[RetentionPoint(t_sec=i * 10, retention_pct=max(0, 100 - i * 3)) for i in range(30)],
        top_videos=[
            TopVideo(video_id=1, title="Review iPhone 16", views=12500, watch_hours=312.5, ctr=5.2, impressions=240000, avg_view_duration_sec=360.0, posted_at="2026-06-24T10:00:00Z", thumbnail_url="https://picsum.photos/seed/review/320/180"),
            TopVideo(video_id=2, title="Tutorial React 2025", views=8900, watch_hours=445.0, ctr=4.8, impressions=185000, avg_view_duration_sec=480.0, posted_at="2026-06-20T14:00:00Z", thumbnail_url="https://picsum.photos/seed/react/320/180"),
            TopVideo(video_id=3, title="Dica Rápida: CSS Grid", views=4500, watch_hours=45.0, ctr=7.1, impressions=63000, avg_view_duration_sec=45.0, posted_at="2026-06-18T09:00:00Z", thumbnail_url="https://picsum.photos/seed/css/320/180"),
        ],
    )


@router.get("/compare/accounts")
def compare_accounts(
    ids: str = "1,2",
    platform: str = "youtube",
    start: str | None = None,
    end: str | None = None,
    user: User = Depends(require_user),
):
    import random
    account_ids = [int(x) for x in ids.split(",")]
    colors = ["#00B4FF", "#FF6B6B", "#51CF66", "#FFD43B"]
    series = []
    kpis = []
    for i, aid in enumerate(account_ids[:4]):
        series.append(CompareAccountSeries(
            social_account_id=aid,
            label=f"Account {aid}",
            color=colors[i % len(colors)],
            timeseries=[
                {"date": f"2026-06-{d:02d}", "views": random.randint(100, 5000), "watch_hours": round(random.uniform(5, 250), 1)}
                for d in range(1, 31)
            ],
        ))
        kpis.append(CompareAccountKPI(
            social_account_id=aid,
            views=random.randint(5000, 50000),
            watch_hours=round(random.uniform(100, 2000), 1),
            ctr=round(random.uniform(2.0, 8.0), 1),
            impressions=random.randint(50000, 500000),
        ))
    return CompareAccountsResponse(series=series, kpis=kpis)


@router.get("/compare/platforms")
def compare_platforms(
    social_account_id: int | None = None,
    start: str | None = None,
    end: str | None = None,
    user: User = Depends(require_user),
):
    import random
    return ComparePlatformsResponse(platforms=[
        ComparePlatformKPI(platform="youtube", views=random.randint(5000, 50000), watch_hours=round(random.uniform(100, 2000), 1), ctr=round(random.uniform(2, 8), 1), impressions=random.randint(50000, 500000)),
        ComparePlatformKPI(platform="instagram", views=random.randint(2000, 20000), watch_hours=round(random.uniform(20, 500), 1), ctr=round(random.uniform(1, 5), 1), impressions=random.randint(10000, 200000)),
        ComparePlatformKPI(platform="tiktok", views=random.randint(10000, 100000), watch_hours=round(random.uniform(50, 1000), 1), ctr=round(random.uniform(3, 12), 1), impressions=random.randint(50000, 500000)),
    ])


@router.get("/ab-thumbnails")
def ab_thumbnails(
    social_account_id: int | None = None,
    start: str | None = None,
    end: str | None = None,
    user: User = Depends(require_user),
):
    import random
    return ABThumbnailsResponse(experiments=[
        ABExperiment(
            video_id=1,
            variants=[
                ABThumbnail(thumbnail_id=1, impressions=50000, ctr=round(random.uniform(3, 8), 1), views=random.randint(1000, 5000)),
                ABThumbnail(thumbnail_id=2, impressions=50000, ctr=round(random.uniform(3, 8), 1), views=random.randint(1000, 5000)),
            ],
            winner_thumbnail_id=random.choice([1, 2]),
        )
    ])


@router.get("/video/{video_id}/retention")
def video_retention(video_id: int, user: User = Depends(require_user)):
    return {
        "retention": [
            {"t_sec": i * 10, "retention_pct": max(0, 100 - i * 2.5 - (i ** 1.5) * 0.3)}
            for i in range(40)
        ]
    }


@router.get("/limits")
def limits(
    social_account_id: int | None = None,
    platform: str | None = None,
    user: User = Depends(require_user),
):
    import random
    remaining = random.uniform(100, 10000)
    total = 10000
    return LimitsResponse(
        quota_remaining=round(remaining, 1),
        quota_total=total,
        risk=remaining < total * 0.15,
        warnings=[] if remaining > total * 0.15 else ["Quota abaixo de 15% - considere reduzir o uso da API"],
    )
