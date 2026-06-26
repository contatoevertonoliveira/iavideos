import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type Thumb = { id: string; url: string; ts?: string };

export default function ThumbnailPicker({ media_asset_id, selectedId, onSelect }: { media_asset_id: number; selectedId?: string; onSelect: (id?: string) => void }) {
  const [items, setItems] = useState<Thumb[]>([]);
  const mocks = (import.meta.env.VITE_USE_MOCKS ?? "false") === "true";

  useEffect(() => {
    async function load() {
      if (!media_asset_id) return;
      if (!mocks) {
        const { data } = await api.get(`/thumbnails`, { params: { media_asset_id } });
        const list: Thumb[] = data?.items || data || [];
        setItems(list);
      } else {
        setItems(Array.from({ length: 6 }).map((_, i) => ({ id: `${i+1}`, url: `https://picsum.photos/seed/thumb${i}/180/100` })));
      }
    }
    load();
  }, [media_asset_id, mocks]);

  return (
    <div className="space-y-2">
      <label className="text-sm">Thumbnail</label>
      <div className="grid grid-cols-3 gap-2">
        {items.map((it) => (
          <button key={it.id} onClick={() => onSelect(it.id)} className={`border rounded overflow-hidden ${selectedId===it.id? 'border-blue-500':'border-white/20'}`}>
            <img src={it.url} alt={it.id} className="w-full h-20 object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}