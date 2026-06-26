"""
Router de integração com a API Google Gemini.
Usa seleção AUTOMÁTICA do modelo ideal para cada tipo de tarefa:
  - texto  → gemini-2.5-flash (rápido e barato)
  - roteiro/vídeo → gemini-3-flash-preview (raciocínio avançado)
  - áudio/voz → gemini-2.5-flash-preview-tts (TTS otimizado)
  - análise/complexo → gemini-2.5-pro (raciocínio profundo)
  - sugestões criativas → gemini-3-flash-preview (alta temperatura)
"""
import json, httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User, ApiKey
from deps import require_user
from pydantic import BaseModel
from typing import Optional, Literal

router = APIRouter(prefix="/api/v1/google", tags=["Google Gemini"])

GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta"

# ─── Mapa de modelos por tipo de tarefa ──────────────────────────────────────
# Baseado na documentação oficial:
# https://ai.google.dev/api?hl=pt-br
MODEL_MAP = {
    "text":       "gemini-2.5-flash",                    # texto rápido, uso geral
    "chat":       "gemini-3-flash-preview",              # conversas mais inteligentes
    "script":     "gemini-3-flash-preview",              # roteiro para vídeo (raciocínio)
    "video":      "gemini-3-pro-preview",                # análise/geração de vídeo
    "audio":      "gemini-2.5-flash-preview-tts",        # TTS - conversão texto→fala
    "audio_native": "gemini-2.5-flash-native-audio-preview-12-2025",  # áudio nativo
    "image":      "gemini-3-pro-image-preview",          # geração de imagens
    "reasoning":  "gemini-2.5-pro",                      # raciocínio profundo
    "creative":   "gemini-3-flash-preview",              # sugestões criativas, alta temp
    "analysis":   "gemini-2.5-pro",                      # análise viral, pesquisa
    "planning":   "gemini-3.1-pro-preview",              # planejamento estratégico
    "music":      "lyria-3-clip-preview",                # geração de música
}

# System instructions otimizadas para cada tipo de tarefa
SYSTEM_PROMPTS = {
    "chat": "Você é um assistente especializado em criação de conteúdo para redes sociais. Ajude o usuário a criar roteiros, séries, agendamentos e conteúdo viral. Seja criativo e prático. Responda em português do Brasil.",
    "script": "Você é um roteirista profissional especializado em vídeos virais. Gere roteiros completos com título, hook, cenas, CTA e hashtags. Seja detalhista. Idioma: português do Brasil.",
    "creative": "Você é um estrategista de conteúdo viral. Gere ideias criativas e inovadoras para engajamento máximo. Pense fora da caixa. Idioma: português do Brasil.",
    "analysis": "Você é um analista de tendências digitais. Analise conteúdos e sugira abordagens autorais. Seja estratégico e prático. Idioma: português do Brasil.",
    "planning": "Você é um planejador de conteúdo. Crie planos estratégicos de conteúdo para redes sociais, definindo temas, formatos e cronogramas. Idioma: português do Brasil.",
}

def select_model(task_type: str) -> str:
    """Seleciona automaticamente o modelo ideal para o tipo de tarefa."""
    return MODEL_MAP.get(task_type, "gemini-2.5-flash")

def get_system_prompt(task_type: str) -> Optional[str]:
    """Retorna o system prompt otimizado para o tipo de tarefa."""
    return SYSTEM_PROMPTS.get(task_type)

def get_generation_config(task_type: str, temperature: float = None, max_tokens: int = None):
    """Retorna a config de geração ideal para o tipo de tarefa."""
    configs = {
        "text":       {"temperature": 0.7, "maxOutputTokens": 1024},
        "chat":       {"temperature": 0.8, "maxOutputTokens": 1024},
        "script":     {"temperature": 0.8, "maxOutputTokens": 2048},
        "video":      {"temperature": 0.6, "maxOutputTokens": 2048},
        "audio":      {"temperature": 0.8, "maxOutputTokens": 2048},
        "reasoning":  {"temperature": 0.5, "maxOutputTokens": 2048},
        "creative":   {"temperature": 0.9, "maxOutputTokens": 2048},
        "analysis":   {"temperature": 0.7, "maxOutputTokens": 2048},
        "planning":   {"temperature": 0.6, "maxOutputTokens": 2048},
    }
    config = configs.get(task_type, configs["text"]).copy()
    if temperature is not None:
        config["temperature"] = temperature
    if max_tokens is not None:
        config["maxOutputTokens"] = max_tokens
    return config


def get_google_key(user: User, db: Session) -> str:
    """Busca a chave Google/Gemini ativa do usuário."""
    key = db.query(ApiKey).filter(
        ApiKey.user_id == user.id,
        ApiKey.provider.in_(["google", "gemini"]),
        ApiKey.is_active == True,
    ).first()
    if not key:
        raise HTTPException(status_code=400, detail="Nenhuma chave Google/Gemini configurada. Vá em Configurações > Chaves de API.")
    return key.api_key


def _call_gemini(api_key: str, model: str, payload: dict) -> dict:
    """Faz chamada à API Google Gemini e retorna JSON."""
    url = f"{GEMINI_BASE}/models/{model}:generateContent"
    headers = {
        "x-goog-api-key": api_key,
        "Content-Type": "application/json",
    }
    try:
        r = httpx.post(url, json=payload, headers=headers, timeout=60)
        r.raise_for_status()
        return r.json()
    except httpx.HTTPStatusError as e:
        detail = "Erro desconhecido"
        try:
            detail = e.response.json().get("error", {}).get("message", str(e))
        except:
            detail = e.response.text[:300]
        raise HTTPException(status_code=e.response.status_code, detail=f"Gemini API: {detail}")
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Gemini API: timeout após 60s")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini API: {str(e)}")


def _extract_text(response: dict) -> str:
    """Extrai o texto da resposta Gemini."""
    try:
        return response["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError):
        return json.dumps(response, ensure_ascii=False)


# ─── Schemas ──────────────────────────────────────────────────────────────────

TaskType = Literal["text", "chat", "script", "video", "audio", "reasoning", "creative", "analysis", "planning", "agent"]


class GeminiRequest(BaseModel):
    prompt: str
    task_type: TaskType = "text"
    system_instruction: Optional[str] = None
    temperature: Optional[float] = None
    max_output_tokens: Optional[int] = None
    context: Optional[dict] = None  # contexto adicional (projetos, contas, etc)


class ScriptRequest(BaseModel):
    topic: str
    style: str = "story"
    duration_secs: int = 60
    language: str = "pt-BR"
    niche: Optional[str] = None


class SuggestionsRequest(BaseModel):
    niche: Optional[str] = None
    count: int = 5


class AgentRequest(BaseModel):
    """
    Comando único do usuário. O sistema:
    1. Interpreta a intenção (roteiro, sugestão, análise, agendamento, etc)
    2. Seleciona o modelo Gemini ideal
    3. Gera o conteúdo
    4. Executa ações no backend (criar série, agendar, etc)
    """
    command: str
    context: Optional[dict] = None


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/validate")
def validate_key(user: User = Depends(require_user), db: Session = Depends(get_db)):
    """Valida se a chave Google funciona, listando os modelos disponíveis."""
    api_key = get_google_key(user, db)
    url = f"{GEMINI_BASE}/models"
    headers = {"x-goog-api-key": api_key}
    try:
        r = httpx.get(url, headers=headers, timeout=15)
        r.raise_for_status()
        data = r.json()
        models = []
        for m in data.get("models", []):
            name = m.get("name", "").replace("models/", "")
            if "gemini" in name or "lyria" in name:
                models.append(name)
        return {
            "valid": True,
            "models": models[:15],
            "total_available": len(models),
        }
    except httpx.HTTPStatusError as e:
        detail = "Chave inválida ou sem permissão"
        try:
            detail = e.response.json().get("error", {}).get("message", str(e))
        except:
            pass
        raise HTTPException(status_code=400, detail=f"Falha na validação: {detail}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro de conexão: {str(e)}")


@router.post("/generate")
def gemini_generate(body: GeminiRequest, user: User = Depends(require_user), db: Session = Depends(get_db)):
    """
    Gera conteúdo com o modelo ideal AUTOMATICAMENTE selecionado.
    
    O sistema escolhe o modelo baseado no task_type:
    - text       → gemini-2.5-flash (rápido)
    - chat       → gemini-3-flash-preview (conversas inteligentes)
    - script     → gemini-3-flash-preview (roteiros)
    - video      → gemini-3-pro-preview (análise de vídeo)
    - audio      → gemini-2.5-flash-preview-tts (TTS)
    - reasoning  → gemini-2.5-pro (raciocínio profundo)
    - creative   → gemini-3-flash-preview (criatividade)
    - analysis   → gemini-2.5-pro (análise)
    - planning   → gemini-3.1-pro-preview (planejamento)
    """
    api_key = get_google_key(user, db)
    model = select_model(body.task_type)
    gen_config = get_generation_config(body.task_type, body.temperature, body.max_output_tokens)

    payload = {
        "contents": [{"parts": [{"text": body.prompt}]}],
        "generationConfig": gen_config,
    }

    # System instruction hierarquia: request > task_type default > nenhum
    sys_instr = body.system_instruction or get_system_prompt(body.task_type)
    if sys_instr:
        payload["systemInstruction"] = {"parts": [{"text": sys_instr}]}

    resp = _call_gemini(api_key, model, payload)
    return {
        "response": _extract_text(resp),
        "model_used": model,
        "task_type": body.task_type,
        "usage": resp.get("usageMetadata", {}),
    }


@router.post("/chat")
def gemini_chat(body: GeminiRequest, user: User = Depends(require_user), db: Session = Depends(get_db)):
    """Chat com Gemini. task_type padrão = 'chat' → usa gemini-3-flash-preview."""
    if body.task_type == "text":
        body.task_type = "chat"  # override para chat ter modelo melhor
    return gemini_generate(body, user, db)


@router.post("/generate-script")
def generate_script(body: ScriptRequest, user: User = Depends(require_user), db: Session = Depends(get_db)):
    """Gera roteiro completo para vídeo usando gemini-3-flash-preview (task_type='script')."""
    api_key = get_google_key(user, db)
    model = select_model("script")

    duration_guide = {
        15: "15 segundos (super curto - shorts/reels)",
        30: "30 segundos",
        60: "1 minuto",
        180: "3 minutos",
        300: "5 minutos",
        600: "10 minutos",
    }
    dur_label = duration_guide.get(body.duration_secs, f"{body.duration_secs} segundos")

    style_prompts = {
        "story": "Crie uma história envolvente e narrativa, com gancho inicial, desenvolvimento e conclusão impactante.",
        "motivational": "Crie um discurso motivacional inspirador, com frases de impacto e histórias de superação.",
        "educational": "Crie um conteúdo educativo, explicando conceitos de forma clara e didática.",
        "asmr": "Crie um roteiro para conteúdo ASMR relaxante, com descrições sensoriais e textuais suaves.",
        "shorts": "Crie um script dinâmico e acelerado para Shorts/TikTok, com gancho nos primeiros 3 segundos.",
    }
    style_guide = style_prompts.get(body.style, style_prompts["story"])

    prompt = f"""Você é um roteirista profissional especializado em vídeos virais para redes sociais.

ASSUNTO: {body.topic}
ESTILO: {body.style}
DURAÇÃO: {dur_label}
NICHO: {body.niche or "Geral"}
IDIOMA: {body.language}

{style_guide}

Por favor, gere um roteiro completo contendo:
1. TÍTULO DO VÍDEO (impactante, com gancho)
2. HOOK (gancho inicial - primeira frase que prende a atenção)
3. ROTEIRO (texto completo narrado, dividido em cenas/blocos)
4. CALL TO ACTION (frase final de engajamento)
5. HASHTAGS SUGERIDAS (5-10 hashtags relevantes)
6. TIPO DE IMAGEM/VISUAL SUGERIDO PARA CADA CENA

Formate o roteiro de forma clara e bem estruturada."""

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": get_generation_config("script"),
        "systemInstruction": {"parts": [{"text": get_system_prompt("script")}]},
    }
    resp = _call_gemini(api_key, model, payload)
    return {
        "script": _extract_text(resp),
        "topic": body.topic,
        "style": body.style,
        "duration_secs": body.duration_secs,
        "model_used": model,
        "usage": resp.get("usageMetadata", {}),
    }


@router.post("/generate-suggestions")
def generate_suggestions(body: SuggestionsRequest, user: User = Depends(require_user), db: Session = Depends(get_db)):
    """Gera sugestões de temas virais usando gemini-3-flash-preview (task_type='creative')."""
    api_key = get_google_key(user, db)
    model = select_model("creative")

    niche_instruction = f"no nicho de {body.niche}" if body.niche else "em alta atualmente"

    prompt = f"""Você é um estrategista de conteúdo viral para redes sociais.

Gere {body.count} ideias de vídeos virais {niche_instruction}.

Para cada ideia, forneça:
1. Título chamativo (com gancho)
2. Descrição do conceito (2-3 frases)
3. Estilo recomendado (story/motivational/educational/asmr/shorts)
4. Por que tem potencial viral

Liste as {body.count} ideias de forma numerada e clara."""

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": get_generation_config("creative"),
        "systemInstruction": {"parts": [{"text": get_system_prompt("creative")}]},
    }
    resp = _call_gemini(api_key, model, payload)
    return {
        "suggestions": _extract_text(resp),
        "niche": body.niche or "geral",
        "count": body.count,
        "model_used": model,
    }


@router.post("/copy-viral-style")
def copy_viral_style(body: GeminiRequest, user: User = Depends(require_user), db: Session = Depends(get_db)):
    """Analisa trend viral e sugere versão autoral usando gemini-2.5-pro (task_type='analysis')."""
    api_key = get_google_key(user, db)
    model = select_model("analysis")

    payload = {
        "contents": [{"parts": [{"text": f"""Você é um analista de trends virais.

Analise o seguinte conteúdo/tema viral e sugira como podemos recriá-lo de forma autoral:

TEMA/CONTEÚDO: {body.prompt}

Por favor, forneça:
1. ANÁLISE DO QUE TORNA ESSE CONTEÚDO VIRAL
2. NOVA ABORDAGEM AUTORAL (como transformar mantendo a essência)
3. ROTEIRO ALTERNATIVO (versão adaptada com outra 'skin')
4. DIFERENCIAIS DA NOSSA VERSÃO
5. PÚBLICO-ALVO RECOMENDADO

Seja criativo e estratégico."""}]}],
        "generationConfig": get_generation_config("analysis"),
        "systemInstruction": {"parts": [{"text": get_system_prompt("analysis")}]},
    }
    resp = _call_gemini(api_key, model, payload)
    return {
        "analysis": _extract_text(resp),
        "model_used": model,
    }


@router.get("/models")
def list_gemini_models(user: User = Depends(require_user), db: Session = Depends(get_db)):
    """Lista os modelos Gemini disponíveis com suas capacidades."""
    api_key = get_google_key(user, db)
    url = f"{GEMINI_BASE}/models"
    headers = {"x-goog-api-key": api_key}
    try:
        r = httpx.get(url, headers=headers, timeout=15)
        r.raise_for_status()
        data = r.json()
        models = []
        for m in data.get("models", []):
            name = m.get("name", "").replace("models/", "")
            models.append({
                "id": name,
                "display_name": m.get("displayName", name),
                "description": m.get("description", ""),
                "input_token_limit": m.get("inputTokenLimit"),
                "output_token_limit": m.get("outputTokenLimit"),
            })
        return {
            "models": models[:20],
            "total": len(models),
            "auto_selection": {k: v for k, v in sorted(MODEL_MAP.items())},
        }
    except httpx.HTTPStatusError as e:
        detail = "Chave inválida"
        try:
            detail = e.response.json().get("error", {}).get("message", str(e))
        except:
            pass
        raise HTTPException(status_code=400, detail=f"Falha: {detail}")


@router.post("/agent")
def gemini_agent(body: AgentRequest, user: User = Depends(require_user), db: Session = Depends(get_db)):
    """
    Agente inteligente: interpreta o comando do usuário, seleciona o modelo ideal
    e executa ações no backend quando necessário.
    
    O sistema analisa o comando e decide:
    - Se é roteiro → gemini-3-flash-preview + cria projeto
    - Se é sugestão → gemini-3-flash-preview (creative)
    - Se é análise viral → gemini-2.5-pro
    - Se é agendamento → gemini-3.1-pro-preview + agenda no backend
    - Se é plano de conteúdo → gemini-3.1-pro-preview
    - Se é chat geral → gemini-3-flash-preview
    """
    api_key = get_google_key(user, db)
    cmd = body.command.lower()
    ctx = body.context or {}

    # 1. Detecta intenção
    intent = "chat"
    if any(w in cmd for w in ["roteiro", "script", "crie um vídeo", "crie uma história", "escreva um roteiro"]):
        intent = "script"
    elif any(w in cmd for w in ["sugestão", "sugestao", "ideia", "inspiração", "o que postar", "o que criar"]):
        intent = "creative"
    elif any(w in cmd for w in ["analise", "analisar", "viral", "tendência", "trend", "cópia", "copiar"]):
        intent = "analysis"
    elif any(w in cmd for w in ["plano", "planejar", "planejamento", "cronograma", "semanal", "agenda", "planner"]):
        intent = "planning"
    elif any(w in cmd for w in ["áudio", "audio", "voz", "narração", "narracao", "tts"]):
        intent = "audio"

    model = select_model(intent)
    gen_config = get_generation_config(intent)
    sys_instr = get_system_prompt(intent)

    # 2. Monta prompt enriquecido com contexto
    context_str = ""
    if ctx.get("projects_count"):
        context_str += f"\nO usuário tem {ctx['projects_count']} projetos criados."
    if ctx.get("accounts_count"):
        context_str += f"\nO usuário tem {ctx['accounts_count']} contas sociais conectadas."
    if ctx.get("active_series"):
        context_str += f"\nO usuário tem {ctx['active_series']} séries ativas."
    if ctx.get("content_plans"):
        context_str += f"\nPlano de conteúdo semanal configurado."

    prompt = body.command
    if context_str:
        prompt = f"{body.command}\n\nCONTEXTO DO USUÁRIO:{context_str}"

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": gen_config,
    }
    if sys_instr:
        payload["systemInstruction"] = {"parts": [{"text": sys_instr}]}

    resp = _call_gemini(api_key, model, payload)
    response_text = _extract_text(resp)

    # 3. Ações automáticas
    actions = []
    if intent == "script":
        # Extrai um título do roteiro para criar projeto
        import re
        title_match = re.search(r"TÍTULO[:\s]*(.+?)(?:\n|$)", response_text)
        if title_match:
            from models import VideoProject
            proj = VideoProject(
                user_id=user.id,
                title=title_match.group(1).strip()[:100],
                prompt=body.command,
                script_text=response_text[:5000],
                style="story",
                status="draft",
            )
            db.add(proj)
            db.commit()
            actions.append({"action": "create_project", "project_id": proj.id, "title": proj.title})

    return {
        "response": response_text,
        "model_used": model,
        "task_type": intent,
        "actions": actions,
        "usage": resp.get("usageMetadata", {}),
    }


@router.post("/suggest")
def gemini_suggest(body: GeminiRequest, user: User = Depends(require_user), db: Session = Depends(get_db)):
    """
    Sugestões inteligentes baseadas no contexto do usuário.
    task_type='creative' → gemini-3-flash-preview (alta temperatura)
    """
    if body.task_type == "text":
        body.task_type = "creative"
    return gemini_generate(body, user, db)


class WorkflowRequest(BaseModel):
    """Solicitação para o fluxo guiado de criação de vídeo."""
    step: str  # "start" | "configure" | "generate" | "confirm"
    data: dict = {}  # dados acumulados do fluxo
    context: Optional[dict] = None


WORKFLOW_PROMPT = """Você é um assistente de criação de vídeos que guia o usuário passo a passo.

REGRAS:
1. SEMPRE responda em português do Brasil
2. Mantenha o tom amigável e encorajador
3. Faça APENAS UMA pergunta por vez
4. Confirme cada resposta antes de prosseguir

FLUXO DE CRIAÇÃO:
- Passo 1 (tema): Pergunte QUAL É O TEMA DO VÍDEO
- Passo 2 (formato): Pergunte se é Shorts/Reels (até 60s), Vídeo Padrão (1-5min), ou Longo (5-10min)
- Passo 3 (estilo): Pergunte o estilo: História (story), Motivacional, Educativo, ASMR, ou Humor
- Passo 4 (nicho): Pergunte qual o nicho/assunto específico
- Passo 5 (público): Pergunte qual o público-alvo
- Passo 6 (gerar): GERE o roteiro completo com título, hook, cenas, CTA e hashtags
- Passo 7 (finalizar): Informe que o vídeo foi criado e pergunte se quer assistir

A cada resposta do usuário, valide e confirme antes de ir para o próximo passo."""


class WorkflowStep(BaseModel):
    step: str
    field: str = ""
    value: str = ""
    next_step: str = ""


@router.post("/workflow")
def gemini_workflow(body: WorkflowRequest, user: User = Depends(require_user), db: Session = Depends(get_db)):
    """Fluxo guiado de criação — 100% determinístico, Gemini só gera texto."""
    api_key = get_google_key(user, db)
    model = "gemini-2.5-flash"
    data = body.data or {}
    step = body.step or "configure"
    user_input = (data.get("user_input") or "").strip()

    # ─── Campos do fluxo, na ordem ────────────────────────────────────────
    FIELDS = [
        ("theme", "tema do vídeo"),
        ("format_type", "formato (Shorts/Reels de até 60s, Vídeo Padrão 1-5min, Longo 5-10min)"),
        ("style", "estilo (História, Motivacional, Educativo, ASMR, Humor)"),
        ("niche", "nicho / assunto específico"),
        ("target_audience", "público-alvo"),
    ]
    # current_index controla qual campo estamos perguntando (0-based)
    ci = data.get("current_index", 0)

    # ─── Se veio input, armazena no campo atual e avança ──────────────────
    if user_input and ci < len(FIELDS):
        field_name = FIELDS[ci][0]
        data[field_name] = user_input
        ci += 1
        data["current_index"] = ci

    # ─── Monta contexto atual para o prompt ───────────────────────────────
    context_parts = []
    for fname, _ in FIELDS:
        val = data.get(fname, "")
        if val:
            context_parts.append(f"{fname}: {val}")
    context_str = "\n".join(context_parts) if context_parts else "(nenhum dado ainda)"

    # ─── Se todos os campos preenchidos → gerar roteiro ───────────────────
    if ci >= len(FIELDS):
        prompt = f"""Gere um ROTEIRO COMPLETO em português do Brasil.

Dados do vídeo:
{context_str}

Formato obrigatório:

## 🎬 TÍTULO
[título criativo]

## 🎯 HOOK (primeiros 3-5 segundos)
[texto que prende a atenção]

## 📝 ROTEIRO (dividido em cenas)
[Cena 1: descrição do visual + narração]
[Cena 2: descrição do visual + narração]
...

## 🎯 CALL TO ACTION
[o que o espectador deve fazer]

## #️⃣ HASHTAGS
[10 hashtags relevantes]

Após gerar o roteiro, termine com: ✅ Roteiro gerado! Quer assistir à prévia?"
"""
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.9, "maxOutputTokens": 2048},
            "systemInstruction": {"parts": [{"text": "Você é um roteirista profissional de vídeos. Gere roteiros criativos e bem estruturados em português do Brasil. Seja direto, sem rodeios."}],},
        }
        resp = _call_gemini(api_key, model, payload)
        response_text = _extract_text(resp)
        next_step = "generate_complete"
        ci = len(FIELDS)  # já está no final

    else:
        # ─── Pergunta o campo atual ────────────────────────────────────────
        field_name, field_question = FIELDS[ci]
        existing = data.get(field_name, "")

        if existing and user_input:
            # Já temos o valor, confirmar e seguir
            prompt_instr = f"Confirme rapidamente e faça a PRÓXIMA pergunta."
        elif existing and not user_input:
            prompt_instr = f"Você já sabe o {field_question} ('{existing}'). Confirme e faça a próxima pergunta."
        elif not existing and not user_input:
            prompt_instr = f"Faça a pergunta sobre {field_question}. Seja direto, uma frase só."
        else:
            prompt_instr = f"Confirme que '{user_input}' é o {field_question} e depois faça a próxima pergunta."

        prompt = f"""Você é um assistente de criação de vídeos.

Dados já preenchidos:
{context_str}

Campo atual sendo perguntado: {field_question}

{prompt_instr}

IMPORTANTE: 
- Faça EXATAMENTE UMA pergunta por vez.
- Seja breve e amigável (máximo 3 frases).
- NÃO dê sugestões longas, NÃO liste opções enormes.
- NÃO use listas com asteriscos ou numeração além da pergunta.
"""

        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.7, "maxOutputTokens": 400},
            "systemInstruction": {"parts": [{"text": "Você é um assistente amigável de criação de vídeos. Faça UMA pergunta por vez, de forma direta e simpática. Máximo 3 frases. NUNCA dê sugestões longas ou listas."}],},
        }
        resp = _call_gemini(api_key, model, payload)
        response_text = _extract_text(resp)
        next_step = "configure"

    return {
        "response": response_text,
        "model_used": model,
        "step": step,
        "next_step": next_step,
        "data": data,
        "progress": {
            "current_index": ci,
            "total": len(FIELDS),
            "fields": {f[0]: bool(data.get(f[0])) for f in FIELDS},
        },
    }


@router.get("/model-map")
def get_model_map():
    """Retorna o mapa de modelos por tipo de tarefa."""
    return {
        "auto_selection": MODEL_MAP,
        "system_prompts": {k: v[:80] + "..." for k, v in SYSTEM_PROMPTS.items()},
        "note": "O sistema seleciona automaticamente o modelo ideal para cada tipo de tarefa.",
    }


import os, base64, uuid
from fastapi.responses import FileResponse
from models import VideoProject

IMAGES_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "generated", "images")
os.makedirs(IMAGES_DIR, exist_ok=True)

IMAGE_ASPECT_MAP = {
    "16:9": "16:9",
    "9:16": "9:16",
    "1:1": "1:1",
    "4:3": "4:3",
    "3:2": "3:2",
}
IMAGEN_MODEL = "imagen-3.0-generate-001"


@router.post("/generate-image")
def generate_image(
    user: User = Depends(require_user),
    db: Session = Depends(get_db),
    prompt: str = "",
    style: str = "realistic",
    aspect: str = "16:9",
    count: int = 1,
):
    """Gera imagens via Google Imagen API e salva na biblioteca."""
    api_key = get_google_key(user, db)
    if not prompt or len(prompt) < 3:
        raise HTTPException(status_code=400, detail="Prompt inválido")

    count = max(1, min(count, 4))
    aspect_ratio = IMAGE_ASPECT_MAP.get(aspect, "16:9")

    style_prompts = {
        "realistic": "Fotografia realista",
        "cinematic": "Estilo cinematográfico, iluminação dramática",
        "anime": "Estilo anime japonês",
        "digital-art": "Arte digital moderna",
        "oil-painting": "Pintura a óleo",
        "3d-render": "Render 3D fotorrealista",
        "pixel-art": "Pixel art estilo retrô 8-bit",
        "sketch": "Esboço a lápis",
    }
    style_prefix = style_prompts.get(style, "Fotografia realista")
    full_prompt = f"{style_prefix}. {prompt}"

    url = f"{GEMINI_BASE}/models/{IMAGEN_MODEL}:predict"
    headers = {"x-goog-api-key": api_key, "Content-Type": "application/json"}
    payload = {
        "instances": [{"prompt": full_prompt}],
        "parameters": {
            "sampleCount": count,
            "aspectRatio": aspect_ratio,
        },
    }

    try:
        resp = httpx.post(url, json=payload, headers=headers, timeout=60)
        resp.raise_for_status()
        data = resp.json()
    except httpx.HTTPStatusError as e:
        detail = "Erro na API de imagens"
        try:
            detail = e.response.json().get("error", {}).get("message", str(e))
        except:
            detail = str(e)
        raise HTTPException(status_code=400, detail=f"Imagem falhou: {detail}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro: {str(e)}")

    predictions = data.get("predictions", [])
    if not predictions:
        raise HTTPException(status_code=500, detail="Nenhuma imagem gerada")

    results = []
    for i, pred in enumerate(predictions):
        b64 = pred.get("bytesBase64Encoded") or pred.get("image", {}).get("bytesBase64Encoded", "")
        if not b64:
            continue
        filename = f"img_{uuid.uuid4().hex[:12]}.png"
        filepath = os.path.join(IMAGES_DIR, filename)
        img_bytes = base64.b64decode(b64)
        with open(filepath, "wb") as f:
            f.write(img_bytes)

        image_url = f"/api/v1/google/image-file/{filename}"

        project = VideoProject(
            user_id=user.id,
            title=f"Imagem: {prompt[:40]}",
            prompt=prompt,
            style=style,
            status="completed",
            thumbnail_url=image_url,
            preview_url=image_url,
            niche="ai-image",
        )
        db.add(project)
        db.commit()
        db.refresh(project)

        results.append({
            "id": project.id,
            "url": image_url,
            "title": project.title,
            "prompt": prompt,
            "style": style,
            "aspect": aspect,
        })

    return {"ok": True, "count": len(results), "images": results}


@router.get("/image-file/{filename}")
def serve_image(filename: str):
    """Serve imagens geradas."""
    filepath = os.path.join(IMAGES_DIR, filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Imagem não encontrada")
    return FileResponse(filepath, media_type="image/png")
