import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useComposer } from "./hooks/useComposer";
import SummaryCard from "./components/SummaryCard";
import { api } from "@/lib/api";
import type { PlatformKey } from "./platforms";

export default function ComposerReview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const composer = useComposer();
  const [accounts, setAccounts] = useState<Array<{ id: number; provider: PlatformKey; display_name: string; scopes?: string[] }>>([]);
  const mocks = (import.meta.env.VITE_USE_MOCKS ?? "false") === "true";

  useEffect(() => {
    async function loadAccounts() {
      if (!mocks) {
        const { data } = await api.get(`/accounts`);
        setAccounts(Array.isArray(data) ? data : []);
      } else {
        setAccounts([
          { id: 1, provider: "youtube", display_name: "YouTube A", scopes: ["youtube.upload"] },
          { id: 2, provider: "shorts", display_name: "YouTube B", scopes: ["youtube.upload"] },
          { id: 3, provider: "instagram", display_name: "Instagram 1", scopes: ["instagram.content.publish"] },
          { id: 4, provider: "tiktok", display_name: "TikTok 1", scopes: [] },
        ]);
      }
    }
    loadAccounts();
  }, [mocks]);

  const REQUIRED_SCOPES: Record<PlatformKey, string[]> = {
    youtube: ["youtube.upload"],
    shorts: ["youtube.upload"],
    instagram: ["instagram.content.publish"],
    tiktok: ["tiktok.content.publish"],
    facebook: ["facebook.pages.manage_posts"],
    x: ["x.tweet.write"],
  };

  const missingScopes = useMemo(() => {
    return composer.state.items.map((it) => {
      const acc = accounts.find((a) => a.id === it.social_account_id && a.provider === it.provider);
      const need = REQUIRED_SCOPES[it.provider] || [];
      const have = acc?.scopes || [];
      const miss = need.filter((s) => !have.includes(s));
      return { item: it, account: acc, missing: miss };
    });
  }, [composer.state.items, accounts]);

  const onQueue = async () => {
    const blocking = missingScopes.some((m) => m.missing.length > 0);
    if (blocking) return;
    const res = await composer.queueAll();
    const jid = (res.enqueued?.[0]?.job_id) || id || "new";
    navigate(`/composer/${jid}/summary`, { state: res });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Revisão final</h2>
      <SummaryCard items={composer.state.items} />
      <div className="space-y-2">
        {missingScopes.map((m, idx) => (
          m.missing.length > 0 ? (
            <div key={idx} className="border border-yellow-400/30 rounded p-3 text-sm">
              <div className="font-medium">Escopo ausente para {m.account?.display_name || `conta #${m.item.social_account_id}`} ({m.item.provider})</div>
              <div className="text-yellow-300">Necessário: {m.missing.join(", ")}</div>
              <div className="mt-2">
                <a className="px-2 py-1 rounded bg-white/10 border border-white/20 text-xs" href="/accounts">Reautorizar conta com escopos</a>
              </div>
            </div>
          ) : null
        ))}
      </div>
      <div className="space-y-3">
        {composer.state.items.map((it, index) => (
          <div key={`edit-${index}`} className="border rounded p-3">
            <div className="text-xs text-white/70 mb-2">Editar inline</div>
            <input className="w-full border rounded px-2 py-1 text-sm bg-transparent mb-2" value={it.title} onChange={(e)=>composer.updateItem(index, { title: e.target.value })} placeholder="Título" />
            <textarea className="w-full border rounded px-2 py-1 text-sm bg-transparent mb-2" value={it.description} onChange={(e)=>composer.updateItem(index, { description: e.target.value })} placeholder="Descrição" />
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <button className="px-3 py-2 rounded bg-white/10 border border-white/20" onClick={()=>navigate(-1)}>Voltar</button>
        <button className="px-3 py-2 rounded bg-green-600 text-white disabled:opacity-50" disabled={missingScopes.some((m)=>m.missing.length>0)} onClick={onQueue}>Enfileirar publicações</button>
      </div>
    </div>
  );
}