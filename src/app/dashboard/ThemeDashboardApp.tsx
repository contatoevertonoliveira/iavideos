import React, { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'

type Channel = { id: number; name: string; platform?: string }
type Job = { id: number; channel_id: number | null; status: string; length?: string; created_at?: string; result?: Record<string, any> }
type ChannelDetails = { channel: Channel; last_metric?: { subscribers?: number; views_24h?: number } }
type MediaItem = { id: number; file_name: string; group?: 'video' | 'image' | 'audio' | 'other' | null; thumb_path?: string | null; created_at?: string | null }

function useDashboardData() {
  const channelsQ = useQuery<Channel[]>({
    queryKey: ['channels'],
    queryFn: async () => (await api.get('/channels')).data,
    staleTime: 60_000,
  })
  const jobsQ = useQuery<Job[]>({
    queryKey: ['jobs', { limit: 50 }],
    queryFn: async () => (await api.get('/jobs', { params: { limit: 50 } })).data,
    staleTime: 30_000,
  })
  const detailsQ = useQuery<ChannelDetails[]>({
    queryKey: ['channel-details', channelsQ.data?.map((c) => c.id) ?? []],
    enabled: !!channelsQ.data && channelsQ.data.length > 0,
    queryFn: async () => {
      const res = await Promise.all((channelsQ.data ?? []).map((c) => api.get(`/channels/${c.id}/details`)))
      return res.map((r) => r.data)
    },
    staleTime: 60_000,
  })
  const imagesQ = useQuery<any>({
    queryKey: ['media', { tipo: 'image', page: 1, limit: 8 }],
    queryFn: async () => (await api.get('/media', { params: { tipo: 'image', page: 1, limit: 8 } })).data,
    staleTime: 30_000,
  })
  return { channelsQ, jobsQ, detailsQ, imagesQ }
}

function MetricCard({ label, value, accent }: { label: string; value: React.ReactNode; accent?: 'primary' | 'info' | 'warning' | 'success' }) {
  const accentClass = accent === 'primary' ? 'bg-primary-subtle text-primary' :
    accent === 'info' ? 'bg-info-subtle text-info' :
    accent === 'warning' ? 'bg-warning-subtle text-warning' :
    'bg-success-subtle text-success'
  return (
    <div className="card">
      <div className="card-body d-flex align-items-center justify-content-between">
        <div>
          <p className="text-muted mb-1">{label}</p>
          <h4 className="mb-0">{value}</h4>
        </div>
        <div className={`p-2 rounded ${accentClass}`}>★</div>
      </div>
    </div>
  )
}

export default function ThemeDashboardApp() {
  const { channelsQ, jobsQ, detailsQ, imagesQ } = useDashboardData()
  const [previewId, setPreviewId] = useState<number | null>(null)
  const [hoverShortId, setHoverShortId] = useState<number | null>(null)

  const jobs = Array.isArray(jobsQ.data) ? jobsQ.data : []
  const channels = Array.isArray(channelsQ.data) ? channelsQ.data : []
  const channelDetails = Array.isArray(detailsQ.data) ? detailsQ.data : []

  const totalCreations = jobs.length
  const ytChannels = channels.filter((c) => (c.platform || '').toLowerCase() === 'youtube').length || channels.length
  const totalSubscribers = useMemo(() => channelDetails.reduce((acc, d) => acc + (Number(d?.last_metric?.subscribers) || 0), 0), [channelDetails])
  const totalViews24h = useMemo(() => channelDetails.reduce((acc, d) => acc + (Number(d?.last_metric?.views_24h) || 0), 0), [channelDetails])

  const latestVideos = jobs.filter((j) => !['short','reels'].includes((j.length || '').toLowerCase())).slice(0, 8)
  const latestShorts = jobs.filter((j) => ['short','reels'].includes((j.length || '').toLowerCase())).slice(0, 8)
  const imageItems: MediaItem[] = Array.isArray(imagesQ.data)
    ? (imagesQ.data as MediaItem[]).slice(0, 8)
    : ((imagesQ.data?.items as MediaItem[]) || [])

  // Removido: gráfico de histórico de criações

  return (
    <div className="container-fluid">
      <div className="row mb-4 align-items-center">
        <div className="col">
          <h3 className="mb-1">Dashboard</h3>
          <p className="text-muted mb-0">Resumo de conteúdo e canais conectados</p>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3"><MetricCard label="Criações" value={totalCreations} accent="primary" /></div>
        <div className="col-12 col-sm-6 col-xl-3"><MetricCard label="Canais YouTube" value={ytChannels} accent="info" /></div>
        <div className="col-12 col-sm-6 col-xl-3"><MetricCard label="Inscritos (total)" value={totalSubscribers?.toLocaleString?.() || '—'} accent="warning" /></div>
        <div className="col-12 col-sm-6 col-xl-3"><MetricCard label="Views (24h)" value={totalViews24h?.toLocaleString?.() || '—'} accent="success" /></div>
      </div>

      {/* Seção: Últimos Vídeos Criados */}
      <div className="row g-3 mt-1">
        <div className="col-12">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Últimos Vídeos Criados</h5>
              <a className="btn btn-sm btn-outline-secondary" href="/jobs">Ir para Jobs</a>
            </div>
            <div className="card-body">
              <div className="row g-3">
                {latestVideos.length === 0 && (
                  <div className="text-muted">Nenhum vídeo recente</div>
                )}
                {latestVideos.map((j) => (
                  <div key={j.id} className="col-12 col-sm-6 col-lg-3">
                    <div className="card h-100">
                      <div
                        className="card-img-top ratio ratio-16x9 mini-player-thumb"
                        onClick={() => setPreviewId(j.id)}
                        role="button"
                        title="Abrir player"
                      >
                        <img
                          className="object-fit-cover w-100 h-100"
                          src={String(j.result?.thumbnail_url || j.result?.thumb || j.result?.preview || '') || undefined}
                          alt="thumb"
                          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                        />
                        <div className="overlay">
                          <div className="mini-player-play">▶</div>
                        </div>
                      </div>
                      <div className="card-body">
                        <div className="d-flex align-items-center justify-content-between mb-2">
                          <span className="badge bg-white/10 text-white border border-white/10">{j.status}</span>
                          <span className="text-muted small">#{j.id}</span>
                        </div>
                        <div className="text-muted small">Canal: {j.channel_id ?? '—'}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Seção: Shorts e Reels */}
      <div className="row g-3 mt-1">
        <div className="col-12">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Shorts & Reels</h5>
              <a className="btn btn-sm btn-outline-secondary" href="/jobs">Ir para Jobs</a>
            </div>
            <div className="card-body">
              <div className="row g-3">
                {latestShorts.length === 0 && (
                  <div className="text-muted">Nenhum short/reel recente</div>
                )}
                {latestShorts.map((j) => (
                  <div key={j.id} className="col-12 col-sm-6 col-lg-3">
                    <div className="card h-100">
                      <div
                        className="card-img-top ratio ratio-9x16 mini-player-thumb"
                        onMouseEnter={() => setHoverShortId(j.id)}
                        onMouseLeave={() => setHoverShortId((v) => (v === j.id ? null : v))}
                        onClick={() => setPreviewId(j.id)}
                        role="button"
                        title="Abrir player"
                      >
                        {hoverShortId === j.id ? (
                          <video
                            muted
                            playsInline
                            autoPlay
                            loop
                            className="rounded object-fit-cover w-100 h-100"
                            src={`${api.defaults.baseURL}/jobs/${j.id}/preview`}
                          />
                        ) : (
                          <img
                            className="object-fit-cover w-100 h-100"
                            src={String(j.result?.thumbnail_url || j.result?.thumb || j.result?.preview || '') || undefined}
                            alt="thumb"
                            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                          />
                        )}
                        <div className="overlay">
                          <div className="mini-player-play">▶</div>
                        </div>
                      </div>
                      <div className="card-body">
                        <div className="d-flex align-items-center justify-content-between mb-2">
                          <span className="badge bg-white/10 text-white border border-white/10">{j.status}</span>
                          <span className="text-muted small">#{j.id}</span>
                        </div>
                        <div className="text-muted small">Canal: {j.channel_id ?? '—'}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Seção: Últimas Imagens */}
      <div className="row g-3 mt-1">
        <div className="col-12">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Últimas Imagens</h5>
              <a className="btn btn-sm btn-outline-secondary" href="/gallery">Abrir Galeria</a>
            </div>
            <div className="card-body">
              <div className="row g-3">
                {imageItems.length === 0 && (
                  <div className="text-muted">Nenhuma imagem recente</div>
                )}
                {imageItems.map((m) => (
                  <div key={m.id} className="col-12 col-sm-6 col-lg-3">
                    <div className="card h-100">
                      <div className="card-img-top ratio ratio-1x1">
                        <img
                          className="object-fit-cover w-100 h-100"
                          src={`${api.defaults.baseURL}/media/${m.id}/${m.thumb_path ? 'thumbnail' : 'file'}`}
                          alt={String(m.created_at || m.id)}
                          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                        />
                      </div>
                      <div className="card-body">
                        <div className="d-flex align-items-center justify-content-between mb-2">
                          <span className="badge bg-white/10 text-white border border-white/10">Imagem</span>
                          <span className="text-muted small">#{m.id}</span>
                        </div>
                        <div className="text-muted small">{m.created_at?.slice(0, 10) || ''}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de player */}
      {previewId !== null && (
        <div className="fixed inset-0 z-50 d-flex align-items-center justify-content-center" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="bg-cine-surface border border-cine rounded-2xl p-3" style={{ width: '92%', maxWidth: 960 }}>
            <div className="d-flex align-items-center justify-content-between mb-2">
              <div className="text-cine text-base">Preview do Job #{previewId}</div>
              <button className="btn btn-sm btn-outline-secondary" onClick={() => setPreviewId(null)}>Fechar</button>
            </div>
            <div className="rounded overflow-hidden" style={{ aspectRatio: '16/9' }}>
              <video controls autoPlay src={`${api.defaults.baseURL}/jobs/${previewId}/preview`} className="w-100 h-100" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}