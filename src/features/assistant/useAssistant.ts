import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";

type Platform = "youtube" | "shorts" | "instagram" | "tiktok" | "facebook" | "x";

export type AssistantContext = {
  social_account_id: string;
  platform: Platform;
  video_post_id?: number | null;
  media_asset_id?: number | null;
};

export type Draft = {
  title: string;
  description: string;
  tags: string[];
  platformVariants: Record<Platform, { title: string; description: string; tags: string[] } | undefined>;
};

export type SuggestResp = {
  title: string;
  description: string;
  tags: string[];
  keywords: string[];
  variants: { platform: Platform; title: string; description: string; tags: string[] }[];
};

export type ScoreResp = {
  score: number;
  issues: { id: string; severity: "low" | "medium" | "high"; message: string; fix?: string }[];
  gauges: { readability: number; keywordDensity: number; length: number };
};

const useMocks = () => {
  return (import.meta.env.VITE_USE_MOCKS ?? "false") === "true";
};

function clamp(n: number, min = 0, max = 100) { return Math.max(min, Math.min(max, n)); }

export function useAssistant(initial?: Partial<AssistantContext>) {
  const [ctx, setCtx] = useState<AssistantContext>({
    social_account_id: initial?.social_account_id || "",
    platform: (initial?.platform || "youtube") as Platform,
    video_post_id: initial?.video_post_id ?? null,
    media_asset_id: initial?.media_asset_id ?? null,
  });
  const [draft, setDraft] = useState<Draft>({ title: "", description: "", tags: [], platformVariants: {} as any });
  const [score, setScore] = useState<ScoreResp | null>(null);
  const [lastSuggest, setLastSuggest] = useState<SuggestResp | null>(null);
  const [thumbnails, setThumbnails] = useState<{ items: { id: string; url: string; ts: string }[]; selected_id?: string } | null>(null);
  const [ranking, setRanking] = useState<{ id: string; score: number }[]>([]);
  const [bestTimes, setBestTimes] = useState<{ times: { datetime: string; confidence: number }[]; timezone: string } | null>(null);
  const [loading, setLoading] = useState<{ suggest?: boolean; score?: boolean; thumbs?: boolean; rank?: boolean; times?: boolean; prepare?: boolean }>({});
  const mocks = useMocks();

  const lsKey = useMemo(() => `assistant_draft_${ctx.video_post_id ?? "new"}`, [ctx.video_post_id]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(lsKey);
      if (raw) setDraft(JSON.parse(raw));
    } catch {}
  }, [lsKey]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      try { localStorage.setItem(lsKey, JSON.stringify(draft)); } catch {}
    }, 1000);
    return () => window.clearTimeout(t);
  }, [draft, lsKey]);

  async function suggest(payload: { transcript?: string; keywords?: string[] }) {
    setLoading((l) => ({ ...l, suggest: true }));
    try {
      if (!mocks) {
        const { data } = await api.post("/ai/suggest", {
          social_account_id: ctx.social_account_id,
          platform: ctx.platform,
          title: draft.title,
          description: draft.description,
          tags: draft.tags,
          transcript: payload.transcript,
          keywords: payload.keywords,
        });
        const resp = data as SuggestResp;
        setLastSuggest(resp);
        applySuggestion(resp);
        return resp;
      } else {
        const baseTitle = draft.title || "Novo vídeo irresistível";
        const baseDesc = draft.description || "Descrição envolvente com CTA e valor claro.";
        const baseTags = draft.tags.length ? draft.tags : ["tutorial", "dicas", "2025"];
        const variants: SuggestResp["variants"] = ["youtube", "instagram", "tiktok", "shorts"].map((p) => ({
          platform: p as Platform,
          title: `${baseTitle} (${p})`,
          description: `${baseDesc} – otimizado para ${p}.`,
          tags: baseTags.slice(0, 3),
        }));
        const resp: SuggestResp = {
          title: `${baseTitle} • atualizado`,
          description: `${baseDesc} Atualize com palavras-chave e CTA forte.`,
          tags: baseTags,
          keywords: ["seo", "engajamento", "otimização"],
          variants,
        };
        setLastSuggest(resp);
        applySuggestion(resp);
        return resp;
      }
    } finally {
      setLoading((l) => ({ ...l, suggest: false }));
    }
  }

  function applySuggestion(s: SuggestResp) {
    setDraft((d) => ({
      ...d,
      title: s.title,
      description: s.description,
      tags: s.tags,
      platformVariants: s.variants.reduce((acc, v) => { acc[v.platform] = { title: v.title, description: v.description, tags: v.tags }; return acc; }, {} as Draft["platformVariants"]),
    }));
  }

  async function runScore() {
    setLoading((l) => ({ ...l, score: true }));
    try {
      if (!mocks) {
        const { data } = await api.post("/ai/score", {
          title: draft.title,
          description: draft.description,
          tags: draft.tags,
          platform: ctx.platform,
        });
        setScore(data as ScoreResp);
      } else {
        const len = draft.title.length + draft.description.length + draft.tags.join(",").length;
        const readability = clamp(100 - Math.round((draft.description.split(" ").filter((w) => w.length > 12).length / Math.max(1, draft.description.split(" ").length)) * 100));
        const keywordDensity = clamp(Math.round(((lastSuggest?.keywords?.length ?? 3)) * 15));
        const length = clamp(Math.round(Math.min(100, (len / 1000) * 100)));
        const score = Math.round((readability + keywordDensity + length) / 3);
        const issues: ScoreResp["issues"] = [];
        if (draft.title.length > 100) issues.push({ id: "title-length", severity: "medium", message: "Título excede 100 caracteres", fix: "Encurtar título" });
        if (draft.description.length < 60) issues.push({ id: "desc-short", severity: "low", message: "Descrição muito curta", fix: "Adicionar mais contexto e CTA" });
        setScore({ score, issues, gauges: { readability, keywordDensity, length } });
      }
    } finally {
      setLoading((l) => ({ ...l, score: false }));
    }
  }

  function applyQuickFix(issueId: string) {
    if (issueId === "title-length") {
      setDraft((d) => ({ ...d, title: d.title.slice(0, 100) }));
    } else if (issueId === "desc-short") {
      setDraft((d) => ({ ...d, description: (d.description + "\n\n" + "Adicione valor, CTA e palavras-chave.").slice(0, 5000) }));
    }
  }

  async function fetchThumbnails() {
    if (!ctx.media_asset_id) return;
    setLoading((l) => ({ ...l, thumbs: true }));
    try {
      if (!mocks) {
        const { data } = await api.get(`/thumbnails`, { params: { media_asset_id: ctx.media_asset_id } });
        setThumbnails(data);
      } else {
        const items = Array.from({ length: 6 }).map((_, i) => ({ id: `${i+1}`, url: `https://picsum.photos/seed/thumb${i}/320/180`, ts: new Date(Date.now() - i * 60000).toISOString() }));
        setThumbnails({ items, selected_id: items[0].id });
      }
    } finally {
      setLoading((l) => ({ ...l, thumbs: false }));
    }
  }

  async function rankThumbnails(candidateIds: string[]) {
    if (!ctx.media_asset_id) return;
    setLoading((l) => ({ ...l, rank: true }));
    try {
      if (!mocks) {
        const { data } = await api.post(`/thumbnails/rank`, {
          media_asset_id: ctx.media_asset_id,
          candidate_ids: candidateIds,
          context: { title: draft.title, description: draft.description, tags: draft.tags },
        });
        setRanking(data?.ranking ?? []);
      } else {
        const ranking = candidateIds.map((id, idx) => ({ id, score: clamp(90 - idx * 10) }));
        setRanking(ranking);
      }
    } finally {
      setLoading((l) => ({ ...l, rank: false }));
    }
  }

  async function fetchBestTimes() {
    if (!ctx.social_account_id) return;
    setLoading((l) => ({ ...l, times: true }));
    try {
      if (!mocks) {
        const { data } = await api.get(`/scheduler/best_times`, { params: { social_account_id: ctx.social_account_id, platform: ctx.platform } });
        setBestTimes(data);
      } else {
        const times = Array.from({ length: 6 }).map((_, i) => ({ datetime: new Date(Date.now() + (i+1) * 3600_000).toISOString(), confidence: clamp(50 + i * 8) }));
        setBestTimes({ times, timezone: "America/Sao_Paulo" });
      }
    } finally {
      setLoading((l) => ({ ...l, times: false }));
    }
  }

  async function preparePost(payload: { thumbnail_id?: string }) {
    if (!ctx.video_post_id) return { ok: false };
    setLoading((l) => ({ ...l, prepare: true }));
    try {
      if (!mocks) {
        const { data } = await api.post(`/posts/prepare`, {
          video_post_id: ctx.video_post_id,
          title: draft.title,
          description: draft.description,
          tags: draft.tags,
          platform_profiles: draft.platformVariants,
          thumbnail_id: payload.thumbnail_id,
        });
        return data;
      } else {
        return { status: "ok", saved: true };
      }
    } finally {
      setLoading((l) => ({ ...l, prepare: false }));
    }
  }

  function adoptVariant(platform: Platform) {
    const v = draft.platformVariants[platform];
    if (!v) return;
    setDraft((d) => ({ ...d, title: v.title, description: v.description, tags: v.tags }));
  }

  return {
    ctx, setCtx,
    draft, setDraft,
    score,
    lastSuggest,
    thumbnails, ranking, bestTimes,
    loading,
    suggest, runScore, fetchThumbnails, rankThumbnails, fetchBestTimes, preparePost,
    adoptVariant,
    applyQuickFix,
  };
}