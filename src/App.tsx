import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { cn } from './lib/utils'
import AppShell from './app/layout/AppShell'
import DashboardHome from './app/dashboard/DashboardHome'
import ThemeDashboardApp from './app/dashboard/ThemeDashboardApp'

import Dashboard from './app/dashboard/Dashboard'
import Create from './app/create/Create'
import Channels from './app/channels/Channels'
import StoryDetail from './app/stories/StoryDetail'
import CollectionsPage from './app/collections/CollectionsPage'
import ChannelDetails from './app/channels/ChannelDetails'
import Jobs from './app/jobs/Jobs'
import JobDetails from './app/jobs/JobDetails'
import Providers from './app/providers/Providers'
import AnalyticsHome from './features/analytics/AnalyticsHome'
import ComparePage from './features/analytics/ComparePage'
import VideosRank from './features/analytics/VideosRank'
import VideoDetail from './features/analytics/VideoDetail'
import AbThumbnails from './features/analytics/AbThumbnails'
import SettingsHome from './features/settings/SettingsHome'
import IntegrationsPage from './features/settings/IntegrationsPage'
import AiSettingsPage from './features/settings/AiSettingsPage'
import NotificationsSettings from './features/settings/NotificationsSettings'
import PreferencesPage from './features/settings/PreferencesPage'
import SecurityPage from './features/settings/SecurityPage'
import LogsPage from './features/settings/LogsPage'
import TranscoderSettings from './app/settings/TranscoderSettings'
import NewPost from './app/posts/NewPost'
import Queue from './app/posts/Queue'
import PostDetail from './app/posts/PostDetail'
import Accounts from './app/settings/Accounts'
import AssetsLibrary from './app/assets/AssetsLibrary'
import Characters from './app/characters/Characters'
import CharacterForm from './app/characters/CharacterForm'
import StoryPlanner from './app/story/StoryPlanner'
import Monitoring from './app/monitoring/Monitoring'
import NeuralCineFlowPreview from './app/preview/NeuralCineFlowPreview'
import Publications from './app/publications/Publications'
import AssistantPage from './features/assistant/AssistantPage'
import GalleryPage from './app/gallery/GalleryPage'
import SeriesPage from './app/series/SeriesPage'
import VideosPage from './app/videos/VideosPage'
import AccountsPage from './app/accounts/AccountsPage'
const CalendarPage = React.lazy(() => import('./features/calendar/CalendarPage'))
const CalendarList = React.lazy(() => import('./features/calendar/CalendarList'))
import ComposerList from './features/composer/ComposerList'
import ComposerWizard from './features/composer/ComposerWizard'
import ComposerReview from './features/composer/ComposerReview'
import ComposerSummary from './features/composer/ComposerSummary'
import InboxPage from './features/alerts/InboxPage'
import AlertCenter from './features/alerts/AlertCenter'
import AdminHome from './features/admin/AdminHome'
import UsersPage from './features/admin/UsersPage'
import RequestsPage from './features/admin/RequestsPage'
import AuditPage from './features/admin/AuditPage'
import SystemPage from './features/admin/SystemPage'
import RequireSuperAdmin from './features/admin/RequireSuperAdmin'
import AdminSecretLogin from './features/auth/AdminSecretLogin'
import RequireLocalAuth from './features/auth/RequireLocalAuth'
import LoginDattaAble from './features/auth/LoginDattaAble'
import RequireConnectedAccount from './features/accounts/RequireConnectedAccount'
import BillingSettings from './features/admin/BillingSettings'
import UserProfilePage from './app/profile/UserProfilePage'
// Providers (F13)
import ProviderDetail from './features/providers/ProviderDetail'
import ThemeGuestLayout from './features/theme/ThemeGuestLayout'

export default function App() {
  return (
    <React.Suspense fallback={<div>Carregando…</div>}>
      <Routes>
          {/* Área pública sob layout Guest do tema */}
          <Route element={<ThemeGuestLayout />}>
            <Route path="/login" element={<LoginDattaAble />} />
          </Route>
          {/* Área protegida sob layout AppShell (novo tema) */}
          <Route element={<RequireLocalAuth><AppShell /></RequireLocalAuth>}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            {/* Dashboard com layout do tema (App) */}
            <Route path="/dashboard" element={<ThemeDashboardApp />} />
          <Route path="/create" element={<RequireConnectedAccount><Create /></RequireConnectedAccount>} />
          <Route path="/channels" element={<Channels />} />
          <Route path="/stories/:id" element={<StoryDetail />} />
          <Route path="/collections" element={<CollectionsPage />} />
            <Route path="/channels/:id" element={<ChannelDetails />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/jobs/:id" element={<JobDetails />} />
            <Route path="/publications" element={<Publications />} />
            <Route path="/galeria" element={<GalleryPage />} />
          {/* Novas rotas principais: Séries, Vídeos, Contas */}
          <Route path="/series" element={<SeriesPage />} />
          <Route path="/videos" element={<VideosPage />} />
          <Route path="/contas" element={<AccountsPage />} />
          <Route path="/analytics" element={<AnalyticsHome />} />
          <Route path="/analytics/compare" element={<ComparePage />} />
          <Route path="/analytics/videos" element={<VideosRank />} />
          <Route path="/analytics/video/:id" element={<VideoDetail />} />
          <Route path="/analytics/ab-tests" element={<AbThumbnails />} />
          <Route path="/settings" element={<SettingsHome />} />
          <Route path="/settings/integrations" element={<IntegrationsPage />} />
          <Route path="/settings/ai" element={<AiSettingsPage />} />
          <Route path="/settings/notifications" element={<NotificationsSettings />} />
          <Route path="/settings/preferences" element={<PreferencesPage />} />
          <Route path="/settings/security" element={<SecurityPage />} />
          <Route path="/settings/logs" element={<LogsPage />} />
          <Route path="/settings/transcoder" element={<TranscoderSettings />} />
          {/* Providers management */}
          <Route path="/settings/providers" element={<Providers />} />
          <Route path="/settings/providers/:id" element={<ProviderDetail />} />
          <Route path="/posts/new" element={<RequireConnectedAccount><NewPost /></RequireConnectedAccount>} />
          <Route path="/posts/queue" element={<RequireConnectedAccount><Queue /></RequireConnectedAccount>} />
          <Route path="/posts/:id" element={<PostDetail />} />
          <Route path="/assistant" element={<AssistantPage />} />
          <Route path="/posts/:id/assistant" element={<AssistantPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/calendar/list" element={<CalendarList />} />
          {/* Detalhe rápido pode reutilizar PostCardModal inline; por ora, redireciona para edição */}
          <Route path="/calendar/:id" element={<AssistantPage />} />
          {/* Composer F04 */}
          <Route path="/composer" element={<ComposerList />} />
          <Route path="/composer/new" element={<RequireConnectedAccount><ComposerWizard /></RequireConnectedAccount>} />
          <Route path="/composer/:id/review" element={<ComposerReview />} />
          <Route path="/composer/:id/summary" element={<ComposerSummary />} />
          {/* Alerts & Inbox */}
          <Route path="/inbox" element={<InboxPage />} />
          <Route path="/inbox/:id" element={<InboxPage />} />
          <Route path="/alerts" element={<AlertCenter />} />
          <Route path="/accounts" element={<Accounts />} />
            <Route path="/configuracoes/contas" element={<Accounts />} />
            <Route path="/assets" element={<AssetsLibrary />} />
            <Route path="/characters" element={<Characters />} />
            <Route path="/characters/:id" element={<CharacterForm />} />
            <Route path="/story" element={<StoryPlanner />} />
          <Route path="/monitoring" element={<Monitoring />} />
            {/* Perfil do usuário local */}
            <Route path="/perfil" element={<UserProfilePage />} />
          {/* Redirect opcional mantendo compatibilidade com /movie/:id */}
          <Route path="/movie/:id" element={<Navigate to="/stories/:id" replace />} />
          {/* Rota oculta de login admin (não aparece no menu) */}
            <Route path="/admin/oculto" element={<AdminSecretLogin />} />
            {/* Admin */}
            <Route path="/admin" element={<RequireSuperAdmin><AdminHome /></RequireSuperAdmin>} />
            <Route path="/admin/users" element={<RequireSuperAdmin><UsersPage /></RequireSuperAdmin>} />
            <Route path="/admin/requests" element={<RequireSuperAdmin><RequestsPage /></RequireSuperAdmin>} />
            <Route path="/admin/audit" element={<RequireSuperAdmin><AuditPage /></RequireSuperAdmin>} />
            <Route path="/admin/system" element={<RequireSuperAdmin><SystemPage /></RequireSuperAdmin>} />
            <Route path="/admin/billing" element={<RequireSuperAdmin><BillingSettings /></RequireSuperAdmin>} />
            {/* Rota de preview pode ser desativada para evitar layout duplicado */}
          </Route>
      </Routes>
    </React.Suspense>
  )
}