import { useMemo } from "react";
import { CalendarItem, useCalendar } from "./useCalendar";
import { Link } from "react-router-dom";

type Props = {
  item: CalendarItem | null;
  onClose: () => void;
};

export default function PostCardModal({ item, onClose }: Props) {
  const { requeue, cancel } = useCalendar();
  const statusColor = useMemo(() => {
    const s = item?.status ?? "Draft";
    return {
      Draft: "bg-white/20",
      Queued: "bg-yellow-500/40",
      Processing: "bg-blue-500/40",
      Posted: "bg-green-500/40",
      Failed: "bg-red-500/40",
      Canceled: "bg-gray-500/40",
    }[s] || "bg-white/20";
  }, [item]);

  if (!item) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="w-full max-w-xl rounded-xl border border-white/10 bg-[#16132B] p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Detalhes do Post</h2>
          <button className="px-3 py-1 rounded-md bg-white/10 hover:bg-white/20" onClick={onClose}>Fechar</button>
        </div>
        <div className="mt-4 flex gap-4">
          <div className="w-32 h-20 bg-white/10 rounded-md overflow-hidden">
            {item.thumbnail ? <img src={item.thumbnail} className="w-full h-full object-cover" /> : null}
          </div>
          <div className="flex-1">
            <div className="text-sm text-white/80">#{item.id}</div>
            <div className="font-medium">{item.title}</div>
            <div className="text-sm">{item.platform} · conta {item.social_account_id}</div>
            <div className={`mt-2 inline-block text-xs px-2 py-1 rounded ${statusColor}`}>{item.status}</div>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <Link to={`/posts/queue`} className="px-3 py-2 rounded-md bg-white/10 hover:bg-white/20">Ver fila</Link>
          <Link to={`/posts/${item.id}`} className="px-3 py-2 rounded-md bg-white/10 hover:bg-white/20">Editar dados</Link>
          <button className="px-3 py-2 rounded-md bg-red-600/50 hover:bg-red-600/70" onClick={() => cancel(item.id)}>Cancelar</button>
          <button className="px-3 py-2 rounded-md bg-yellow-500/40 hover:bg-yellow-500/60" onClick={() => requeue(item.id)}>Requeue</button>
          <button className="px-3 py-2 rounded-md bg-white/10 hover:bg-white/20" onClick={() => alert("Duplicar: implementar endpoint /videoposts/:id/duplicate")}>Duplicar</button>
        </div>
      </div>
    </div>
  );
}