import React from "react";

const limitMap: Record<string, { title: number; desc: number }> = {
  youtube: { title: 100, desc: 5000 },
  shorts: { title: 100, desc: 150 },
  reels: { title: 150, desc: 220 },
  tiktok: { title: 150, desc: 220 },
  facebook: { title: 150, desc: 5000 },
  x: { title: 280, desc: 280 },
};
const clampStr = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + "…" : s);

export default function PlatformPreview({ platform, draft }: { platform: string; draft: { title: string; description: string; tags: string[] } }) {
  const platforms = ["youtube", "shorts", "reels", "tiktok", "facebook", "x"];
  const [active, setActive] = React.useState(platform);
  const limits = limitMap[active] || { title: 100, desc: 500 };
  return (
    <section>
      <h2 className="text-sm font-medium mb-2">Pré-visualização</h2>
      <div className="mb-2 flex gap-2">
        {platforms.map((p) => (
          <button key={p} className={`px-3 py-1 rounded text-xs border ${active===p?"bg-gray-100":""}`} onClick={() => setActive(p)}>{p}</button>
        ))}
      </div>
      <div className="border rounded p-3">
        <div className="text-[11px] text-gray-500 mb-1">{active} • Título ≤ {limits.title} • Descrição ≤ {limits.desc}</div>
        <div className="font-medium">{clampStr(draft.title || "(Título)", limits.title)}</div>
        <div className="text-xs text-gray-600 whitespace-pre-wrap mt-1">{clampStr(draft.description || "(Descrição)", limits.desc)}</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {draft.tags.map((t) => <span key={t} className="text-xs border rounded px-2 py-1 bg-gray-50">#{t}</span>)}
          {draft.tags.length === 0 && <span className="text-xs text-gray-500">(Tags)</span>}
        </div>
      </div>
    </section>
  );
}