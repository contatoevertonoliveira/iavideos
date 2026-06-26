import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { server } from "@/mocks/server";
import { http, HttpResponse } from "msw";
import ComparePage from "./ComparePage";

function renderWithProviders(ui: React.ReactElement) {
  const qc = new QueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={["/analytics/compare"]}>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe("ComparePage", () => {
  it("mostra aviso sem contas selecionadas e renderiza gráfico após seleção", async () => {
    // Fornece contas YouTube para aparecerem na lista
    server.use(
      http.get("*/api/v1/accounts", async () => {
        return HttpResponse.json([
          { id: 1, provider: "youtube", display_name: "Canal Principal" },
          { id: 2, provider: "youtube", display_name: "Cortes" },
        ]);
      })
    );

    renderWithProviders(<ComparePage />);

    // Mensagem inicial
    expect(await screen.findByText("Selecione ao menos uma conta.")).toBeInTheDocument();

    // Seleciona a primeira conta
    const checkbox = await screen.findByRole("checkbox");
    await userEvent.click(checkbox);

    // Após selecionar, deve renderizar o gráfico comparativo
    expect(await screen.findByText("Comparativo entre contas")).toBeInTheDocument();
  });
});