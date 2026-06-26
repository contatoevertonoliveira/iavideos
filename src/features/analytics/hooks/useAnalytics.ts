import { useState, useCallback } from "react";
import { api } from "@/lib/api";
import { toastError } from "@/lib/toast";

type DateRangeParams = { start: string; end: string; social_account_id?: number; platform?: string };

export function useAnalytics() {
  const [loading, setLoading] = useState(false);
  const [overview, setOverview] = useState<any>(null);
  const [compare, setCompare] = useState<any>(null);
  const [ab, setAB] = useState<any>(null);
  const [videoDetail, setVideoDetail] = useState<any>(null);
  const [limits, setLimits] = useState<any>(null);
  const [needReauth, setNeedReauth] = useState<boolean>(false);

  const fetchOverview = useCallback(async (params: DateRangeParams) => {
    setLoading(true);
    try {
      const { data } = await api.get("/analytics/overview", { params });
      setOverview(data);
      setNeedReauth(false);
    } catch (err) {
      const msg = (err as any)?.response?.data?.message || (err as any)?.message || "";
      const status = (err as any)?.response?.status;
      if (status === 403 || /scope/i.test(msg)) {
        setNeedReauth(true);
      }
      if (import.meta.env.VITE_USE_MOCKS === "true") {
        const today = new Date().toISOString().slice(0, 10);
        const timeseries = Array.from({ length: 14 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (13 - i));
          return {
            date: d.toISOString().slice(0, 10),
            views: 1000 + i * 50,
            watch_hours: 120 + i * 3,
            impressions: 5000 + i * 100,
            ctr: 0.05 + i * 0.001,
          };
        });
        const mock = {
          totals: {
            views: 15000,
            watch_hours: 320,
            avg_view_duration_sec: Math.round((320 * 3600) / 15000),
            ctr: 0.055,
            impressions: 70000,
            likes: 1200,
            comments: 300,
            shares: 180,
            subs_net: 250,
            revenue: 1200.5,
          },
          timeseries,
          traffic_sources: [
            { source: "search", views: 6000, watch_hours: 140 },
            { source: "suggested", views: 5000, watch_hours: 120 },
            { source: "browse", views: 3000, watch_hours: 60 },
            { source: "external", views: 1000, watch_hours: 20 },
          ],
          retention: Array.from({ length: 20 }, (_, i) => ({ t_sec: i * 15, retention_pct: Math.max(5, 100 - i * 4) })),
          top_videos: Array.from({ length: 8 }, (_, i) => ({
            video_id: 100 + i,
            title: `Vídeo #${i + 1}`,
            views: 1000 + i * 200,
            watch_hours: 60 + i * 5,
            ctr: 0.05 + i * 0.002,
            impressions: 20000 + i * 1000,
            avg_view_duration_sec: 300 + i * 10,
            posted_at: today,
            thumbnail_url: "/thumbs/mock.jpg",
          })),
        };
        setOverview(mock);
      } else {
        toastError("Falha ao carregar overview");
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const getOverview = useCallback(async (params: DateRangeParams) => {
    try {
      const { data } = await api.get("/analytics/overview", { params });
      return data;
    } catch (err) {
      if (import.meta.env.VITE_USE_MOCKS === "true") {
        // Reutiliza parte do mock do fetchOverview
        const today = new Date().toISOString().slice(0, 10);
        const timeseries = Array.from({ length: 14 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (13 - i));
          return { date: d.toISOString().slice(0, 10), views: 800 + i * 40, watch_hours: 100 + i * 2.5, impressions: 4000 + i * 90, ctr: 0.048 + i * 0.001 };
        });
        return {
          totals: { views: 12000, watch_hours: 280, avg_view_duration_sec: Math.round((280 * 3600) / 12000), ctr: 0.051, impressions: 60000 },
          timeseries,
          traffic_sources: [],
          retention: [],
          top_videos: [],
        };
      }
      throw err;
    }
  }, []);

  const fetchCompareAccounts = useCallback(async (params: { ids: number[]; platform: string; start: string; end: string }) => {
    try {
      const query = { ...params, ids: params.ids.join(",") } as any;
      const { data } = await api.get("/analytics/compare/accounts", { params: query });
      setCompare((c: any) => ({ ...(c || {}), accounts: data }));
    } catch (err) {
      if (import.meta.env.VITE_USE_MOCKS === "true") {
        const series = params.ids.map((id, idx) => ({
          social_account_id: id,
          label: `Conta ${id}`,
          color: ["#2563eb", "#16a34a", "#f59e0b", "#ef4444"][idx % 4],
          timeseries: Array.from({ length: 10 }, (_, i) => ({
            date: new Date(Date.now() - (9 - i) * 86400000).toISOString().slice(0, 10),
            views: 800 + idx * 150 + i * 40,
            watch_hours: 40 + idx * 10 + i * 2,
          })),
        }));
        const kpis = params.ids.map((id, idx) => ({ social_account_id: id, views: 12000 + idx * 1000, watch_hours: 400 + idx * 30, ctr: 0.05 + idx * 0.003, impressions: 90000 + idx * 5000 }));
        setCompare({ accounts: { series, kpis } });
      } else {
        toastError("Falha no comparativo de contas");
        console.error(err);
      }
    }
  }, []);

  const fetchComparePlatforms = useCallback(async (params: { social_account_id: number; start: string; end: string }) => {
    try {
      const { data } = await api.get("/analytics/compare/platforms", { params });
      setCompare((c: any) => ({ ...(c || {}), platforms: data }));
    } catch (err) {
      if (import.meta.env.VITE_USE_MOCKS === "true") {
        setCompare({ ...(compare || {}), platforms: { platforms: [
          { platform: "youtube", views: 15000, watch_hours: 320, ctr: 0.055, impressions: 70000 },
          { platform: "shorts", views: 8000, watch_hours: 90, ctr: 0.065, impressions: 30000 },
          { platform: "instagram", views: 5000, watch_hours: 60, ctr: 0.045, impressions: 20000 },
        ] } });
      } else {
        toastError("Falha no comparativo de plataformas");
        console.error(err);
      }
    }
  }, [compare]);

  const fetchABThumbnails = useCallback(async (params: { social_account_id: number; start: string; end: string }) => {
    try {
      const { data } = await api.get("/analytics/ab-thumbnails", { params });
      setAB(data);
    } catch (err) {
      if (import.meta.env.VITE_USE_MOCKS === "true") {
        setAB({ experiments: [
          { video_id: 201, variants: [
            { thumbnail_id: 1001, impressions: 20000, ctr: 0.05, views: 3000 },
            { thumbnail_id: 1002, impressions: 18000, ctr: 0.058, views: 3200 },
          ], winner_thumbnail_id: 1002 },
          { video_id: 202, variants: [
            { thumbnail_id: 1003, impressions: 15000, ctr: 0.052, views: 2600 },
            { thumbnail_id: 1004, impressions: 16000, ctr: 0.049, views: 2500 },
          ] },
        ] });
      } else {
        toastError("Falha ao carregar A/B de thumbnails");
        console.error(err);
      }
    }
  }, []);

  const fetchVideoDetail = useCallback(async (id: number) => {
    try {
      const { data } = await api.get(`/analytics/video/${id}/retention`);
      setVideoDetail(data);
    } catch (err) {
      if (import.meta.env.VITE_USE_MOCKS === "true") {
        setVideoDetail({ retention: Array.from({ length: 25 }, (_, i) => ({ t_sec: i * 10, retention_pct: Math.max(3, 100 - i * 3.5) })) });
      } else {
        toastError("Falha ao carregar retenção do vídeo");
        console.error(err);
      }
    }
  }, []);

  const fetchLimits = useCallback(async (params: { social_account_id?: number; platform?: string }) => {
    try {
      const { data } = await api.get("/analytics/limits", { params });
      setLimits(data);
    } catch (err) {
      if (import.meta.env.VITE_USE_MOCKS === "true") {
        setLimits({ quota_remaining: 50, quota_total: 100, risk: false, warnings: [] });
      } else {
        console.warn("Falha ao obter limites", err);
      }
    }
  }, []);

  return { loading, overview, compare, ab, videoDetail, limits, needReauth, fetchOverview, getOverview, fetchCompareAccounts, fetchComparePlatforms, fetchABThumbnails, fetchVideoDetail, fetchLimits };
}