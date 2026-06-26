import React from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { toastError, toastSuccess } from "../../lib/toast";
import { useAuthStore } from "../../features/auth/store";
import { useSSE } from "../../lib/useSSE";
import type { JobUpdateEvent } from "../../lib/useSSE";

type JobRun = {
  id: number;
  task: string; // probe | transcode | thumbnail | publish
  status: string; // queued | running | completed | failed
  progress?: number;
  error_message?: string | null;
  started_at?: string | null;
  finished_at?: string | null;
};

type VideoPostDetail = {
  id: number;
  title: string;
  description?: string;
  status: string;
  provider_video_id?: string | null;
  job_runs: JobRun[];
};

export default function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const vid = Number(id);
  const { data, refetch, isLoading } = useQuery<VideoPostDetail>({
    queryKey: ["videoposts", vid, "detail"],
    queryFn: async () => {
      const resp = await api.get(`/videoposts/${vid}`, {
        headers: useAuthStore.getState().accessToken ? { Authorization: `Bearer ${useAuthStore.getState().accessToken}` } : {},
      });
      return resp.data;
    },
    enabled: Number.isFinite(vid),
  });

  useSSE({
    url: "/sse/stream",
    onEvent: (evt: JobUpdateEvent) => {
      if (evt?.type !== "job_update" || evt.video_post_id !== vid) return;
      // Refetch para atualizar timeline em mudanças relevantes
      refetch();
    },
  });

  async function retry() {
    try {
      await api.post(`/videoposts/${vid}/queue`, {}, {
        headers: useAuthStore.getState().accessToken ? { Authorization: `Bearer ${useAuthStore.getState().accessToken}` } : {},
      });
      toastSuccess("Reenfileirado");
      refetch();
    } catch (err: any) {
      toastError(err?.response?.data?.detail ?? err?.message ?? "Falha ao reenfileirar");
    }
  }

  return (
    <div className="p-4 space-y-4">
      {isLoading || !data ? (
        <div className="animate-pulse space-y-2">
          <div className="h-6 bg-gray-200 rounded" />
          <div className="h-6 bg-gray-200 rounded" />
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">{data.title}</h1>
              <p className="text-xs text-gray-500">status: {data.status} {data.provider_video_id ? `• ${data.provider_video_id}` : ""}</p>
            </div>
            <button className="px-3 py-2 border rounded" onClick={retry}>Tentar novamente</button>
          </div>

          <section>
            <h2 className="text-sm font-medium mb-2">Timeline</h2>
            <div className="flex flex-wrap gap-2">
              {data.job_runs?.map((jr) => (
                <span key={jr.id} className="text-xs border rounded px-2 py-1 bg-gray-50">
                  {jr.task} • {jr.status}
                  {typeof jr.progress === "number" ? ` • ${jr.progress}%` : ""}
                </span>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-sm font-medium mb-2">Logs de erro</h2>
            <div className="space-y-2">
              {data.job_runs?.filter((jr) => jr.error_message)?.map((jr) => (
                <div key={jr.id} className="text-xs border rounded p-2 bg-red-50">
                  <div className="font-medium">{jr.task}</div>
                  <div className="text-red-700 whitespace-pre-wrap">{jr.error_message}</div>
                </div>
              ))}
              {data.job_runs?.every((jr) => !jr.error_message) && (
                <p className="text-xs text-gray-500">Sem erros registrados.</p>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}