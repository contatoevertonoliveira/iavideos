from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, Float, DateTime, Text, JSON, ForeignKey
from sqlalchemy.orm import relationship
from database import Base


def _utcnow():
    return datetime.now(timezone.utc)


# ─── User ─────────────────────────────────────────────────────────────────────
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    name = Column(String, nullable=False, default="")
    role = Column(String, nullable=False, default="user")  # superAdmin | moderator | viewer | user
    picture = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=_utcnow)


# ─── SocialAccount ────────────────────────────────────────────────────────────
class SocialAccount(Base):
    __tablename__ = "social_accounts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    provider = Column(String, nullable=False)  # google | facebook | twitter | tiktok | youtube
    external_user_id = Column(String, nullable=True)
    display_name = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    username = Column(String, nullable=True)
    scopes = Column(JSON, nullable=True)
    status = Column(String, nullable=False, default="active")  # active | revoked | expired | error
    expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=_utcnow)


# ─── YouTubeChannel ───────────────────────────────────────────────────────────
class YouTubeChannel(Base):
    __tablename__ = "youtube_channels"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey("social_accounts.id"), nullable=False)
    name = Column(String, nullable=False)
    external_id = Column(String, nullable=False)
    enabled = Column(Boolean, default=True)
    category = Column(String, nullable=True, default="general")
    auto_publish = Column(Boolean, default=False)


# ─── VideoPost (Calendar) ─────────────────────────────────────────────────────
class VideoPost(Base):
    __tablename__ = "videoposts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False, default="")
    platform = Column(String, nullable=True)
    social_account_id = Column(Integer, nullable=True)
    status = Column(String, nullable=False, default="draft")  # draft | scheduled | queued | publishing | published | failed
    scheduled_at = Column(DateTime, nullable=True)
    posted_at = Column(DateTime, nullable=True)
    thumbnail = Column(String, nullable=True)
    duration_secs = Column(Integer, nullable=True)
    progress = Column(Integer, nullable=True, default=0)
    created_at = Column(DateTime, default=_utcnow)


# ─── Notification ─────────────────────────────────────────────────────────────
class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    type = Column(String, nullable=False, default="system")
    severity = Column(String, nullable=False, default="info")  # info | warning | error | critical
    title = Column(String, nullable=False)
    message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=_utcnow)
    read_at = Column(DateTime, nullable=True)
    meta = Column(JSON, nullable=True)


# ─── AdminRequest (delete approval) ───────────────────────────────────────────
class AdminRequest(Base):
    __tablename__ = "admin_requests"

    id = Column(Integer, primary_key=True, index=True)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    type = Column(String, nullable=False, default="delete")
    resource = Column(String, nullable=False)
    resource_id = Column(Integer, nullable=False)
    reason = Column(Text, nullable=True)
    status = Column(String, nullable=False, default="pending")  # pending | approved | rejected
    reviewer_id = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=_utcnow)


# ─── ComposerJob ──────────────────────────────────────────────────────────────
class ComposerJob(Base):
    __tablename__ = "composer_jobs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    video_post_id = Column(Integer, nullable=False)
    media_asset_id = Column(Integer, nullable=False)
    provider = Column(String, nullable=False)
    social_account_id = Column(Integer, nullable=False)
    status = Column(String, nullable=False, default="queued")  # queued | running | completed | failed
    external_id = Column(String, nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=_utcnow)


# ─── AIProvider ───────────────────────────────────────────────────────────────
class AIProvider(Base):
    __tablename__ = "ai_providers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    kind = Column(String, nullable=False)  # llm | image | video | tts | stt
    enabled = Column(Boolean, default=True)
    api_base = Column(String, nullable=True)
    api_key = Column(String, nullable=True)
    meta = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=_utcnow)


# ─── Settings ─────────────────────────────────────────────────────────────────
class AiSettings(Base):
    __tablename__ = "ai_settings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    model = Column(String, nullable=False, default="gpt-4o-mini")
    temperature = Column(Float, nullable=False, default=0.7)
    auto_tags = Column(Boolean, default=True)
    auto_schedule = Column(Boolean, default=False)
    auto_repost = Column(Boolean, default=False)


class NotificationsSettings(Base):
    __tablename__ = "notifications_settings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    performance = Column(Boolean, default=True)
    quota = Column(Boolean, default=True)
    tokens = Column(Boolean, default=True)
    ai_suggestions = Column(Boolean, default=True)
    system = Column(Boolean, default=True)
    email = Column(Boolean, default=True)
    push = Column(Boolean, default=True)


class PreferencesSettings(Base):
    __tablename__ = "preferences_settings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    language = Column(String, nullable=False, default="pt-BR")
    theme = Column(String, nullable=False, default="dark")
    timezone = Column(String, nullable=False, default="America/Sao_Paulo")
    dashboard_layout = Column(String, nullable=False, default="analytical")


# ─── Session (security) ──────────────────────────────────────────────────────
class UserSession(Base):
    __tablename__ = "user_sessions"

    id = Column(String, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    device = Column(String, nullable=True)
    ip = Column(String, nullable=True)
    last_active = Column(DateTime, default=_utcnow)


# ─── AuditLog ─────────────────────────────────────────────────────────────────
class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True)
    level = Column(String, nullable=False, default="info")  # info | warning | error
    source = Column(String, nullable=True)
    message = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=_utcnow)


# ─── Billing Settings ─────────────────────────────────────────────────────────
class BillingSettings(Base):
    __tablename__ = "billing_settings"

    id = Column(Integer, primary_key=True, index=True)
    site_mode = Column(String, nullable=False, default="free")  # free | subscribers
    plans_enabled = Column(Boolean, default=False)


# ─── ApiKey ──────────────────────────────────────────────────────────────────
class ApiKey(Base):
    """Armazena chaves de API de provedores externos por usuário."""
    __tablename__ = "api_keys"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    provider = Column(String, nullable=False)  # openai | piapi | elevenlabs | anthropic
    api_key = Column(String, nullable=False)
    api_base = Column(String, nullable=True)
    label = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime, default=_utcnow)
    updated_at = Column(DateTime, nullable=True)


# ─── VideoProject ────────────────────────────────────────────────────────────
class VideoProject(Base):
    """Projeto de vídeo no estilo storyshort.ai — gerado a partir de um prompt."""
    __tablename__ = "video_projects"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False, default="")
    prompt = Column(Text, nullable=True)
    script_text = Column(Text, nullable=True)
    voice = Column(String, nullable=True)
    background_music = Column(String, nullable=True)
    style = Column(String, nullable=True)  # story | asmr | longform | etc.
    niche = Column(String, nullable=True)
    status = Column(String, nullable=False, default="draft")  # draft | processing | completed | failed
    preview_url = Column(String, nullable=True)
    thumbnail_url = Column(String, nullable=True)
    duration_secs = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=_utcnow)
    updated_at = Column(DateTime, nullable=True)


# ─── Series ───────────────────────────────────────────────────────────────────
class Series(Base):
    """Série automatizada de conteúdo — a IA cria e publica em frequência definida."""
    __tablename__ = "series"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    topic = Column(String, nullable=True)
    niche = Column(String, nullable=True)
    style = Column(String, nullable=True)  # story | asmr | longform | shorts
    voice = Column(String, nullable=True)
    background_music = Column(String, nullable=True)
    frequency = Column(String, nullable=False, default="daily")  # daily | weekly | custom
    days_of_week = Column(String, nullable=True)  # "1,3,5" = seg, qua, sex
    publish_time = Column(String, nullable=True)  # "08:00"
    target_accounts = Column(JSON, nullable=True)  # list of account IDs
    auto_approve = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    episodes_total = Column(Integer, default=0)
    episodes_published = Column(Integer, default=0)
    duration_secs = Column(Integer, default=60)  # 15, 30, 60 (shorts), 180, 300, 600
    created_at = Column(DateTime, default=_utcnow)
    updated_at = Column(DateTime, nullable=True)


# ─── ScheduledPost ───────────────────────────────────────────────────────────
class ScheduledPost(Base):
    """Publicação agendada em uma conta social específica."""
    __tablename__ = "scheduled_posts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    project_id = Column(Integer, ForeignKey("video_projects.id"), nullable=True)
    series_id = Column(Integer, ForeignKey("series.id"), nullable=True)
    social_account_id = Column(Integer, ForeignKey("social_accounts.id"), nullable=False)
    platform = Column(String, nullable=False)  # youtube | tiktok | instagram
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String, nullable=False, default="scheduled")  # scheduled | approved | publishing | published | failed
    scheduled_at = Column(DateTime, nullable=True)
    published_at = Column(DateTime, nullable=True)
    needs_approval = Column(Boolean, default=True)
    approved_at = Column(DateTime, nullable=True)
    external_id = Column(String, nullable=True)  # ID do vídeo na plataforma
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=_utcnow)
    updated_at = Column(DateTime, nullable=True)


# ─── ContentPlan ─────────────────────────────────────────────────────────────
class ContentPlan(Base):
    """Plano de conteúdo — define assuntos por dia para criação automática."""
    __tablename__ = "content_plans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    day_of_week = Column(Integer, nullable=True)  # 0=domingo ... 6=sábado, null=qualquer
    subject = Column(String, nullable=True)  # assunto/tema do dia
    keywords = Column(JSON, nullable=True)  # palavras-chave
    style = Column(String, nullable=True)
    platform = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=_utcnow)


# ─── ViralTemplate ───────────────────────────────────────────────────────────
class ViralTemplate(Base):
    """Template de vídeo viral — usado para copiar estilos que funcionam."""
    __tablename__ = "viral_templates"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String, nullable=True)  # story | motivation | facts | asmr | recipe | history
    platform = Column(String, nullable=True)  # youtube | tiktok | instagram
    style_prompt = Column(Text, nullable=True)  # prompt de estilo para reproduzir
    thumbnail_url = Column(String, nullable=True)
    source_url = Column(String, nullable=True)
    views_estimate = Column(Integer, nullable=True)
    is_featured = Column(Boolean, default=False)
    created_at = Column(DateTime, default=_utcnow)
