from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import User
from schemas import (
    SuggestRequest, SuggestResponse, Variant,
    ScoreRequest, ScoreResponse, Issue, Gauge,
    PostPrepareRequest, PostPrepareResponse,
)
from deps import require_user
import random

router = APIRouter(prefix="/api/v1", tags=["AI Assistant"])


@router.post("/ai/suggest")
def ai_suggest(body: SuggestRequest, user: User = Depends(require_user)):
    platforms = ["youtube", "shorts", "instagram", "tiktok", "facebook", "x"]
    variants = []
    for p in platforms[:3]:
        variants.append(Variant(
            platform=p,
            title=f"{body.title} - Versão {p.title()}",
            description=f"{body.description}\n\n[otimizado para {p}]",
            tags=body.tags + [p],
        ))
    return SuggestResponse(
        title=f"{body.title} (sugestão otimizada)",
        description=f"{body.description}\n\n🔹 Dica: inclua uma chamada para ação no final.",
        tags=body.tags + ["otimizado", "viral"],
        keywords=["dica", "tutorial", "como fazer", "passo a passo"],
        variants=variants,
    )


@router.post("/ai/score")
def ai_score(body: ScoreRequest, user: User = Depends(require_user)):
    score = round(random.uniform(45, 95), 1)
    issues = []
    if score < 70:
        issues.append(Issue(id="short_title", severity="high", message="Título muito curto para SEO", fix="Adicione palavras-chave relevantes ao título"))
    if len(body.tags) < 3:
        issues.append(Issue(id="few_tags", severity="medium", message="Poucas tags podem reduzir alcance", fix="Adicione pelo menos 5 tags relacionadas"))
    if len(body.description) < 100:
        issues.append(Issue(id="short_desc", severity="medium", message="Descrição muito curta", fix="Descreva o conteúdo em pelo menos 150 caracteres"))
    return ScoreResponse(
        score=score,
        issues=issues,
        gauges=Gauge(
            readability=round(random.uniform(40, 95), 1),
            keywordDensity=round(random.uniform(30, 90), 1),
            length=round(random.uniform(50, 95), 1),
        ),
    )


@router.post("/posts/prepare")
def posts_prepare(body: PostPrepareRequest, user: User = Depends(require_user), db: Session = Depends(get_db)):
    return PostPrepareResponse(status="saved", saved=True)
