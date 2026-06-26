import { describe, it, expect } from "vitest";
import { server } from "@/mocks/server";
import { http, HttpResponse } from "msw";
import { useAuthStore } from "../auth/store";

describe("Fluxo Google OAuth (exchange)", () => {
  it("guarda tokens e perfil após sucesso no /exchange", async () => {
    server.use(
      http.post("http://127.0.0.1:8000/auth/google/exchange", async () =>
        HttpResponse.json({
          access_token: "ACCESS_OK",
          refresh_token: "REFRESH_OK",
          user: { name: "User Name", picture: "pic.jpg", email: "u@x.com" },
        })
      )
    );

    // Simula callback que o componente faria
    const resp = await fetch("http://127.0.0.1:8000/auth/google/exchange", { method: "POST" });
    const data = await resp.json();

    useAuthStore.getState().setTokens({ access: data.access_token, refresh: data.refresh_token });
    useAuthStore.getState().setUser(data.user);

    const s = useAuthStore.getState();
    expect(s.access).toBe("ACCESS_OK");
    expect(s.user.name).toBe("User Name");
  });
});