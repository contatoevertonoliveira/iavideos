import { http, HttpResponse } from "msw";
let siteMode: 'free' | 'subscribers' = 'free'

export const handlers = [
  // Exchange Google code → tokens + user (sample host)
  http.post("http://127.0.0.1:8000/auth/google/exchange", async () => {
    return HttpResponse.json({
      access_token: "ACCESS_MOCK",
      refresh_token: "REFRESH_MOCK",
      user: {
        name: "Everton Oliveira",
        picture: "https://example.com/avatar.jpg",
        email: "everton@example.com",
      },
    });
  }),
  // Exchange Google code → tokens + user (default local API base)
  http.post("http://localhost:8000/api/v1/auth/google/exchange", async () => {
    return HttpResponse.json({
      access_token: "ACCESS_MOCK",
      refresh_token: "REFRESH_MOCK",
      user: {
        name: "Everton Oliveira",
        picture: "https://example.com/avatar.jpg",
        email: "everton@example.com",
      },
    });
  }),
  // Accounts list
  http.get("http://localhost:8000/api/v1/accounts", async () => {
    return HttpResponse.json([
      {
        id: 1,
        provider: "google",
        external_user_id: "sub-1",
        display_name: "User One",
        avatar_url: "https://example.com/one.jpg",
        username: "user1@gmail.com",
        status: "active",
        scopes: ["openid", "email", "profile", "https://www.googleapis.com/auth/youtube.readonly"],
        expires_at: new Date(Date.now() + 3600_000).toISOString(),
      },
      {
        id: 2,
        provider: "google",
        external_user_id: "sub-2",
        display_name: "User Two",
        avatar_url: "https://example.com/two.jpg",
        username: "user2@gmail.com",
        status: "active",
        scopes: ["openid", "email", "profile", "https://www.googleapis.com/auth/youtube.readonly"],
        expires_at: new Date(Date.now() + 7200_000).toISOString(),
      },
    ]);
  }),
  // ===== Auth & Context =====
  http.post("*/api/v1/auth/login", async ({ request, url }) => {
    const u = new URL(url)
    const email = u.searchParams.get('email') || 'user@example.com'
    const password = u.searchParams.get('password') || ''
    if (password === 'wrong') {
      return HttpResponse.json({ detail: 'unauthorized' }, { status: 401 })
    }
    const role = email.includes('everoliver') && !email.includes('02') && !email.includes('03')
      ? 'superAdmin'
      : email.includes('everoliver02')
        ? 'moderator'
        : email.includes('everoliver03')
          ? 'viewer'
          : 'user'
    return HttpResponse.json({ access: 'ACCESS_MOCK', refresh: 'REFRESH_MOCK', user: { id: 1, name: email.split('@')[0], email, role } })
  }),
  http.get('*/me/context', async () => {
    return HttpResponse.json({ id: 1, name: 'Usuario', email: 'usuario@example.com', role: 'user', picture: null })
  }),
  http.get('*/api/v1/auth/me', async () => {
    return HttpResponse.json({ id: 1, name: 'Usuario', email: 'usuario@example.com', role: 'user', picture: null })
  }),
  // ===== Admin Billing =====
  http.get('*/api/v1/admin/billing/settings', async () => {
    return HttpResponse.json({ site_mode: siteMode, plans_enabled: false })
  }),
  http.patch('*/api/v1/admin/billing/settings', async ({ request }) => {
    const body = await request.json().catch(() => ({}))
    siteMode = (body?.site_mode === 'subscribers') ? 'subscribers' : 'free'
    return HttpResponse.json({ ok: true, site_mode: siteMode, plans_enabled: false })
  }),
  // Fallback accounts list (any host)
  http.get("*/api/v1/accounts", async () => {
    return HttpResponse.json([
      {
        id: 1,
        provider: "google",
        external_user_id: "sub-1",
        display_name: "User One",
        avatar_url: "https://example.com/one.jpg",
        username: "user1@gmail.com",
        status: "active",
        scopes: ["openid", "email", "profile", "https://www.googleapis.com/auth/youtube.readonly"],
        expires_at: new Date(Date.now() + 3600_000).toISOString(),
      },
      {
        id: 2,
        provider: "google",
        external_user_id: "sub-2",
        display_name: "User Two",
        avatar_url: "https://example.com/two.jpg",
        username: "user2@gmail.com",
        status: "active",
        scopes: ["openid", "email", "profile", "https://www.googleapis.com/auth/youtube.readonly"],
        expires_at: new Date(Date.now() + 7200_000).toISOString(),
      },
    ]);
  }),
  // Unlink account
  http.delete("http://localhost:8000/api/v1/accounts/:id", async () => {
    return HttpResponse.json({ ok: true });
  }),
  // Refresh account
  http.post("http://localhost:8000/api/v1/accounts/:id/refresh", async () => {
    return HttpResponse.json({ ok: true });
  }),
  // --- Admin mock endpoints ---
  // Seed users
  http.post("http://localhost:8000/api/v1/admin/users/seed", async () => {
    return HttpResponse.json({ ok: true });
  }),
  // List users
  http.get("http://localhost:8000/api/v1/admin/users", async () => {
    return HttpResponse.json([
      { id: 1, email: "admin@example.com", role: "superAdmin", last_login_at: new Date().toISOString() },
      { id: 2, email: "mod@example.com", role: "moderator", last_login_at: null },
      { id: 3, email: "viewer@example.com", role: "viewer", last_login_at: null },
    ]);
  }),
  // Set user role
  http.patch("http://localhost:8000/api/v1/admin/users/:id/role", async ({ params, request }) => {
    const id = Number(params.id);
    const body = await request.json();
    return HttpResponse.json({ ok: true, id, role: body?.role ?? "viewer" });
  }),
  // Create request
  http.post("http://localhost:8000/api/v1/admin/requests", async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ ok: true, id: Math.floor(Math.random() * 10000), ...body, status: "pending" });
  }),
  // List requests
  http.get("http://localhost:8000/api/v1/admin/requests", async () => {
    return HttpResponse.json([
      { id: 101, type: "delete", resource: "job", resource_id: 55, status: "pending", reason: "Cleanup" },
      { id: 102, type: "delete", resource: "provider", resource_id: 7, status: "approved" },
    ]);
  }),
  // Approve request
  http.post("http://localhost:8000/api/v1/admin/requests/:id/approve", async ({ params }) => {
    const id = Number(params.id);
    return HttpResponse.json({ ok: true, id, status: "approved" });
  }),
  // Reject request
  http.post("http://localhost:8000/api/v1/admin/requests/:id/reject", async ({ params }) => {
    const id = Number(params.id);
    return HttpResponse.json({ ok: true, id, status: "rejected" });
  }),
  // Channels by social account
  http.get("http://localhost:8000/api/v1/accounts/:id/youtube/channels", async ({ params }) => {
    const id = Number(params.id);
    if (id === 1) {
      return HttpResponse.json([
        { id: 101, name: "Canal 1A", external_id: "yt-1a", enabled: true, category: "general" },
        { id: 102, name: "Canal 1B", external_id: "yt-1b", enabled: true, category: "general" },
      ]);
    }
    if (id === 2) {
      return HttpResponse.json([
        { id: 201, name: "Canal 2A", external_id: "yt-2a", enabled: true, category: "general" },
      ]);
    }
    return HttpResponse.json([], { status: 404 });
  }),
  // Fallback: Channels by social account (any host)
  http.get("*/api/v1/accounts/:id/youtube/channels", async ({ params }) => {
    const id = Number(params.id);
    if (id === 1) {
      return HttpResponse.json([
        { id: 101, name: "Canal 1A", external_id: "yt-1a", enabled: true, category: "general" },
        { id: 102, name: "Canal 1B", external_id: "yt-1b", enabled: true, category: "general" },
      ]);
    }
    if (id === 2) {
      return HttpResponse.json([
        { id: 201, name: "Canal 2A", external_id: "yt-2a", enabled: true, category: "general" },
      ]);
    }
    return HttpResponse.json([], { status: 404 });
  }),
  // Handle OPTIONS preflight for accounts
  http.options("*/api/v1/accounts", async () => {
    return HttpResponse.text("", { status: 200 })
  }),
  // Handle OPTIONS preflight for youtube channels endpoint
  http.options("*/api/v1/accounts/:id/youtube/channels", async () => {
    return HttpResponse.text("", { status: 200 })
  }),
  // Channels listing with social_account_id filter
  http.get("http://localhost:8000/api/v1/channels", async ({ request }) => {
    const url = new URL(request.url)
    const saId = url.searchParams.get("social_account_id")
    const id = Number(saId || 0)
    if (id === 1) {
      return HttpResponse.json([
        { id: 11, name: "Feed 1A", category: "general", publish_config: { auto_publish: true } },
        { id: 12, name: "Feed 1B", category: "educacional", publish_config: { auto_publish: false } },
      ])
    }
    if (id === 2) {
      return HttpResponse.json([
        { id: 21, name: "Feed 2A", category: "general", publish_config: { auto_publish: false } },
      ])
    }
    return HttpResponse.json([])
  }),
  // Fallback for channels listing regardless of host
  http.get("*/api/v1/channels", async ({ request }) => {
    const url = new URL(request.url)
    const saId = url.searchParams.get("social_account_id")
    const id = Number(saId || 0)
    console.log('[MSW] GET channels (wildcard) url=', url.toString(), 'saId=', saId)
    if (id === 1) {
      return HttpResponse.json([
        { id: 11, name: "Feed 1A", category: "general", publish_config: { auto_publish: true } },
        { id: 12, name: "Feed 1B", category: "educacional", publish_config: { auto_publish: false } },
      ])
    }
    if (id === 2) {
      return HttpResponse.json([
        { id: 21, name: "Feed 2A", category: "general", publish_config: { auto_publish: false } },
      ])
    }
    return HttpResponse.json([])
  }),
  // Update channel category
  http.put("http://localhost:8000/api/v1/channels/:id/category", async ({ params, request }) => {
    const id = Number(params.id)
    const body = await request.json().catch(() => ({}))
    return HttpResponse.json({ id, updated: true, category: body?.category || null })
  }),
  // Update channel publish config
  http.put("http://localhost:8000/api/v1/channels/:id/publish-config", async ({ params, request }) => {
    const id = Number(params.id)
    const body = await request.json().catch(() => ({}))
    return HttpResponse.json({ id, updated: true, publish_config: { auto_publish: Boolean(body?.auto_publish) } })
  }),

  // ===== Analytics Endpoints =====
  // Overview (wildcard host)
  http.get("*/api/v1/analytics/overview", async ({ request }) => {
    const today = new Date().toISOString().slice(0, 10);
    const timeseries = Array.from({ length: 14 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (13 - i));
      return {
        date: d.toISOString().slice(0, 10),
        views: 900 + i * 50,
        watch_hours: 100 + i * 3,
        impressions: 4500 + i * 120,
        ctr: 0.05 + i * 0.001,
      };
    });
    const payload = {
      totals: {
        views: 14000,
        watch_hours: 300,
        avg_view_duration_sec: Math.round((300 * 3600) / 14000),
        ctr: 0.055,
        impressions: 68000,
        likes: 1100,
        comments: 280,
        shares: 160,
        subs_net: 220,
        revenue: 980.75,
      },
      timeseries,
      traffic_sources: [
        { source: "search", views: 5800, watch_hours: 130 },
        { source: "suggested", views: 4700, watch_hours: 110 },
        { source: "browse", views: 2900, watch_hours: 55 },
        { source: "external", views: 900, watch_hours: 18 },
      ],
      retention: Array.from({ length: 20 }, (_, i) => ({ t_sec: i * 15, retention_pct: Math.max(5, 100 - i * 4) })),
      top_videos: Array.from({ length: 6 }, (_, i) => ({
        video_id: 500 + i,
        title: `Vídeo Top ${i + 1}`,
        views: 1200 + i * 250,
        watch_hours: 70 + i * 6,
        ctr: 0.052 + i * 0.002,
        impressions: 22000 + i * 1200,
        avg_view_duration_sec: 310 + i * 12,
        posted_at: today,
        thumbnail_url: "/thumbs/mock.jpg",
      })),
    };
    return HttpResponse.json(payload);
  }),

  // Compare accounts (ids as comma-separated param)
  http.get("*/api/v1/analytics/compare/accounts", async ({ request }) => {
    const url = new URL(request.url);
    const idsParam = url.searchParams.get("ids") || "";
    const ids = idsParam.split(",").map((s) => Number(s)).filter((n) => !Number.isNaN(n));
    const colors = ["#2563eb", "#16a34a", "#f59e0b", "#ef4444", "#9333ea", "#0ea5e9"];
    const series = ids.map((id, idx) => ({
      social_account_id: id,
      label: `Conta ${id}`,
      color: colors[idx % colors.length],
      timeseries: Array.from({ length: 10 }, (_, i) => ({
        date: new Date(Date.now() - (9 - i) * 86400000).toISOString().slice(0, 10),
        views: 800 + idx * 150 + i * 40,
        watch_hours: 40 + idx * 10 + i * 2,
      })),
    }));
    const kpis = ids.map((id, idx) => ({
      social_account_id: id,
      views: 12000 + idx * 1200,
      watch_hours: 380 + idx * 28,
      ctr: 0.05 + idx * 0.003,
      impressions: 88000 + idx * 6000,
    }));
    return HttpResponse.json({ series, kpis });
  }),

  // Compare platforms
  http.get("*/api/v1/analytics/compare/platforms", async ({ request }) => {
    const payload = {
      platforms: [
        { platform: "youtube", views: 15000, watch_hours: 320, ctr: 0.055, impressions: 70000 },
        { platform: "shorts", views: 8000, watch_hours: 90, ctr: 0.065, impressions: 30000 },
        { platform: "instagram", views: 5000, watch_hours: 60, ctr: 0.045, impressions: 20000 },
      ],
    };
    return HttpResponse.json(payload);
  }),

  // AB thumbnails experiments
  http.get("*/api/v1/analytics/ab-thumbnails", async () => {
    return HttpResponse.json({ experiments: [
      { video_id: 201, variants: [
        { thumbnail_id: 1001, impressions: 20000, ctr: 0.05, views: 3000 },
        { thumbnail_id: 1002, impressions: 18000, ctr: 0.058, views: 3200 },
      ], winner_thumbnail_id: 1002 },
      { video_id: 202, variants: [
        { thumbnail_id: 1003, impressions: 15000, ctr: 0.052, views: 2600 },
        { thumbnail_id: 1004, impressions: 16000, ctr: 0.049, views: 2500 },
      ] },
    ] });
  }),

  // Video retention
  http.get("*/api/v1/analytics/video/:id/retention", async () => {
    return HttpResponse.json({ retention: Array.from({ length: 25 }, (_, i) => ({ t_sec: i * 10, retention_pct: Math.max(3, 100 - i * 3.5) })) });
  }),

  // Limits and quotas
  http.get("*/api/v1/analytics/limits", async () => {
    return HttpResponse.json({ quota_remaining: 80, quota_total: 100, risk: false, warnings: ["Uso de quota perto do limite diário"] });
  }),

  // ===== Notifications & Alerts =====
  http.get("*/api/v1/notifications", async ({ request }) => {
    const url = new URL(request.url)
    const unreadOnly = url.searchParams.get('unread_only') === 'true'
    const base = [
      { id: 1, type: 'system', severity: 'info', title: 'Nova versão disponível', message: 'Confira as novidades da plataforma', created_at: new Date(Date.now() - 3600_000).toISOString(), read_at: null },
      { id: 2, type: 'error', severity: 'critical', title: 'Falha no upload', message: 'Upload do vídeo 123 falhou', created_at: new Date(Date.now() - 1800_000).toISOString(), read_at: null, meta: { job_id: 123 } },
      { id: 3, type: 'quota', severity: 'warning', title: 'Quota próxima do limite', message: 'YouTube Analytics quota 85% usada', created_at: new Date(Date.now() - 7200_000).toISOString(), read_at: new Date().toISOString(), meta: { provider: 'youtube' } },
      { id: 4, type: 'performance', severity: 'warning', title: 'Queda de CTR', message: 'CTR abaixo da média nas últimas 24h', created_at: new Date().toISOString(), read_at: null, meta: { metric: 'ctr', delta: -0.8 } },
      { id: 5, type: 'token', severity: 'warning', title: 'Token expirando', message: 'Reautorize sua conta Google', created_at: new Date().toISOString(), read_at: null },
    ]
    const items = unreadOnly ? base.filter((i) => !i.read_at) : base
    return HttpResponse.json(items)
  }),
  http.patch("*/api/v1/notifications/:id/read", async ({ params }) => {
    const id = Number(params.id)
    return HttpResponse.json({ id, read_at: new Date().toISOString() })
  }),
  http.patch("*/api/v1/notifications/read_all", async () => {
    return HttpResponse.json({ ok: true })
  }),
  http.get("*/api/v1/notifications/stats", async () => {
    return HttpResponse.json({ total: 5, unread: 4, critical: 1, warning: 2, info: 2 })
  }),
  http.get("*/api/v1/alerts/performance", async () => {
    return HttpResponse.json({ alerts: [
      { type: 'ctr', message: 'CTR caiu 12%', severity: 'warning', metric: 'ctr', delta: -0.12 },
      { type: 'views', message: 'Views -8% vs período anterior', severity: 'info', metric: 'views', delta: -0.08 },
    ]})
  }),
  http.get("*/api/v1/alerts/quota", async ({ request }) => {
    const url = new URL(request.url)
    const provider = url.searchParams.get('provider') || 'youtube'
    return HttpResponse.json({ provider, remaining: 1200, quota_max: 10000, reset_at: new Date(Date.now() + 86400_000).toISOString() })
  }),
  
  // ===== Settings Endpoints =====
  // Integrations listing
  http.get("*/api/v1/settings/integrations", async () => {
    const now = Date.now()
    return HttpResponse.json({
      providers: [
        { provider: 'google', status: 'active', scopes: ['openid','email','profile','youtube.readonly'], last_refresh: new Date(now - 7200_000).toISOString(), expires_at: new Date(now + 86400_000).toISOString() },
        { provider: 'instagram', status: 'expired', scopes: ['instagram_basic','pages_read_engagement'], last_refresh: new Date(now - 172800_000).toISOString(), expires_at: new Date(now - 3600_000).toISOString() },
        { provider: 'facebook', status: 'active', scopes: ['pages_manage_metadata','pages_read_engagement'], last_refresh: new Date(now - 3600_000).toISOString(), expires_at: new Date(now + 43200_000).toISOString() },
        { provider: 'tiktok', status: 'disconnected', scopes: [], last_refresh: null, expires_at: null },
        { provider: 'x', status: 'active', scopes: ['tweet.read','users.read'], last_refresh: new Date(now - 5400_000).toISOString(), expires_at: new Date(now + 604800_000).toISOString() },
        { provider: 'openai', status: 'active', scopes: ['api'], last_refresh: new Date(now - 1800_000).toISOString(), expires_at: null },
        { provider: 'suno', status: 'active', scopes: ['api'], last_refresh: new Date(now - 3600_000).toISOString(), expires_at: null },
        { provider: 'invideo', status: 'disconnected', scopes: [], last_refresh: null, expires_at: null },
      ]
    })
  }),
  http.post("*/api/v1/settings/integrations/:provider/reconnect", async ({ params }) => {
    return HttpResponse.json({ ok: true, provider: params.provider })
  }),
  http.delete("*/api/v1/settings/integrations/:provider/revoke", async ({ params }) => {
    return HttpResponse.json({ ok: true, provider: params.provider })
  }),
  
  // AI settings
  http.get("*/api/v1/settings/ai", async () => {
    return HttpResponse.json({ model: 'gpt-5', temperature: 0.7, auto_tags: true, auto_schedule: true, auto_repost: false })
  }),
  http.patch("*/api/v1/settings/ai", async ({ request }) => {
    const body = await request.json().catch(() => ({}))
    return HttpResponse.json({ ok: true, ...body })
  }),
  
  // Notifications settings
  http.get("*/api/v1/settings/notifications", async () => {
    return HttpResponse.json({ data: { performance: true, quota: true, tokens: true, ai_suggestions: true, system: true, channels: { email: true, push: true } } })
  }),
  http.patch("*/api/v1/settings/notifications", async ({ request }) => {
    const body = await request.json().catch(() => ({}))
    return HttpResponse.json({ ok: true, ...body })
  }),
  
  // Preferences
  http.get("*/api/v1/settings/preferences", async () => {
    return HttpResponse.json({ data: { language: 'pt-BR', theme: 'auto', timezone: 'America/Sao_Paulo', dashboard_layout: 'classic' } })
  }),
  http.patch("*/api/v1/settings/preferences", async ({ request }) => {
    const body = await request.json().catch(() => ({}))
    return HttpResponse.json({ ok: true, ...body })
  }),
  
  // Security sessions
  http.get("*/api/v1/settings/security/sessions", async () => {
    const now = Date.now()
    return HttpResponse.json({ sessions: [
      { id: 'sess-1', device: 'Chrome on Windows', ip: '192.168.3.101', last_active: new Date(now - 600_000).toISOString() },
      { id: 'sess-2', device: 'Safari on iOS', ip: '172.21.16.1', last_active: new Date(now - 86400_000).toISOString() },
    ] })
  }),
  http.delete("*/api/v1/settings/security/sessions/:id", async ({ params }) => {
    return HttpResponse.json({ ok: true, id: params.id })
  }),
  
  // Logs
  http.get("*/api/v1/settings/logs", async ({ request }) => {
    const url = new URL(request.url)
    const limit = Number(url.searchParams.get('limit') || 50)
    const levels = ['info','warning','error'] as const
    const sources = ['upload','ai','mcp','posts'] as const
    const logs = Array.from({ length: limit }, (_, i) => ({
      timestamp: new Date(Date.now() - i * 60000).toISOString(),
      level: levels[i % levels.length],
      source: sources[i % sources.length],
      message: `Log ${i + 1} gerado para diagnóstico`
    }))
    return HttpResponse.json({ logs })
  }),
  http.get("*/api/v1/settings/logs/export", async ({ request }) => {
    const url = new URL(request.url)
    const fmt = url.searchParams.get('format') || 'json'
    const payload = { ok: true, format: fmt, generated_at: new Date().toISOString() }
    return HttpResponse.json(payload)
  }),
];