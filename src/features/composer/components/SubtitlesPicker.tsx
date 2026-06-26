import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type SubFile = { id: string; name: string; type: "srt"|"vtt" };

export default function SubtitlesPicker({ media_asset_id, selectedId, onSelect }: { media_asset_id: number; selectedId?: string; onSelect: (id?: string) => void }) {
  const [items, setItems] = useState<SubFile[]>([]);
  const mocks = (import.meta.env.VITE_USE_MOCKS ?? "false") === "true";

  useEffect(() => {
    async function load() {
      if (!media_asset_id) return;
      if (!mocks) {
        const { data } = await api.get(`/media/subtitles`, { params: { media_asset_id } });
        setItems(Array.isArray(data) ? data : []);
      } else {
        setItems([
          { id: "sub1", name: "video_ptbr.srt", type: "srt" },
          { id: "sub2", name: "video_en.vtt", type: "vtt" },
        ]);
      }
    }
    load();
  }, [media_asset_id, mocks]);

  return (
    <div className="space-y-2">
      <label className="text-sm">Legendas</label>
      <select className="w-full border rounded px-2 py-1 text-sm bg-transparent" value={selectedId || ""} onChange={(e) => onSelect(e.target.value || undefined)}>
        <option value="">Nenhuma</option>
        {items.map((it) => (
          <option key={it.id} value={it.id}>{it.name}</option>
        ))}
      </select>
    </div>
  );
}