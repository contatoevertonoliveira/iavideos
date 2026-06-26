import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { server } from "@/mocks/server";
import { http, HttpResponse } from "msw";
import { GoogleConnect } from "./GoogleConnect";
import { useAuthStore } from "./store";

describe("Fluxo Google OAuth (exchange negativo)", () => {
  it("não persiste tokens/usuário quando /exchange retorna erro", async () => {
    // Garantir estado limpo
    localStorage.clear();
    useAuthStore.getState().clear();

    // Forçar falha no endpoint usado pelo componente (base default)
    server.use(
      http.post("http://localhost:8000/api/v1/auth/google/exchange", async () =>
        HttpResponse.json({ detail: "invalid_grant" }, { status: 400 })
      )
    );

    render(<GoogleConnect />);
    const btn = screen.getByRole("button", { name: /Conectar com Google/i });
    // Dispara fluxo (modo E2E ou sem GIS cai no exchange direto)
    btn.click();

    // Aguarda a promessa do fetch resolver
    await waitFor(() => {
      const s = useAuthStore.getState();
      expect(s.access).toBeNull();
      expect(s.refresh).toBeNull();
      expect(s.user.name).toBeNull();
    });

    // Confirma que nenhuma persistência ocorreu
    const persisted = localStorage.getItem("av-auth");
    if (persisted) {
      const parsed = JSON.parse(persisted);
      expect(parsed?.state?.access ?? null).toBeNull();
      expect(parsed?.state?.user?.name ?? null).toBeNull();
    }
  });
});