import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { server } from "@/mocks/server";
import { http, HttpResponse } from "msw";
import AnalyticsHome from "./AnalyticsHome";

function renderWithProviders(ui: React.ReactElement) {
  const qc = new QueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={["/analytics"]}>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe("AnalyticsHome", () => {
  it("renderiza KPIs principais e exibe tooltip de CTR", async () => {
    // Garantir que overview responde com dados válidos
    server.use(
      http.get("*/api/v1/analytics/overview", async () => {
        const today = new Date().toISOString().slice(0, 10);
        const timeseries = Array.from({ length: 7 }, (_, i) => ({
          date: new Date(Date.now() - (6 - i) * 86400000).toISOString().slice(0, 10),
          views: 1000 + i * 50,
          watch_hours: 120 + i * 3,
          impressions: 5000 + i * 100,
          ctr: 0.05 + i * 0.001,
        }));
        return HttpResponse.json({
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
          traffic_sources: [],
          retention: [],
          top_videos: Array.from({ length: 3 }, (_, i) => ({
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
        });
      })
    );

    renderWithProviders(<AnalyticsHome />);

    // Labels dos KPIs
    expect(await screen.findByText("Views")).toBeInTheDocument();
    expect(screen.getByText("Watch time (h)")).toBeInTheDocument();
    expect(screen.getByText("Avg. view duration")).toBeInTheDocument();
    expect(screen.getByText("CTR (thumb)")).toBeInTheDocument();
    expect(screen.getByText("Impressions")).toBeInTheDocument();

    // Tooltip de CTR
    expect(screen.getByTitle(/CTR: cliques \/ impressões/i)).toBeInTheDocument();

    // Deltas renderizam com setas ▲/▼ (após cálculo assíncrono)
    await waitFor(() => {
      const arrows = screen.queryAllByText(/▲|▼/);
      expect(arrows.length).toBeGreaterThan(0);
    });
  });

  it("exibe banner de reautorização quando faltam escopos", async () => {
    server.use(
      http.get("*/api/v1/analytics/overview", async () => {
        return HttpResponse.json({ message: "missing scope" }, { status: 403 });
      })
    );

    renderWithProviders(<AnalyticsHome />);

    expect(
      await screen.findByText(
        "Faltam escopos de analytics para esta conta. Alguns dados podem estar indisponíveis."
      )
    ).toBeInTheDocument();
  });
});