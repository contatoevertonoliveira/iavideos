import { useMemo, useState } from "react";
import { api } from "@/lib/api";
import { formatFor, validateFor } from "../platforms";
import type { PlatformKey } from "../platforms";

export type PlatformConfig = {
  provider: PlatformKey;
  social_account_id: number;
  title: string;
  description: string;
  tags: string[];
  aspect: "16:9"|"9:16"|"1:1";
  thumb_id?: string;
  subtitles_id?: string;
  schedule_at?: string; // ISO
  privacy?: "public"|"unlisted"|"private";
};

export type ComposerState = {
  video_post_id: number;
  media_asset_id: number;
  items: PlatformConfig[];
};

const useMocks = () => (import.meta.env.VITE_USE_MOCKS ?? "false") === "true";

export function useComposer(initial?: Partial<ComposerState>) {
  const mocks = useMocks();
  const [state, setState] = useState<ComposerState>({
    video_post_id: initial?.video_post_id ?? 0,
    media_asset_id: initial?.media_asset_id ?? 0,
    items: initial?.items ?? [],
  });

  const lsKey = useMemo(() => `composer_${state.video_post_id || "new"}`, [state.video_post_id]);

  const addItem = (cfg: PlatformConfig) => {
    setState((s) => ({ ...s, items: [...s.items, cfg] }));
  };
  const removeItem = (index: number) => {
    setState((s) => ({ ...s, items: s.items.filter((_, i) => i !== index) }));
  };
  const updateItem = (index: number, patch: Partial<PlatformConfig>) => {
    setState((s) => ({
      ...s,
      items: s.items.map((it, i) => (i === index ? { ...it, ...patch } : it)),
    }));
  };

  const preview = async () => {
    const body = {
      video_post_id: state.video_post_id,
      platforms: state.items.map((it) => ({
        provider: it.provider,
        social_account_id: it.social_account_id,
        ...formatFor(it.provider, { title: it.title, description: it.description, tags: it.tags }),
        aspect: it.aspect,
        thumb_id: it.thumb_id,
        subtitles_id: it.subtitles_id,
        schedule_at: it.schedule_at,
        privacy: it.privacy,
      })),
      media_asset_id: state.media_asset_id,
    };
    if (!mocks) {
      const { data } = await api.post(`/composer/preview`, body);
      return data as { previews: any[] };
    }
    // Mock: echo with simple warnings
    const previews = body.platforms.map((p) => ({
      provider: p.provider,
      social_account_id: p.social_account_id,
      title: p.title,
      description: p.description,
      tags: p.tags,
      estimated_duration: 30,
      warnings: validateFor(p.provider as PlatformKey, {
        title: p.title,
        description: p.description,
        tags: p.tags,
        aspect: p.aspect as any,
        privacy: p.privacy as any,
      }).warnings,
    }));
    return { previews };
  };

  const loadBestTimes = async (social_account_id: number, platform: PlatformKey) => {
    if (!mocks) {
      const { data } = await api.get(`/scheduler/best_times`, { params: { social_account_id, platform } });
      return data as { times: { datetime: string; confidence: number }[]; timezone: string };
    }
    const times = Array.from({ length: 5 }).map((_, i) => ({ datetime: new Date(Date.now() + (i+1)*3600_000).toISOString(), confidence: 60 + i*5 }));
    return { times, timezone: "America/Sao_Paulo" };
  };

  const saveDraft = async () => {
    const body = {
      video_post_id: state.video_post_id,
      media_asset_id: state.media_asset_id,
      platforms: state.items,
    };
    if (!mocks) {
      const { data } = await api.post(`/composer/prepare`, body);
      return data;
    }
    // Persist to localStorage as mock
    try { localStorage.setItem(lsKey, JSON.stringify(body)); } catch {}
    return { ok: true, id: Math.floor(Math.random()*10000) };
  };

  const queueAll = async () => {
    const body = {
      video_post_id: state.video_post_id,
      media_asset_id: state.media_asset_id,
      platforms: state.items,
    };
    if (!mocks) {
      const { data } = await api.post(`/composer/queue`, body);
      return data as { enqueued: { provider: string; social_account_id: number; video_post_id: number; job_id: string }[]; errors: any[] };
    }
    const enqueued = state.items.map((it, idx) => ({ provider: it.provider, social_account_id: it.social_account_id, video_post_id: state.video_post_id, job_id: `job_${Date.now()}_${idx}` }));
    return { enqueued, errors: [] };
  };

  return {
    state,
    setState,
    addItem,
    removeItem,
    updateItem,
    preview,
    loadBestTimes,
    saveDraft,
    queueAll,
    validateFor,
    formatFor,
  };
}