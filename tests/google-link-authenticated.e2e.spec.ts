import { test, expect } from "@playwright/test";

test("conecta Google após login e persiste no reload", async ({ page }) => {
  // Mock de login e contexto para não depender do backend
  await page.route("**/api/v1/auth/login", async (route) => {
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        access: "ACCESS_TOKEN_E2E",
        refresh: "REFRESH_TOKEN_E2E",
        user: { email: "everoliver@example.com", name: "Ever Oliver", role: "superAdmin" },
      }),
    })
  })
  await page.route("**/api/v1/me/context", async (route) => {
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ id: 1, name: "Ever Oliver", email: "everoliver@example.com", role: "superAdmin" }),
    })
  })

  // Login como superAdmin
  await page.goto("http://localhost:5175/login");
  await page.getByLabel("Email").fill("everoliver@example.com");
  await page.getByLabel("Senha").fill("123456");
  await page.getByRole("button", { name: /Continuar/i }).click();

  // Navega para Configurações/Contas
  await page.goto("http://localhost:5175/configuracoes/contas");

  // Stub de GIS para garantir fluxo quando VITE_E2E_MODE não estiver ativo
  await page.evaluate(() => {
    try {
      (window as any).google = (window as any).google || {};
      const google = (window as any).google;
      google.accounts = google.accounts || {};
      google.accounts.oauth2 = google.accounts.oauth2 || {};
      google.accounts.oauth2.initCodeClient = (opts: any) => {
        return {
          requestCode: () => {
            setTimeout(() => {
              try {
                opts?.callback?.({ code: "E2E_CODE" });
              } catch (_) {}
            }, 0);
          },
        };
      };
    } catch (_) {}
  });

  // Intercepta /accounts para iniciar vazio e depois conter a nova conta
  let linked = false;
  await page.route("**/api/v1/accounts", async (route) => {
    if (!linked) {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) });
    }
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        {
          id: 10,
          provider: "google",
          external_user_id: "sub-e2e",
          display_name: "E2E User",
          avatar_url: "https://example.com/e2e.jpg",
          username: "e2e@gmail.com",
          status: "active",
          scopes: ["openid", "email", "profile", "https://www.googleapis.com/auth/youtube.readonly"],
          expires_at: new Date(Date.now() + 3600_000).toISOString(),
        },
      ]),
    });
  });

  // Intercepta link config para GIS (fallback se modo E2E não ativar)
  await page.route("**/api/v1/accounts/google/link", async (route) => {
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ gis: { client_id: "E2E_CLIENT_ID" }, provider: "google" }),
    })
  })

  // Intercepta /accounts/google/exchange antes do clique
  await page.route("**/api/v1/accounts/google/exchange", async (route) => {
    linked = true;
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        account: {
          id: 10,
          provider: "google",
          external_user_id: "sub-e2e",
          display_name: "E2E User",
          avatar_url: "https://example.com/e2e.jpg",
          username: "e2e@gmail.com",
          status: "active",
          scopes: ["openid", "email", "profile", "https://www.googleapis.com/auth/youtube.readonly"],
          expires_at: new Date(Date.now() + 3600_000).toISOString(),
        },
        tokens: { access_token: "ACCESS_E2E", refresh_token: "REFRESH_E2E", expires_in: 3600 },
      }),
    });
  });

  // Clica em "Conectar com Google"
  const btn = page.getByRole("button", { name: /Conectar Google/i });
  await Promise.all([
    page.waitForResponse((resp) => {
      const u = resp.url();
      const m = resp.request().method();
      return m === 'POST' && (u.includes('/api/v1/accounts/google/exchange') || u.includes('/api/v1/auth/google/exchange'));
    }),
    btn.click(),
  ]);
  await page.waitForResponse((resp) => resp.url().includes('/api/v1/accounts') && resp.request().method() === 'GET');

  // Verifica tabela da conta conectada
  await expect(page.getByText(/E2E User/i)).toBeVisible();

  // Persiste após reload
  await page.reload();
  await expect(page.getByText(/E2E User/i)).toBeVisible();
});