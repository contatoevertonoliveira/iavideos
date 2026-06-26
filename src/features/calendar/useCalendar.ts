import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api";
import { toastError, toastSuccess, toastInfo } from "@/lib/toast";
import { useSSE } from "@/lib/useSSE";

export type CalendarItem = {
  id: number;
  title: string;
  platform: string;
  social_account_id: number;
  status: string;
  scheduled_at: string | null;
  posted_at: string | null;
  thumbnail?: string;
  duration_secs?: number;
  progress?: number;
};

export type CalendarState = {
  range: { start: string; end: string };
  items: CalendarItem[];
  filters: { platform?: string; account?: number; status?: string };
  setRange: (start: string, end: string) => void;
  setFilters: (f: { platform?: string; account?: number; status?: string }) => void;
  fetchItems: () => Promise<void>;
  updateSchedule: (id: number, dateISO: string) => Promise<void>;
  requeue: (id: number) => Promise<void>;
  cancel: (id: number) => Promise<void>;
  listenSSE: () => void;
  bestTimes: (social_account_id: number, platform: string) => Promise<{ start: string; end: string }[]>;
};

function iso(date: Date) {
  return date.toISOString().slice(0, 19);
}

export function useCalendar(): CalendarState {
  const [range, setRangeState] = useState<{ start: string; end: string }>(() => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - 7);
    const end = new Date(now);
    end.setDate(end.getDate() + 21);
    return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
  });
  const [items, setItems] = useState<CalendarItem[]>([]);
  const [filters, setFiltersState] = useState<{ platform?: string; account?: number; status?: string }>({});

  const setRange = useCallback((start: string, end: string) => setRangeState({ start, end }), []);
  const setFilters = useCallback((f: { platform?: string; account?: number; status?: string }) => setFiltersState(f), []);

  const fetchItems = useCallback(async () => {
    try {
      const params = { start: range.start, end: range.end };
      const { data } = await api.get<CalendarItem[]>("/videoposts/calendar", { params });
      setItems(data);
    } catch (err: any) {
      // Modo mocks: gerar algumas entradas básicas
      if (import.meta.env.VITE_USE_MOCKS === "true") {
        const base: CalendarItem[] = [
          {
            id: 101,
            title: "Teaser do Episódio 3",
            platform: "youtube",
            social_account_id: 1,
            status: "Queued",
            scheduled_at: new Date().toISOString(),
            posted_at: null,
            thumbnail: "/thumbs/ep3.jpg",
            duration_secs: 120,
          },
          {
            id: 102,
            title: "Corte vertical Shorts",
            platform: "shorts",
            social_account_id: 1,
            status: "Draft",
            scheduled_at: null,
            posted_at: null,
            thumbnail: "/thumbs/shorts1.jpg",
            duration_secs: 30,
          },
        ];
        setItems(base);
        return;
      }
      toastError("Falha ao carregar calendário");
      console.error(err);
    }
  }, [range.start, range.end]);

  const updateSchedule = useCallback(async (id: number, dateISO: string) => {
    try {
      await api.patch(`/videoposts/${id}/schedule`, { scheduled_at: dateISO });
      setItems((prev) => prev.map((it) => (it.id === id ? { ...it, scheduled_at: dateISO } : it)));
      const d = new Date(dateISO);
      const hh = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const dd = d.toLocaleDateString();
      toastSuccess(`Reagendado para ${hh} ${dd}`);
    } catch (err) {
      toastError("Erro ao reagendar");
      console.error(err);
    }
  }, []);

  const requeue = useCallback(async (id: number) => {
    try {
      await api.post(`/videoposts/${id}/requeue`);
      setItems((prev) => prev.map((it) => (it.id === id ? { ...it, status: "Queued" } : it)));
      toastSuccess("Job reativado para fila");
    } catch (err) {
      toastError("Erro ao reativar job");
      console.error(err);
    }
  }, []);

  const cancel = useCallback(async (id: number) => {
    try {
      await api.delete(`/videoposts/${id}`);
      setItems((prev) => prev.map((it) => (it.id === id ? { ...it, status: "Canceled" } : it)));
      toastInfo("Post cancelado");
    } catch (err) {
      toastError("Erro ao cancelar");
      console.error(err);
    }
  }, []);

  // Conexão SSE ativa com base no baseURL do axios (ex.: http://localhost:8000/api/v1)
  const sseUrl = `${api.defaults.baseURL ?? ""}/sse/stream`;
  useSSE({
    url: sseUrl,
    onEvent: (evt) => {
      if (!evt || !evt.video_post_id) return;
      setItems((prev) =>
        prev.map((it) =>
          it.id === evt.video_post_id
            ? { ...it, progress: evt.progress ?? it.progress, status: evt.status ?? it.status }
            : it
        )
      );
    },
  });

  const bestTimes = useCallback(async (social_account_id: number, platform: string) => {
    try {
      const { data } = await api.get<{ start: string; end: string }[]>("/scheduler/best_times", {
        params: { social_account_id, platform },
      });
      return data;
    } catch (err) {
      if (import.meta.env.VITE_USE_MOCKS === "true") {
        const now = new Date();
        const slots = [1, 3, 5].map((h) => {
          const s = new Date(now);
          s.setHours(s.getHours() + h);
          const e = new Date(s);
          e.setMinutes(e.getMinutes() + 45);
          return { start: iso(s), end: iso(e) };
        });
        return slots;
      }
      toastError("Erro ao buscar melhores horários");
      console.error(err);
      return [];
    }
  }, []);

  // Efeito inicial de carga
  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range.start, range.end]);

  return {
    range,
    items,
    filters,
    setRange,
    setFilters,
    fetchItems,
    updateSchedule,
    requeue,
    cancel,
    bestTimes,
  };
}