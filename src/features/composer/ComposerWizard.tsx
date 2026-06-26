import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useComposer } from "./hooks/useComposer";
import AccountSelector from "./components/AccountSelector";
import PlatformTabs from "./components/PlatformTabs";
import PlatformForm from "./components/PlatformForm";
import type { PlatformKey } from "./platforms";

export default function ComposerWizard() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const video_post_id = Number(params.get("video_post_id") || 0);
  const media_asset_id = Number(params.get("media_asset_id") || 0);
  const composer = useComposer({ video_post_id, media_asset_id });
  const [active, setActive] = useState(0);
  const [accounts, setAccounts] = useState<Array<{ id: number; provider: PlatformKey; display_name: string }>>([]);

  useEffect(() => {
    // Prefill one item if none
    if (composer.state.items.length === 0) {
      composer.setState((s) => ({
        ...s,
        items: [{ provider: "youtube", social_account_id: 1, title: "", description: "", tags: [], aspect: "16:9" }],
      }));
    }
  }, [composer.state.items.length]);

  const selectedAccs = composer.state.items.map((it) => ({ provider: it.provider, social_account_id: it.social_account_id }));
  const toggleAcc = (acc: { provider: PlatformKey; social_account_id: number }) => {
    const idx = composer.state.items.findIndex((it) => it.provider === acc.provider && it.social_account_id === acc.social_account_id);
    if (idx >= 0) composer.removeItem(idx);
    else composer.addItem({ provider: acc.provider, social_account_id: acc.social_account_id, title: "", description: "", tags: [], aspect: "16:9" });
  };

  const tabs = composer.state.items.map((it, idx) => {
    const acc = accounts.find((a) => a.id === it.social_account_id && a.provider === it.provider);
    const label = acc ? `${acc.display_name} · ${it.provider}` : `${it.provider} · #${it.social_account_id}`;
    return { label, key: it.provider, index: idx };
  });
  const activeItem = composer.state.items[active];

  const duplicateToSameProvider = () => {
    if (!activeItem) return;
    const { provider, title, description, tags, aspect, privacy, thumb_id, subtitles_id, schedule_at } = activeItem;
    composer.setState((s) => ({
      ...s,
      items: s.items.map((it, i) => (
        it.provider === provider && i !== active
          ? { ...it, title, description, tags, aspect, privacy, thumb_id, subtitles_id, schedule_at }
          : it
      )),
    }));
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Composer Multiplataforma</h2>
      <AccountSelector selected={selectedAccs} onToggle={toggleAcc} onLoaded={setAccounts} />
      <div className="flex items-center justify-between">
        <PlatformTabs tabs={tabs} activeIndex={active} onChange={setActive} />
        {composer.state.items.length > 1 ? (
          <button className="px-2 py-1 text-xs rounded bg-white/10 border border-white/20" onClick={duplicateToSameProvider}>
            Duplicar para outras contas do mesmo provedor
          </button>
        ) : null}
      </div>
      {activeItem && (
        <PlatformForm
          provider={activeItem.provider}
          media_asset_id={composer.state.media_asset_id}
          value={activeItem}
          onChange={(patch) => composer.updateItem(active, patch)}
        />
      )}
      <div className="flex items-center gap-2">
        <button className="px-3 py-2 rounded bg-white/10 border border-white/20" onClick={async ()=>{ await composer.preview(); }}>Pré-visualizar</button>
        <button className="px-3 py-2 rounded bg-white/10 border border-white/20" onClick={async ()=>{ await composer.saveDraft(); }}>Salvar rascunho</button>
        <button className="px-3 py-2 rounded bg-blue-600 text-white" onClick={()=>{ const id = composer.state.video_post_id || 1; navigate(`/composer/${id}/review`); }}>Avançar para revisão</button>
      </div>
    </div>
  );
}