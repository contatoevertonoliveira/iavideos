from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


# ─── Auth ─────────────────────────────────────────────────────────────────────
class LoginRequest(BaseModel):
    email: str
    password: str


class GoogleExchangeRequest(BaseModel):
    code: str


class TokenResponse(BaseModel):
    access: str
    refresh: str
    user: Optional[dict] = None


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str
    picture: Optional[str] = None
    avatar_url: Optional[str] = None

    class Config:
        from_attributes = True


# ─── Social Account ──────────────────────────────────────────────────────────
class SocialAccountOut(BaseModel):
    id: int
    provider: str
    external_user_id: Optional[str] = None
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    username: Optional[str] = None
    scopes: Optional[list[str]] = None
    status: str
    expires_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ─── YouTube Channel ─────────────────────────────────────────────────────────
class YouTubeChannelOut(BaseModel):
    id: int
    name: str
    external_id: str
    enabled: bool
    category: Optional[str] = None

    class Config:
        from_attributes = True


class ChannelItemOut(BaseModel):
    id: int
    name: str
    category: Optional[str] = None
    publish_config: dict = {}

    class Config:
        from_attributes = True


class CategoryUpdate(BaseModel):
    category: str


class PublishConfigUpdate(BaseModel):
    auto_publish: bool


# ─── VideoPost / Calendar ────────────────────────────────────────────────────
class CalendarItemOut(BaseModel):
    id: int
    title: str
    platform: Optional[str] = None
    social_account_id: Optional[int] = None
    status: str
    scheduled_at: Optional[datetime] = None
    posted_at: Optional[datetime] = None
    thumbnail: Optional[str] = None
    duration_secs: Optional[int] = None
    progress: Optional[int] = None

    class Config:
        from_attributes = True


class ScheduleUpdate(BaseModel):
    scheduled_at: str  # ISO datetime string


# ─── Notification ────────────────────────────────────────────────────────────
class NotificationOut(BaseModel):
    id: int
    type: str
    severity: str
    title: str
    message: Optional[str] = None
    created_at: datetime
    read_at: Optional[datetime] = None
    meta: Optional[dict] = None

    class Config:
        from_attributes = True


class NotificationStats(BaseModel):
    total: int = 0
    unread: int = 0
    critical: int = 0
    warning: int = 0
    info: int = 0


# ─── Alerts ──────────────────────────────────────────────────────────────────
class PerformanceAlertOut(BaseModel):
    type: str
    message: str
    severity: str
    metric: str
    delta: float


class QuotaAlertOut(BaseModel):
    provider: str
    remaining: float
    quota_max: float
    reset_at: str


# ─── Analytics ───────────────────────────────────────────────────────────────
class AnalyticsTotals(BaseModel):
    views: int = 0
    watch_hours: float = 0
    avg_view_duration_sec: float = 0
    ctr: float = 0
    impressions: int = 0
    likes: int = 0
    comments: int = 0
    shares: int = 0
    subs_net: int = 0
    revenue: float = 0


class TimeseriesPoint(BaseModel):
    date: str
    views: int
    watch_hours: float
    impressions: int
    ctr: float


class TrafficSource(BaseModel):
    source: str
    views: int
    watch_hours: float


class RetentionPoint(BaseModel):
    t_sec: float
    retention_pct: float


class TopVideo(BaseModel):
    video_id: int
    title: str
    views: int
    watch_hours: float
    ctr: float
    impressions: int
    avg_view_duration_sec: float
    posted_at: Optional[str] = None
    thumbnail_url: Optional[str] = None


class OverviewResponse(BaseModel):
    totals: AnalyticsTotals
    timeseries: list[TimeseriesPoint]
    traffic_sources: list[TrafficSource]
    retention: list[RetentionPoint]
    top_videos: list[TopVideo]


class CompareAccountSeries(BaseModel):
    social_account_id: int
    label: str
    color: str
    timeseries: list[dict]


class CompareAccountKPI(BaseModel):
    social_account_id: int
    views: int
    watch_hours: float
    ctr: float
    impressions: int


class CompareAccountsResponse(BaseModel):
    series: list[CompareAccountSeries]
    kpis: list[CompareAccountKPI]


class ComparePlatformKPI(BaseModel):
    platform: str
    views: int
    watch_hours: float
    ctr: float
    impressions: int


class ComparePlatformsResponse(BaseModel):
    platforms: list[ComparePlatformKPI]


class ABThumbnail(BaseModel):
    thumbnail_id: int
    impressions: int
    ctr: float
    views: int


class ABExperiment(BaseModel):
    video_id: int
    variants: list[ABThumbnail]
    winner_thumbnail_id: Optional[int] = None


class ABThumbnailsResponse(BaseModel):
    experiments: list[ABExperiment]


class LimitsResponse(BaseModel):
    quota_remaining: float
    quota_total: float
    risk: bool
    warnings: list[str] = []


# ─── Composer ────────────────────────────────────────────────────────────────
class PlatformConfig(BaseModel):
    provider: str
    social_account_id: int
    title: str = ""
    description: str = ""
    tags: list[str] = []
    aspect: str = "16:9"
    thumb_id: Optional[str] = None
    subtitles_id: Optional[str] = None
    schedule_at: Optional[str] = None
    privacy: Optional[str] = None


class ComposerRequest(BaseModel):
    video_post_id: int
    media_asset_id: int
    platforms: list[PlatformConfig]


class PreviewItem(BaseModel):
    provider: str
    social_account_id: int
    title: str
    description: str
    tags: list[str]
    estimated_duration: Optional[str] = None
    warnings: list[str] = []


class ComposerPreviewResponse(BaseModel):
    previews: list[PreviewItem]


class ComposerPrepareResponse(BaseModel):
    ok: bool = True
    id: Optional[int] = None


class EnqueuedItem(BaseModel):
    provider: str
    social_account_id: int
    video_post_id: int
    job_id: int


class ComposerQueueResponse(BaseModel):
    enqueued: list[EnqueuedItem]
    errors: list[dict] = []


# ─── AI Assistant ────────────────────────────────────────────────────────────
class SuggestRequest(BaseModel):
    social_account_id: str
    platform: str
    title: str
    description: str
    tags: list[str] = []
    transcript: Optional[str] = None
    keywords: Optional[list[str]] = None


class Variant(BaseModel):
    platform: str
    title: str
    description: str
    tags: list[str]


class SuggestResponse(BaseModel):
    title: str
    description: str
    tags: list[str]
    keywords: list[str]
    variants: list[Variant]


class ScoreRequest(BaseModel):
    title: str
    description: str
    tags: list[str]
    platform: str


class Issue(BaseModel):
    id: str
    severity: str
    message: str
    fix: Optional[str] = None


class Gauge(BaseModel):
    readability: float
    keywordDensity: float
    length: float


class ScoreResponse(BaseModel):
    score: float
    issues: list[Issue]
    gauges: Gauge


class PostPrepareRequest(BaseModel):
    video_post_id: int
    title: str
    description: str
    tags: list[str]
    platform_profiles: Optional[dict] = None
    thumbnail_id: Optional[str] = None


class PostPrepareResponse(BaseModel):
    status: str = "saved"
    saved: bool = True


# ─── AI Client / Task ────────────────────────────────────────────────────────
class AiTaskRequest(BaseModel):
    task: str
    prompt: Optional[str] = None
    params: Optional[dict] = None
    model: Optional[str] = None
    context: Optional[dict] = None


# ─── Providers ───────────────────────────────────────────────────────────────
class AIProviderOut(BaseModel):
    id: int
    name: str
    kind: str
    enabled: bool
    api_base: Optional[str] = None
    api_key: Optional[str] = None
    meta: Optional[dict] = None

    class Config:
        from_attributes = True


class AIProviderCreate(BaseModel):
    name: str
    kind: str
    api_base: Optional[str] = None
    api_key: Optional[str] = None
    meta: Optional[dict] = None
    enabled: bool = True


class AIProviderUpdate(BaseModel):
    name: Optional[str] = None
    api_base: Optional[str] = None
    api_key: Optional[str] = None
    enabled: Optional[bool] = None
    meta: Optional[dict] = None


class ProviderStatusOut(BaseModel):
    id: int
    state: str  # connected | disconnected | unstable


class DiscoverRequest(BaseModel):
    base_url: str
    api_key: str
    header_key: str = "Authorization"
    name: Optional[str] = None


# ─── Settings ────────────────────────────────────────────────────────────────
class IntegrationProviderOut(BaseModel):
    provider: str
    status: str
    scopes: list[str] = []
    last_refresh: Optional[str] = None
    expires_at: Optional[str] = None


class IntegrationsResponse(BaseModel):
    providers: list[IntegrationProviderOut]


class AiSettingsOut(BaseModel):
    model: str = "gpt-4o-mini"
    temperature: float = 0.7
    auto_tags: bool = True
    auto_schedule: bool = False
    auto_repost: bool = False


class AiSettingsUpdate(BaseModel):
    model: Optional[str] = None
    temperature: Optional[float] = None
    auto_tags: Optional[bool] = None
    auto_schedule: Optional[bool] = None
    auto_repost: Optional[bool] = None


class NotificationsSettingsOut(BaseModel):
    performance: bool = True
    quota: bool = True
    tokens: bool = True
    ai_suggestions: bool = True
    system: bool = True
    channels: dict = {"email": True, "push": True}


class NotificationsSettingsUpdate(BaseModel):
    performance: Optional[bool] = None
    quota: Optional[bool] = None
    tokens: Optional[bool] = None
    ai_suggestions: Optional[bool] = None
    system: Optional[bool] = None


class PreferencesSettingsOut(BaseModel):
    language: str = "pt-BR"
    theme: str = "dark"
    timezone: str = "America/Sao_Paulo"
    dashboard_layout: str = "analytical"


class PreferencesSettingsUpdate(BaseModel):
    language: Optional[str] = None
    theme: Optional[str] = None
    timezone: Optional[str] = None
    dashboard_layout: Optional[str] = None


class SessionItemOut(BaseModel):
    id: str
    device: str
    ip: str
    last_active: str


class LogItemOut(BaseModel):
    timestamp: str
    level: str
    source: str
    message: str


# ─── Publication / Job ───────────────────────────────────────────────────────
class PublicationEntryOut(BaseModel):
    id: int
    platform: str
    status: str
    external_id: Optional[str] = None
    error_message: Optional[str] = None


class JobStatusOut(BaseModel):
    status: str


# ─── Admin ───────────────────────────────────────────────────────────────────
class RoleUpdate(BaseModel):
    role: str


class AdminRequestCreate(BaseModel):
    type: str = "delete"
    resource: str
    resource_id: int
    reason: Optional[str] = None


class AdminRequestOut(BaseModel):
    id: int
    type: str
    resource: str
    resource_id: int
    status: str
    reason: Optional[str] = None

    class Config:
        from_attributes = True


class BillingSettingsOut(BaseModel):
    site_mode: str = "free"
    plans_enabled: bool = False


class BillingSettingsUpdate(BaseModel):
    site_mode: Optional[str] = None


class AdminUserOut(BaseModel):
    id: int
    email: str
    role: str
    last_login_at: Optional[str] = None

    class Config:
        from_attributes = True


# ─── Generic ─────────────────────────────────────────────────────────────────
class OkResponse(BaseModel):
    ok: bool = True


class ProviderLinkResponse(BaseModel):
    client_id: str = "mock-google-client-id"
    gis: dict = {"client_id": "mock-google-client-id"}


# ─── Scheduler ───────────────────────────────────────────────────────────────
class BestTimeSlot(BaseModel):
    datetime: str
    confidence: float


class BestTimesResponse(BaseModel):
    times: list[BestTimeSlot]
    timezone: str = "America/Sao_Paulo"
