import React, { useEffect, useState } from "react";

export default function ThumbnailRanker({ thumbnails, ranking, onLoad, onRank, onSelect }: { thumbnails: { items: { id: string; url: string; ts: string }[]; selected_id?: string } | null; ranking: { id: string; score: number }[]; onLoad: () => void; onRank: (ids: string[]) => void; onSelect: (id: string) => void; }) {
  const [selected, setSelected] = useState<string[]>([]);
  useEffect(() => { if (!thumbnails) onLoad(); }, [thumbnails]);
  const items = thumbnails?.items ?? [];

  const toggleSelect = (id: string) => {
    const isSelected = selected.includes(id);
    if (isSelected) setSelected(selected.filter((x) => x !== id));
    else if (selected.length < 2) setSelected([...selected, id]);
  };

  return (
    <section>
      <h2 className="text-sm font-medium mb-2">Thumbnails</h2>
      <div className="grid grid-cols-2 gap-3">
        {items.map((it) => {
          const rank = ranking.find((r) => r.id === it.id)?.score;
          const isSelected = selected.includes(it.id);
          return (
            <div key={it.id} className={`border rounded p-2 ${isSelected ? "ring-2 ring-blue-500" : ""}`}>
              <div className="relative">
                <img src={it.url} alt={`thumb ${it.id}`} className="w-full h-auto rounded" onClick={() => toggleSelect(it.id)} />
                {rank != null && (
                  <span className="absolute top-2 left-2 bg-black/70 text-white text-[11px] px-2 py-1 rounded">score {rank}</span>
                )}
              </div>
              <div className="flex items-center justify-between mt-2 text-xs">
                <span>{new Date(it.ts).toLocaleString()}</span>
                <span>{ranking.length ? "" : ""}</span>
              </div>
              <div className="mt-2 flex gap-2">
                <button className="px-2 py-1 border rounded text-xs" onClick={() => onSelect(it.id)}>Usar</button>
                <button className="px-2 py-1 border rounded text-xs" onClick={() => onRank([it.id])}>Rank</button>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex gap-2">
        <button className="px-3 py-1 border rounded text-sm" disabled={selected.length !== 2} onClick={() => onRank(selected)}>Rank A/B</button>
        <button className="px-3 py-1 border rounded text-sm" onClick={() => setSelected([])}>Limpar seleção</button>
      </div>
    </section>
  );
}