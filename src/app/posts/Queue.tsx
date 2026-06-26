import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useSSE } from "../../lib/useSSE";
import type { JobUpdateEvent } from "../../lib/useSSE";
import { toastError, toastInfo, toastSuccess } from "../../lib/toast";
import { useAuthStore } from "../../features/auth/store";

type VideoPost = {
  id: number;
  title: string;
  social_account_id: string;
  status: string; // draft | queued | running | posted | failed
  progress?: number; // optional from API
};

export default function Queue() {
  const { data, isLoading, refetch } = useQuery<VideoPost[]>({
    queryKey: ["videoposts", "list"],
    queryFn: async () => {
      const resp = await api.get("/videoposts", {
        headers: useAuthStore.getState().accessToken ? { Authorization: `Bearer ${useAuthStore.getState().accessToken}` } : {},
      });
      return resp.data?.items ?? resp.data ?? [];
    },
  });

  const [progressById, setProgressById] = useState<Record<number, number>>({});
  const [statusById, setStatusById] = useState<Record<number, string>>({});

  useEffect(() => {
    if (!data) return;
    const map: Record<number, number> = {};
    const smap: Record<number, string> = {};
    for (const vp of data) {
      if (typeof vp.progress === "number") map[vp.id] = vp.progress;
      smap[vp.id] = vp.status;
    }
    setProgressById((prev) => ({ ...prev, ...map }));
    setStatusById((prev) => ({ ...prev, ...smap }));
  }, [data]);

  useSSE({
    url: "/sse/stream",
    onEvent: (evt: JobUpdateEvent) => {
      if (evt?.type !== "job_update" || typeof evt.video_post_id !== "number") return;
      setProgressById((prev) => ({ ...prev, [evt.video_post_id]: Math.max(0, Math.min(100, evt.progress ?? prev[evt.video_post_id] ?? 0)) }));
      if (evt.status) setStatusById((prev) => ({ ...prev, [evt.video_post_id]: evt.status! }));
    },
  });

  const rows = useMemo(() => data ?? [], [data]);

  async function reprocess(id: number) {
    try {
      await api.post(`/videoposts/${id}/queue`, {}, {
        headers: useAuthStore.getState().accessToken ? { Authorization: `Bearer ${useAuthStore.getState().accessToken}` } : {},
      });
      toastSuccess("Reprocessamento enfileirado");
      refetch();
    } catch (err: any) {
      toastError(err?.response?.data?.detail ?? err?.message ?? "Falha ao reprocessar");
    }
  }

  function cancel(id: number) {
    toastInfo("Cancelar ainda não implementado neste ambiente");
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-4">Fila de Posts</h1>
      {isLoading ? (
        <div className="animate-pulse space-y-2">
          <div className="h-6 bg-gray-200 rounded" />
          <div className="h-6 bg-gray-200 rounded" />
          <div className="h-6 bg-gray-200 rounded" />
        </div>
      ) : (
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="px-3 py-2">Título</th>
                <th className="px-3 py-2">Conta</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Progresso</th>
                <th className="px-3 py-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((vp) => (
                <tr key={vp.id} className="border-b">
                  <td className="px-3 py-2">
                    <a href={`#/posts/${vp.id}`} className="text-blue-600 no-underline transition-colors duration-150 hover:bg-[#FFD700] hover:!text-[#16132B]">{vp.title}</a>
                  </td>
                  <td className="px-3 py-2">
                    <span className="inline-flex items-center gap-1 text-xs border rounded px-2 py-1">
                      <span className="w-2 h-2 bg-red-500 rounded-full" /> YouTube • {vp.social_account_id}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs">
                    <span className="px-2 py-1 border rounded bg-gray-50">{statusById[vp.id] ?? vp.status}</span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="h-2 bg-gray-200 rounded">
                      <div
                        className="h-2 bg-green-600 rounded"
                        style={{ width: `${progressById[vp.id] ?? vp.progress ?? 0}%`, transition: "width 0.2s" }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{progressById[vp.id] ?? vp.progress ?? 0}%</p>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <button className="px-2 py-1 border rounded" onClick={() => cancel(vp.id)}>Cancelar</button>
                      <button className="px-2 py-1 border rounded" onClick={() => reprocess(vp.id)}>Reprocessar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}