import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAssistant } from "./useAssistant";
import { toastError, toastSuccess } from "@/lib/toast";
import { api } from "@/lib/api";

import PromptEditor from "./components/PromptEditor";
import SuggestionsPanel from "./components/SuggestionsPanel";
import ScoreCard from "./components/ScoreCard";
import PlatformPreview from "./components/PlatformPreview";
import ComplianceChecklist from "./components/ComplianceChecklist";
import ThumbnailRanker from "./components/ThumbnailRanker";
import BestTimes from "./components/BestTimes";
import ActionBar from "./components/ActionBar";

export default function AssistantPage() {
  const { id } = useParams<{ id?: string }>();
  const vid = id ? Number(id) : null;
  const assistant = useAssistant({ video_post_id: vid ?? undefined });

  useEffect(() => {
    async function prefillFromPost() {
      if (!vid || Number.isNaN(vid)) return;
      try {
        const { data } = await api.get(`/videoposts/${vid}`);
        const vp = data || {};
        assistant.setCtx((c) => ({ ...c, video_post_id: vid, media_asset_id: vp.media_asset_id ?? null, social_account_id: (vp.social_account_id ?? c.social_account_id) || "" }));
        assistant.setDraft((d) => ({ ...d, title: vp.title || d.title, description: vp.description || d.description, tags: Array.isArray(vp.tags) ? vp.tags : d.tags }));
      } catch (err: any) {
        // Falha ao pré-preencher não é crítica; segue fluxo normal
      }
    }
    prefillFromPost();
  }, [vid]);

  return (
    <div className="p-4 space-y-6">
      <header className="flex items-center gap-3">
        <select
          className="border rounded px-2 py-1 text-sm"
          value={assistant.ctx.platform}
          onChange={(e) => assistant.setCtx({ ...assistant.ctx, platform: e.target.value as any })}
        >
          <option value="youtube">YouTube</option>
          <option value="shorts">YouTube Shorts</option>
          <option value="instagram">Instagram Reels</option>
          <option value="tiktok">TikTok</option>
          <option value="facebook">Facebook</option>
          <option value="x">X (Twitter)</option>
        </select>
        <input
          className="border rounded px-2 py-1 text-sm flex-1"
          placeholder="social_account_id"
          value={assistant.ctx.social_account_id}
          onChange={(e) => assistant.setCtx({ ...assistant.ctx, social_account_id: e.target.value })}
        />
      </header>

      <PromptEditor draft={assistant.draft} setDraft={assistant.setDraft} onSuggest={() => assistant.suggest({})} onRefine={() => assistant.suggest({ keywords: ["otimização", "CTA"] })} />
      <SuggestionsPanel lastSuggest={assistant.lastSuggest} draft={assistant.draft} adoptVariant={assistant.adoptVariant} onCopy={(txt) => navigator.clipboard.writeText(txt)} onRefine={(plat) => assistant.suggest({ keywords: plat ? [plat] : undefined })} />
      <ScoreCard score={assistant.score} onFix={(id) => assistant.applyQuickFix(id)} />
      <PlatformPreview platform={assistant.ctx.platform} draft={assistant.draft} />
      <ComplianceChecklist platform={assistant.ctx.platform} draft={assistant.draft} />

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ThumbnailRanker
          thumbnails={assistant.thumbnails}
          ranking={assistant.ranking}
          onLoad={() => assistant.fetchThumbnails()}
          onRank={(ids) => assistant.rankThumbnails(ids)}
          onSelect={(id) => {
            assistant.setThumbnails((t) => t ? { ...t, selected_id: id } : t);
          }}
        />
        <BestTimes
          bestTimes={assistant.bestTimes}
          onLoad={() => assistant.fetchBestTimes()}
        />
      </section>

      <ActionBar
        loading={assistant.loading.prepare}
        onApply={async () => {
          const res = await assistant.preparePost({ thumbnail_id: assistant.thumbnails?.selected_id });
          if (res?.saved || res?.status === "ok") toastSuccess("Aplicado ao Post");
          else toastError("Falha ao aplicar");
        }}
        onSaveDraft={() => toastSuccess("Rascunho salvo")}
        onDiscard={() => {
          assistant.setDraft({ title: "", description: "", tags: [], platformVariants: {} as any });
          toastSuccess("Rascunho descartado");
        }}
      />
    </div>
  );
}