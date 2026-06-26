"""Seed data for development/testing."""
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from auth import hash_password
from models import (
    User, SocialAccount, YouTubeChannel, VideoPost, Notification,
    AdminRequest, AIProvider, AiSettings, NotificationsSettings,
    PreferencesSettings, UserSession, AuditLog, BillingSettings,
    ComposerJob, ViralTemplate, ContentPlan,
)


def seed_all(db: Session):
    """Create default seed data idempotently."""
    _seed_users(db)
    _seed_accounts(db)
    _seed_channels(db)
    _seed_videoposts(db)
    _seed_notifications(db)
    _seed_providers(db)
    _seed_settings(db)
    _seed_sessions(db)
    _seed_logs(db)
    _seed_billing(db)
    _seed_composer_jobs(db)
    _seed_viral_templates(db)
    _seed_content_plans(db)
    db.commit()


def _seed_users(db: Session):
    if db.query(User).count() > 0:
        return
    users_data = [
        {"email": "everoliver@example.com", "password": "123456", "name": "Ever Oliveira", "role": "superAdmin", "picture": None},
        {"email": "everoliver02@example.com", "password": "123456", "name": "Ever Moderador", "role": "moderator", "picture": None},
        {"email": "everoliver03@example.com", "password": "123456", "name": "Ever Viewer", "role": "viewer", "picture": None},
        {"email": "user@example.com", "password": "123456", "name": "Usuário Teste", "role": "user", "picture": None},
    ]
    now = datetime.now(timezone.utc)
    for u in users_data:
        user = User(
            email=u["email"],
            password_hash=hash_password(u["password"]),
            name=u["name"],
            role=u["role"],
            picture=u["picture"],
            created_at=now,
        )
        db.add(user)
    db.flush()


def _seed_accounts(db: Session):
    if db.query(SocialAccount).count() > 0:
        return
    user = db.query(User).filter(User.email == "everoliver@example.com").first()
    if not user:
        return
    accounts = [
        {"user_id": user.id, "provider": "google", "display_name": "Ever Oliveira", "username": "everoliver", "status": "active", "scopes": ["yt-analytics.readonly", "youtube.upload"]},
        {"user_id": user.id, "provider": "google", "display_name": "Canal Tech", "username": "canaltech", "status": "active", "scopes": ["yt-analytics.readonly"]},
        {"user_id": user.id, "provider": "youtube", "display_name": "Ever Oliveira YT", "username": "everoliveryt", "status": "active", "scopes": ["youtube.upload"]},
        {"user_id": user.id, "provider": "tiktok", "display_name": "Ever TikTok", "username": "evertiktok", "status": "active", "scopes": ["tiktok.content.publish"]},
        {"user_id": user.id, "provider": "facebook", "display_name": "Ever Facebook", "username": "everfb", "status": "active"},
        {"user_id": user.id, "provider": "twitter", "display_name": "Ever X", "username": "everx", "status": "active"},
    ]
    for a in accounts:
        db.add(SocialAccount(**a))
    db.flush()


def _seed_channels(db: Session):
    if db.query(YouTubeChannel).count() > 0:
        return
    account = db.query(SocialAccount).filter(SocialAccount.provider == "youtube").first()
    if not account:
        account = db.query(SocialAccount).first()
    if not account:
        return
    channels = [
        {"account_id": account.id, "name": "Canal Principal", "external_id": "UC_main", "enabled": True, "category": "tech", "auto_publish": True},
        {"account_id": account.id, "name": "Canal Vlog", "external_id": "UC_vlog", "enabled": True, "category": "vlog", "auto_publish": False},
    ]
    for c in channels:
        db.add(YouTubeChannel(**c))
    db.flush()


def _seed_videoposts(db: Session):
    if db.query(VideoPost).count() > 0:
        return
    user = db.query(User).filter(User.email == "everoliver@example.com").first()
    if not user:
        return
    now = datetime.now(timezone.utc)
    posts = [
        {"user_id": user.id, "title": "Review iPhone 16", "platform": "youtube", "social_account_id": 1, "status": "published", "scheduled_at": now - timedelta(days=2), "posted_at": now - timedelta(days=2), "duration_secs": 720, "progress": 100},
        {"user_id": user.id, "title": "Tutorial React 2025", "platform": "youtube", "social_account_id": 1, "status": "scheduled", "scheduled_at": now + timedelta(days=3), "posted_at": None, "duration_secs": 1800, "progress": 0},
        {"user_id": user.id, "title": "Dica Rápida: CSS Grid", "platform": "instagram", "social_account_id": 4, "status": "scheduled", "scheduled_at": now + timedelta(days=1), "posted_at": None, "duration_secs": 60, "progress": 0},
        {"user_id": user.id, "title": "Vlog Semanal #42", "platform": "youtube", "social_account_id": 1, "status": "draft", "scheduled_at": None, "posted_at": None, "duration_secs": 1200, "progress": 30},
        {"user_id": user.id, "title": "Unboxing Novo Setup", "platform": "tiktok", "social_account_id": 4, "status": "queued", "scheduled_at": None, "posted_at": None, "duration_secs": 45, "progress": 0},
        {"user_id": user.id, "title": "Dica de Produtividade", "platform": "youtube", "social_account_id": 1, "status": "failed", "scheduled_at": now - timedelta(days=1), "posted_at": None, "duration_secs": 300, "progress": 50},
    ]
    for p in posts:
        db.add(VideoPost(**p))
    db.flush()


def _seed_notifications(db: Session):
    if db.query(Notification).count() > 0:
        return
    user = db.query(User).filter(User.email == "everoliver@example.com").first()
    if not user:
        return
    now = datetime.now(timezone.utc)
    notifications = [
        {"user_id": user.id, "type": "system", "severity": "info", "title": "Bem-vindo ao NeuralCineFlow", "message": "Sua plataforma de automação de vídeos está pronta!", "created_at": now, "read_at": None},
        {"user_id": user.id, "type": "performance", "severity": "warning", "title": "Queda de desempenho", "message": "O vídeo 'Review iPhone 16' teve uma queda de 15% nas visualizações nas últimas 24h.", "created_at": now - timedelta(hours=2), "read_at": None},
        {"user_id": user.id, "type": "quota", "severity": "info", "title": "Quota próxima do limite", "message": "YouTube API: 85% da quota diária utilizada.", "created_at": now - timedelta(hours=5), "read_at": None},
        {"user_id": user.id, "type": "token", "severity": "warning", "title": "Token próximo de expirar", "message": "O token de acesso da conta 'Canal Tech' expira em 3 dias.", "created_at": now - timedelta(days=1), "read_at": None},
        {"user_id": user.id, "type": "system", "severity": "info", "title": "Publicação concluída", "message": "O vídeo 'Review iPhone 16' foi publicado com sucesso no YouTube.", "created_at": now - timedelta(days=2), "read_at": now - timedelta(days=1)},
        {"user_id": user.id, "type": "ai_suggestions", "severity": "info", "title": "Sugestão de IA disponível", "message": "Novas sugestões de otimização para seu próximo vídeo.", "created_at": now - timedelta(hours=3), "read_at": None},
    ]
    for n in notifications:
        db.add(Notification(**n))
    db.flush()


def _seed_providers(db: Session):
    if db.query(AIProvider).count() > 0:
        return
    providers = [
        {"name": "OpenAI", "kind": "llm", "enabled": True, "api_base": "https://api.openai.com/v1", "meta": {"models": ["gpt-4o", "gpt-4o-mini"]}},
        {"name": "PiAPI", "kind": "image", "enabled": True, "api_base": "https://api.piapi.ai", "meta": {"models": ["Qubico/flux1-dev", "Qubico/flux1-schnell"]}},
        {"name": "PiAPI Video", "kind": "video", "enabled": True, "api_base": "https://api.piapi.ai", "meta": {"models": ["kling", "hailuo", "veo3"]}},
        {"name": "PiAPI TTS", "kind": "tts", "enabled": True, "api_base": "https://api.piapi.ai", "meta": {"models": ["Qubico/tts", "Qubico/diffrhythm"]}},
        {"name": "Whisper", "kind": "stt", "enabled": True, "api_base": None, "meta": {"models": ["whisper-1"]}},
    ]
    for p in providers:
        db.add(AIProvider(**p))
    db.flush()


def _seed_settings(db: Session):
    users = db.query(User).all()
    for user in users:
        if not db.query(AiSettings).filter(AiSettings.user_id == user.id).first():
            db.add(AiSettings(user_id=user.id))
        if not db.query(NotificationsSettings).filter(NotificationsSettings.user_id == user.id).first():
            db.add(NotificationsSettings(user_id=user.id))
        if not db.query(PreferencesSettings).filter(PreferencesSettings.user_id == user.id).first():
            db.add(PreferencesSettings(user_id=user.id))
    db.flush()


def _seed_sessions(db: Session):
    if db.query(UserSession).count() > 0:
        return
    import uuid
    user = db.query(User).filter(User.email == "everoliver@example.com").first()
    if not user:
        return
    now = datetime.now(timezone.utc)
    sessions = [
        {"id": str(uuid.uuid4()), "user_id": user.id, "device": "Chrome/Windows", "ip": "192.168.1.100", "last_active": now - timedelta(hours=1)},
        {"id": str(uuid.uuid4()), "user_id": user.id, "device": "Safari/MacOS", "ip": "192.168.1.101", "last_active": now - timedelta(days=2)},
    ]
    for s in sessions:
        db.add(UserSession(**s))
    db.flush()


def _seed_logs(db: Session):
    if db.query(AuditLog).count() > 0:
        return
    user = db.query(User).filter(User.email == "everoliver@example.com").first()
    user_id = user.id if user else None
    now = datetime.now(timezone.utc)
    logs = [
        {"user_id": user_id, "level": "info", "source": "auth", "message": "Login realizado com sucesso", "timestamp": now - timedelta(hours=1)},
        {"user_id": user_id, "level": "info", "source": "videoposts", "message": "Vídeo 'Review iPhone 16' publicado", "timestamp": now - timedelta(days=2)},
        {"user_id": user_id, "level": "warning", "source": "api", "message": "Quota da API YouTube em 85%", "timestamp": now - timedelta(hours=5)},
        {"user_id": user_id, "level": "error", "source": "composer", "message": "Falha ao publicar no TikTok: token expirado", "timestamp": now - timedelta(hours=6)},
        {"user_id": user_id, "level": "info", "source": "admin", "message": "Seed de usuários executado", "timestamp": now - timedelta(days=7)},
    ]
    for l in logs:
        db.add(AuditLog(**l))
    db.flush()


def _seed_billing(db: Session):
    if db.query(BillingSettings).count() > 0:
        return
    db.add(BillingSettings(site_mode="free", plans_enabled=False))
    db.flush()


def _seed_composer_jobs(db: Session):
    if db.query(ComposerJob).count() > 0:
        return
    user = db.query(User).filter(User.email == "everoliver@example.com").first()
    if not user:
        return
    now = datetime.now(timezone.utc)
    jobs = [
        {"user_id": user.id, "video_post_id": 1, "media_asset_id": 1, "provider": "youtube", "social_account_id": 1, "status": "completed", "external_id": "yt_video_123"},
        {"user_id": user.id, "video_post_id": 5, "media_asset_id": 2, "provider": "tiktok", "social_account_id": 4, "status": "queued", "external_id": None},
    ]
    for j in jobs:
        db.add(ComposerJob(**j))
    db.flush()


def _seed_viral_templates(db: Session):
    if db.query(ViralTemplate).count() > 0:
        return
    templates = [
        {"title": "Mistérios do Mundo Antigo", "description": "Histórias fascinantes sobre civilizações perdidas e mistérios arqueológicos que ninguém consegue explicar.", "category": "story", "platform": "youtube", "style_prompt": "Narração misteriosa com imagens cinematográficas de ruínas antigas, música de suspense ao fundo.", "thumbnail_url": "https://picsum.photos/seed/misterio/320/180", "views_estimate": 850000, "is_featured": True},
        {"title": "Histórias Motivacionais", "description": "Histórias reais de superação que inspiram milhões. Transforme fracassos em lições de vida.", "category": "motivation", "platform": "tiktok", "style_prompt": "Narração emotiva com imagens inspiradoras, música emocionante ao fundo. Frases de impacto.", "thumbnail_url": "https://picsum.photos/seed/motivacao/320/180", "views_estimate": 1200000, "is_featured": True},
        {"title": "Fatos Curiosos que Você Não Sabia", "description": "Curiosidades impressionantes sobre ciência, história e natureza que vão te surpreender.", "category": "facts", "platform": "instagram", "style_prompt": "Estilo dinâmico com imagens rápidas e texto na tela. Música animada e edição ágil.", "thumbnail_url": "https://picsum.photos/seed/curiosidades/320/180", "views_estimate": 650000, "is_featured": True},
        {"title": "ASMR: Sons da Natureza", "description": "Sons relaxantes da natureza para meditação e foco. Perfeito para momentos de calma.", "category": "asmr", "platform": "youtube", "style_prompt": "Vídeo em câmera lenta de paisagens naturais, sons ambientes suaves, sem narração.", "thumbnail_url": "https://picsum.photos/seed/asmr/320/180", "views_estimate": 450000, "is_featured": True},
        {"title": "Receitas em 30 Segundos", "description": "Receitas rápidas e deliciosas em menos de 30 segundos. Do café da manhã ao jantar.", "category": "recipe", "platform": "tiktok", "style_prompt": "Vídeo acelerado mostrando preparo, texto grande na tela com ingredientes, música animada.", "thumbnail_url": "https://picsum.photos/seed/receitas/320/180", "views_estimate": 2100000, "is_featured": True},
        {"title": "História do Brasil em Fatos", "description": "Fatos históricos pouco conhecidos sobre o Brasil que deveriam ser ensinados nas escolas.", "category": "history", "platform": "youtube", "style_prompt": "Estilo documental com imagens de época, narração séria e fatos impressionantes.", "thumbnail_url": "https://picsum.photos/seed/historia/320/180", "views_estimate": 380000, "is_featured": True},
        {"title": "Tutorial de Pintura Digital", "description": "Aprenda técnicas profissionais de pintura digital do zero. Dicas de artistas consagrados.", "category": "tutorial", "platform": "instagram", "style_prompt": "Timelapse de pintura com dicas escritas na tela, música lo-fi relaxante.", "thumbnail_url": "https://picsum.photos/seed/pintura/320/180", "views_estimate": 520000, "is_featured": True},
        {"title": "Transformação Corporal 30 Dias", "description": "Acompanhe a jornada de transformação física em apenas 30 dias. Resultados reais.", "category": "fitness", "platform": "tiktok", "style_prompt": "Comparação antes/depois com cronômetro, música energética, texto motivacional.", "thumbnail_url": "https://picsum.photos/seed/fitness/320/180", "views_estimate": 3100000, "is_featured": True},
        {"title": "Segredos da Programação", "description": "Dicas e truques de programação que todo desenvolvedor deveria conhecer.", "category": "tech", "platform": "youtube", "style_prompt": "Tela de código com explicação em voz over, cortes rápidos, música eletrônica suave.", "thumbnail_url": "https://picsum.photos/seed/programacao/320/180", "views_estimate": 280000, "is_featured": True},
        {"title": "Momentos Fofos de Animais", "description": "Os vídeos mais fofos de animais da internet. Garantia de alegria no seu dia.", "category": "animals", "platform": "instagram", "style_prompt": "Vídeos curtos de animais com música alegre, texto divertido sobreposto.", "thumbnail_url": "https://picsum.photos/seed/animais/320/180", "views_estimate": 4500000, "is_featured": True},
    ]
    for t in templates:
        db.add(ViralTemplate(**t))
    db.flush()


def _seed_content_plans(db: Session):
    """Seed weekly content plan for the main user."""
    from models import User
    user = db.query(User).filter(User.email == "everoliver@example.com").first()
    if not user:
        return
    if db.query(ContentPlan).filter(ContentPlan.user_id == user.id).count() > 0:
        return
    plans = [
        {"user_id": user.id, "title": "Segunda-feira - Mistérios", "day_of_week": 1, "subject": "Mistérios não resolvidos", "keywords": ["mistério", "sobrenatural", "crime", "enigma"], "style": "story", "platform": "youtube"},
        {"user_id": user.id, "title": "Terça-feira - Tecnologia", "day_of_week": 2, "subject": "Curiosidades tecnológicas", "keywords": ["tecnologia", "programação", "IA", "inovação"], "style": "story", "platform": "youtube"},
        {"user_id": user.id, "title": "Quarta-feira - Motivação", "day_of_week": 3, "subject": "Histórias de superação", "keywords": ["motivação", "sucesso", "inspiração", "carreira"], "style": "story", "platform": "tiktok"},
        {"user_id": user.id, "title": "Quinta-feira - Ciência", "day_of_week": 4, "subject": "Fatos científicos curiosos", "keywords": ["ciência", "descobertas", "curiosidades", "natureza"], "style": "story", "platform": "youtube"},
        {"user_id": user.id, "title": "Sexta-feira - Receitas", "day_of_week": 5, "subject": "Receitas rápidas e fáceis", "keywords": ["receitas", "culinária", "rápido", "delicioso"], "style": "shorts", "platform": "tiktok"},
        {"user_id": user.id, "title": "Sábado - ASMR", "day_of_week": 6, "subject": "Conteúdo relaxante ASMR", "keywords": ["asmr", "relaxamento", "meditação", "sono"], "style": "asmr", "platform": "youtube"},
        {"user_id": user.id, "title": "Domingo - História", "day_of_week": 0, "subject": "História do Brasil e do Mundo", "keywords": ["história", "Brasil", "curiosidades históricas"], "style": "story", "platform": "youtube"},
    ]
    for p in plans:
        db.add(ContentPlan(**p))
    db.flush()
