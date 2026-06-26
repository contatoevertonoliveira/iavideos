# Automatizador de Vídeos – Frontend

Este frontend usa React + TypeScript + Vite, integra autenticação Google OAuth e possui cobertura de testes unitários/integrados (Vitest) e E2E (Playwright).

## Pré-requisitos
- Node.js 18+
- Instalar dependências: `npm install`
- Variáveis de ambiente comuns (arquivo `.env`):
  - `VITE_API_BASE` (padrão: `http://localhost:8000/api/v1`)
  - `VITE_GOOGLE_CLIENT_ID` (para fluxo real com GIS)

## Executar o app
- Dev server: `npm run dev` (abre em `http://localhost:5175` — porta fixa)
- Prévia de produção: `npm run build && npm run preview`

### Configuração de portas
- O Vite está configurado com `server.port=5175`, `strictPort=true` e `host=true` em `vite.config.ts`, garantindo que o dev server sempre rode em `http://localhost:5175/`.
- A base da API é definida via `VITE_API_BASE` no arquivo `.env` (padrão recomendado: `http://127.0.0.1:8000/api/v1`).

## Testes (Vitest)
- Rodar todos os testes unitários/integrados:
  - `npm run test`
- Ambiente de testes:
  - `jsdom` para componentes
  - MSW configurado em `src/test/setup.ts` para mockar a API
- Coberturas relevantes dos critérios de aceite:
  - Persistência no `localStorage` (chave `av-auth`) validada em `src/app/layout/AppShell.UserBadge.test.tsx`
  - Fluxo `/auth/google/exchange` positivo: `src/features/auth/google-flow.int.test.tsx`
- Fluxo `/auth/google/exchange` negativo: `src/features/auth/google-flow.negative.test.tsx`

## Cenário F06 — Analytics

- Métricas e glossário:
  - `Views`, `Watch hours`, `Impressions`, `CTR` (cliques / impressões), `Avg. view duration` (segundos), `Likes`, `Comments`, `Shares`, `Subs (net)`, `Revenue`.
- Painel Overview:
  - Filtro global de `conta + plataforma + período` com presets.
  - KPIs com delta vs período anterior, tooltips explicativos e alertas de quota.
  - Gráficos: série temporal (views/watch/impressions/CTR), pizza de tráfego, retenção.
  - Exportações: CSV (timeseries) e PNG dos gráficos (via `html2canvas`).
- Comparativos:
  - Entre contas sociais e entre plataformas, com linhas múltiplas e tabela agregada.
- Top Vídeos:
  - Ordenação por `views/watch/CTR`, busca por título e paginação.
- Detalhe de Vídeo:
  - Curva de retenção e CTR por origem.
- A/B Thumbnails:
  - Variantes com cálculo de vencedor por maior `CTR`.

Como filtrar, comparar e exportar:
- Use os seletores no topo das páginas de Analytics para escolher conta/plataforma e intervalo.
- Botões de exportação estão próximos dos gráficos/tabelas e geram CSV/PNG.

Observações de escopos/quotas e latências:
- Todas as chamadas enviam `social_account_id` e podem exibir CTA de reautorização quando faltarem escopos (ex.: `yt-analytics.readonly`).
- Em cenários de risco de quota, um aviso é exibido e o frontend pode recorrer a dados em cache/mocks.
- Dados das plataformas podem sofrer latência de algumas horas.

## Testes E2E (Playwright)
- Instalar browsers do Playwright:
  - `npx playwright install`
- Rodar os testes E2E:
  - `npx playwright test`
- O Playwright inicia o servidor de desenvolvimento automaticamente na porta `5175` e seta `VITE_E2E_MODE=true` para evitar o popup do Google e disparar diretamente a rota `/auth/google/exchange`.
- Teste principal:
  - `tests/google-badge.e2e.spec.ts`: confirma que o badge do Google aparece após a conexão, exibe nome/foto, e persiste após `reload`.
  - A rota `**/auth/google/exchange` é interceptada para simular resposta de sucesso.
  - `tests/accounts-multi.e2e.spec.ts`: cobre multi-contas (lista com 2 contas Google, troca da fonte de dados via seletor na tela de Canais e remoção de item da UI ao desvincular). As rotas `**/api/v1/accounts`, `**/api/v1/channels?social_account_id=…` e `**/api/v1/accounts/:id/youtube/channels` são interceptadas com dados diferentes por conta.
- Dicas:
  - Executar em modo visual: `npx playwright test --headed`
  - Abrir trace ao falhar (já configurado como `on-first-retry`)

## Critérios de Aceite (Checklist)
- UserBadge renderiza nome/foto/badge com dados retornados do Google.
- Persistência no `localStorage` com chave `av-auth` validada.
- Fluxo `/auth/google/exchange` coberto (positivo e negativo).
- E2E confirma UI visível e persistente após `reload`.
- Multi-contas: listar mais de uma conta por provedor, alterar contas ativas na tela de Canais e impedir acesso indevido entre usuários (coberto no backend). UI atualiza ao desvincular.

## Pastas úteis
- `src/features/auth/GoogleConnect.tsx`: fluxo de autenticação Google; em modo E2E (`VITE_E2E_MODE=true`), o clique dispara `/auth/google/exchange` diretamente.
- `src/mocks/handlers.ts`: handlers MSW do endpoint de exchange.
- `src/mocks/handlers.ts`: extendido para `/accounts`, `/channels` e `/accounts/:id/youtube/channels` em testes RTL.
- `src/app/layout/AppShell.UserBadge.test.tsx`: testes do componente `UserBadge`.
- `tests/google-badge.e2e.spec.ts`: teste E2E do badge.
- `tests/accounts-multi.e2e.spec.ts`: teste E2E para fluxo de multi-contas.

## Troubleshooting
- Se o E2E não interceptar a rota, verifique se o servidor está na porta `5175` e se `VITE_E2E_MODE=true` está ativo (o `playwright.config.ts` já define).
- Para testar manualmente: acesse `http://localhost:5175/configuracoes/contas`, clique em “Conectar com Google” e verifique o badge “Google” com nome/Avatar. Atualize a página e confirme que permanece visível.

## Cenário F03 — Assistente de Conteúdo (IA + SEO)

### Como usar `/assistant`
- Inicie o dev server: `npm run dev` e acesse `http://localhost:5175/assistant`.
- Preencha Título/Descrição/Tags no editor e use:
  - `Gerar Sugestões` para obter variações (geral e por plataforma).
  - `Refinar` para ajustar com palavras-chave/tonalidades.
- Adote uma sugestão com `Usar`, copie com `Copiar` ou refine por plataforma.
- Execute `Score` para ver gauges e issues; aplique correções rápidas em `Aplicar`.
- Veja a pré-visualização por plataforma (abas) com truncagem de título/descrição.
- Revise o checklist de conformidade e siga as dicas.
- Avalie thumbnails, execute rank de IA e faça seleção A/B.
- Veja os melhores horários (lista/top 3) com timezone.
- `Aplicar ao Post` prepara e salva no backend para uso no F02 (fila/postagem).

### Dependências de backend (rotas) e variáveis de ambiente
- Variáveis `.env` do frontend:
  - `VITE_API_BASE` (ex.: `http://127.0.0.1:8000/api/v1`).
  - `VITE_USE_MOCKS` (`true` para usar MSW e dados mockados).
- Rotas esperadas no backend (exemplos a integrar):
  - `POST /assistant/suggest` — gerar sugestões.
  - `POST /assistant/score` — calcular score/gauges/issues.
  - `GET  /assistant/thumbnails` — listar thumbnails.
  - `POST /assistant/thumbnails/rank` — rankear thumbnails (A/B).
  - `GET  /assistant/best-times` — horários recomendados.
  - `POST /assistant/prepare-post` — salvar alterações no post para F02.

### Como ativar mocks
- Ative `VITE_USE_MOCKS=true` no `.env` do frontend.
- Com MSW ativo, as rotas acima são simuladas para permitir navegação completa sem backend.
- Útil para validação de UI, fluxos e testes de componentes.

### Limites por plataforma (resumo)
- `YouTube`: Título ≤ `100` | Descrição ≤ `5000` | Tags (total) ≤ `500` chars.
- `Shorts/Instagram/TikTok`: Descrição `150–220` | Hashtags `2–3`.
- `X (Twitter)`: Texto ≤ `280` | Hashtags ≤ `2`.
- A pré-visualização aplica truncagem conforme plataforma ativa.

### ✅ Critérios de Aceite (DoD)
- Gera sugestões IA e permite adotar/editar rapidamente.
- Calcula score e issues com quick fixes aplicáveis.
- Mostra pré-visualização por plataforma com truncagem correta.
- Checklist marca limites e regras essenciais com ícones e dicas.
- Mostra thumbnails, executa rank de IA e permite escolha/A/B.
- Best times carregado e exibido (lista top 3 ou heatmap simplificado).
- `Aplicar ao Post` salva no backend para uso no F02 (fila/postagem).

## Cenário F04 — Composer Multiplataforma

### Visão geral
- Fluxo único para selecionar múltiplas contas/plataformas (YouTube, Shorts, Instagram, TikTok, Facebook, X) e editar título/descrição/tags por plataforma, com validações em tempo real e pré-visualização.
- Suporta seleção de miniaturas e legendas por item, além de proporção de aspecto (16:9, 9:16, 1:1) e privacidade quando aplicável.

### Como iniciar um crosspost
- Acesse `/composer/new?video_post_id=XYZ&media_asset_id=ABC`.
- Use o `AccountSelector` para marcar contas por provedor (checkboxes). Cada marcação cria um item em `items[]` com configuração padrão.
- Navegue entre `PlatformTabs` (uma aba por item; mostra nome da conta e provedor). Use o botão “Duplicar para outras contas do mesmo provedor” para copiar o formulário ativo para as demais contas do mesmo provedor.
- No `PlatformForm`, preencha título, descrição, tags (chips), privacidade (se houver), agendamento, miniatura e legendas. O `AspectCropper` salva apenas metadados de aspect/crop.
- O `PolicyChecklist` atualiza ✔/⚠/✖ por plataforma em tempo real, usando `validateFor`.
- Botões: “Salvar rascunho”, “Pré-visualizar” (`/composer/preview`) e “Avançar para revisão”.

### Revisão e Enfileirar
- Em `/composer/:id/review`, veja cartões por item com campos finais, warnings e edição inline (título/descrição).
- Se faltar escopo (ex.: YouTube upload, Instagram content publish), a página exibe CTA “Reautorizar conta X com escopo Y” e bloqueia apenas a plataforma afetada. O botão “Enfileirar publicações” fica desabilitado até resolver.
- Ao enfileirar (`/composer/queue`), o backend retorna `enqueued[]` com `job_id`. Em seguida você é redirecionado para `/composer/:id/summary` para visualizar os jobs (provider, conta, job_id) e link para `/posts/queue`.

### Validações por plataforma
- `limits` e `validateFor` aplicam truncagens e regras por provedor: título/descrição máximos, hashtags no Instagram, recomendação 9:16 para verticais (Shorts/Reels/TikTok), etc.

### Legendagens, Thumbnail e Aspect
- `SubtitlesPicker` lista SRT/VTT existentes por `media_asset_id` e permite seleção.
- `ThumbnailPicker` permite escolher outra thumb por item.
- `AspectCropper` apenas salva `aspect` e metadados de corte (não transcodifica).

### Falta de escopo (reautorizar)
- Apenas listar contas do usuário logado (`/accounts`). Cada conta pode incluir `scopes[]` exigidos por provedor.
- Antes de enfileirar, checamos escopos por item. Se faltar, exibimos CTA de reautorização e travamos o item.

### Critérios de Aceite (DoD)
- Seleção de múltiplas contas/plataformas em um único fluxo.
- Edição independente de título/descrição/tags por plataforma.
- `AspectCropper` e `SubtitlesPicker` funcionais por item.
- Checklist e Prévia por plataforma.
- Queue cria um job por item, com sucesso reportado.
- Cenários de falta de escopo bloqueiam apenas a plataforma afetada, com CTA claro.
- Testes unitários/integração/E2E passando.

## Cenário F07 — Alertas e Inbox

### Visão geral
- Sistema de notificações em tempo real (SSE) com toasts e badge no topo.
- Inbox com listagem, filtros (tipo/severidade/lida) e modal de detalhes.
- Centro de Alertas com abas para Performance, Quota e Tokens.
- Widget de resumo no topo do Dashboard com links para o Centro de Alertas.

### Rotas e páginas
- `/inbox` e `/inbox/:id` — Caixa de entrada e detalhe (abre modal).
- `/alerts` — Centro de Alertas (abas: Performance, Quota, Tokens).

### Estado e SSE
- Store Zustand: `src/features/alerts/useNotifications.ts` mantém `items`, `unreadCount`, `loading` e ações (`fetchAll`, `markAsRead`, `markAllAsRead`).
- Hook de SSE: `useNotificationsSSE` integra o `src/lib/useSSE.ts` e consome eventos `notification_new`, `job_failed`, `token_expired`, `quota_warning`, adicionando itens ao store e exibindo toasts (`toastSuccess`, `toastError`, `toastInfo`).

### Componentes principais
- `NotificationsBell` — sino na Topbar com badge, dropdown (últimas 5) e ação “Marcar todas como lidas”.
- `InboxPage` — integra `NotificationList`, `NotificationFilters` e `NotificationDetailsModal`.
- `AlertCenter` — consome `/alerts/performance` e `/alerts/quota`; usa `PerformanceAlertCard` e `QuotaBar`.
- `WidgetAlertsSummary` — widget de resumo no Dashboard; consome `/notifications/stats`.

### Mocks MSW (quando `VITE_USE_MOCKS=true`)
- Endpoints simulados em `src/mocks/handlers.ts`:
  - `GET /api/v1/notifications` (com filtros `unread`), `POST /api/v1/notifications/:id/read`, `POST /api/v1/notifications/read_all`, `GET /api/v1/notifications/stats`.
  - `GET /api/v1/alerts/performance` e `GET /api/v1/alerts/quota`.
- Com mocks, a Inbox e o Centro de Alertas carregam dados sem backend real.
- Eventos SSE devem ser validados com backend; em mocks, foque na UX de listagem/filtros/modais.

### Como validar rapidamente
- Inicie o dev server: `npm run dev`.
- Acesse `http://localhost:5175/inbox` para ver a caixa de entrada com filtros e modal.
- Acesse `http://localhost:5175/alerts` para ver os cards de Performance e Quota.
- No Dashboard (`/`), confira o widget “Alertas” no topo.
- Observação: é possível sobrescrever a porta via CLI (ex.: `npm run dev -- --port 5300`). O padrão do projeto permanece `5175` com `strictPort=true`.

### ✅ Critérios de Aceite (DoD)
- Sino de notificações com badge atualizando em tempo real.
- Dropdown mostra últimas notificações e ação de “Marcar todas como lidas”.
- Inbox lista, filtra por tipo/severidade/lida e abre modal de detalhes.
- Centro de Alertas exibe Performance e Quota (Tokens como placeholder inicial).
- Widget de resumo aparece no topo do Dashboard com links para `/alerts`.
- Integra SSE: novas notificações aparecem sem recarregar (validado com backend real).

## Cenário F09 — Admin & RBAC

### Papéis e permissões
- `superAdmin`: acesso total; pode executar seed, alterar papéis e excluir recursos diretamente.
- `moderator`: vê dados; não exclui diretamente — envia solicitações de exclusão para aprovação.
- `viewer`: apenas navega/visualiza; não vê botões de criar/editar/excluir.

### Seed de usuários
- Botão “Seed usuários” em `/admin/users` (visível apenas para `superAdmin`).
- Ao clicar, faz `POST /api/v1/admin/users/seed` (idempotente):
  - Cria/garante três usuários com papéis:
    - `everoliver` — `superAdmin`
    - `everoliver02` — `moderator`
    - `everoliver03` — `viewer`
- Senhas são armazenadas com hash no backend e nunca exibidas no frontend.

### Fluxo de exclusão com aprovação
- Em telas com ação de excluir (ex.: `videoposts`):
  - `superAdmin`: botão “Excluir” efetivo (`DELETE`).
  - `moderator`: botão vira “Solicitar exclusão” → abre modal com razão → `POST /api/v1/admin/requests`.
  - `viewer`: ação oculta.
- Página `/admin/requests`:
  - Lista pendentes com `resource`, `resource_id`, `author`, `reason`, `data`.
  - Botões: “Aprovar” (executa exclusão real) e “Rejeitar” (registra comentário).
  - Emite toasts de sucesso/erro conforme ação.

### SSE de Admin
- Eventos em tempo real via `GET /api/v1/sse/admin`:
  - `request_created`: nova solicitação pendente.

## Cenário F10 — Autenticação Local & Gates

### Como funciona
- Login local em `/login` com email/senha; tokens e perfil são salvos em `useAuthStore`.
- Todo o app é protegido por `RequireLocalAuth`; sem token, redireciona para `/login`.
- Após login, o contexto RBAC é carregado via `GET /me/context` (ou fallback `GET /api/v1/auth/me`).
- Rotas de criação/publicação usam `RequireConnectedAccount` e exibem modal lembrete quando não há contas conectadas (`GET /api/v1/accounts`).
- Super Admin tem página `/admin/billing` para alternar o modo do site (gratuito vs assinantes). Os planos ficam desativados (visual “Em breve”).

### Rotas
- `/login`: tela de login moderna.
- Protegidas: todas as demais sob `RequireLocalAuth`.
- Gates de publicação: `/posts/new`, `/composer/new`, `/posts/queue`.
- Admin billing: `/admin/billing` sob `RequireSuperAdmin`.

### Endpoints (frontend)
- `POST /api/v1/auth/login` (query: `email`, `password`).
- `GET /me/context` preferencial; fallback `GET /api/v1/auth/me`.
- `GET /api/v1/accounts`.
- `GET/PATCH /api/v1/admin/billing/settings` (quando disponível).

### Critérios de Aceite (DoD)
- Login local funcional, UI moderna e responsiva.
- App protegido: sem login não cria/edita/posta.
- Lembrete/CTA ao publicar sem contas vinculadas.
- Contexto RBAC aplicado imediatamente após login; menu Admin aparece apenas para `superAdmin`.
- Página de billing admin com toggle de `site_mode` (default: gratuito) e 3 planos desativados.
- Testes unitários (Vitest + RTL) e E2E (Playwright) cobrindo os fluxos principais.
  - `request_resolved`: solicitação aprovada/rejeitada (atualiza contadores/badges).
- O stream filtra itens por papel do usuário (superAdmin vê todos, moderator vê os próprios).

### UI/UX
- `RoleBadge` com cores: superAdmin (vermelho/elite), moderator (amarelo), viewer (cinza).
- Tooltips em botões bloqueados: “Requer superAdmin” ou “Envie solicitação de exclusão para aprovação”.
- Tabelas admin com busca/ordenação/paginação.
- Logs/Audit: badge de nível (info/warn/err) e copy-to-clipboard do `eventId`.

### Segurança
- JWT inclui `role` e `user_id` nas claims (frontend usa apenas para conveniência; backend reconfirma papel em toda rota sensível).
- Requests de aprovação registram `author_id`, `reviewer_id`, `timestamps`, `ip`.
- Não exponha o endpoint de seed em produção sem proteção (mantenha atrás de role `superAdmin`).
- Opcional: forçar troca de senha no primeiro login (controlado no backend).

### Testes (Vitest + RTL)
- `useRBAC` retorna `can()` correto para cada role.
- `GuardedAction` oculta/mostra botões conforme role.
- `UsersPage`:
  - `superAdmin` vê “Seed usuários” e pode alterar role.
  - `moderator/viewer` não veem controles de papel.
- Fluxo de exclusão:
  - `moderator` → abre modal → cria request (checar `POST`).
  - `superAdmin` → aprova request → dispara `DELETE` mock; estado é atualizado.
- Audit:
  - `superAdmin` pode exportar logs; outros não (botão ausente/desabilitado).

### E2E (Playwright)
- Login `superAdmin` (`everoliver`) → acessar `/admin/users` → executar “Seed usuários” (idempotente).
- Logout, login `moderator` (`everoliver02`) → tentar excluir um videopost → abre modal → envia solicitação → sucesso.
- Voltar com `superAdmin` → `/admin/requests` → aprovar → item some; verificar que o post foi removido.
- `viewer` (`everoliver03`) → navegar pelo sistema → nenhum botão de criar/editar/excluir visível.

### ✅ Critérios de Aceite (DoD)
- Seed cria/garante os 3 usuários com seus papéis.
- RBAC funcional no frontend (UI + guards) e validado no backend por role.
- Moderador não consegue excluir diretamente, mas cria solicitação.
- `superAdmin` aprova/recusa solicitações; exclusões efetivas apenas após aprovação.
- `viewer` só navega/visualiza.
- Testes unitários + E2E passando.
