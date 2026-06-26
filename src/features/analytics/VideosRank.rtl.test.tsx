import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { server } from "@/mocks/server";
import { http, HttpResponse } from "msw";
import VideosRank from "./VideosRank";

function renderWithProviders(ui: React.ReactElement) {
  const qc = new QueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={["/analytics/videos"]}>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe("VideosRank", () => {
  it("filtra por título e atualiza paginação", async () => {
    // Contas YouTube
    server.use(
      http.get("*/api/v1/accounts", async () => {
        return HttpResponse.json([
          { id: 1, provider: "youtube", display_name: "Canal Principal" },
        ]);
      })
    );
    // Overview com top_videos
    server.use(
      http.get("*/api/v1/analytics/overview", async () => {
        const base = (i: number) => ({
          video_id: 100 + i,
          views: 1000 + i * 100,
          watch_hours: 60 + i * 5,
          ctr: 0.05 + i * 0.001,
          impressions: 20000 + i * 500,
          avg_view_duration_sec: 300 + i * 10,
          posted_at: new Date().toISOString().slice(0, 10),
          thumbnail_url: "/thumbs/mock.jpg",
        });
        return HttpResponse.json({
          totals: { views: 0, watch_hours: 0, avg_view_duration_sec: 0, ctr: 0, impressions: 0 },
          timeseries: [],
          traffic_sources: [],
          retention: [],
          top_videos: [
            { ...base(0), title: "Alpha" },
            { ...base(1), title: "Beta" },
            { ...base(2), title: "Gamma" },
            { ...base(3), title: "Delta" },
            { ...base(4), title: "Epsilon" },
            { ...base(5), title: "Zeta" },
            { ...base(6), title: "Eta" },
            { ...base(7), title: "Theta" },
            { ...base(8), title: "Iota" },
            { ...base(9), title: "Kappa" },
            { ...base(10), title: "Lambda" },
          ],
        });
      })
    );

    renderWithProviders(<VideosRank />);

    // Título da tabela e elementos básicos
    expect(await screen.findByText("Top vídeos")).toBeInTheDocument();

    // Filtra por "Beta" e verifica que apenas ele aparece
    const input = await screen.findByPlaceholderText("Buscar por título");
    await userEvent.type(input, "Beta");
    expect(await screen.findByText("Beta")).toBeInTheDocument();
    expect(screen.queryByText("Alpha")).toBeNull();
    expect(screen.queryByText("Gamma")).toBeNull();

    // Paginação indica página 1 de 2 inicialmente (11 itens, 10 por página)
    expect(await screen.findByText(/Página 1 de 2/)).toBeInTheDocument();
  });
});