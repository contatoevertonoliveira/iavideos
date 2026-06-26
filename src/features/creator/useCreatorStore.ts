import { create } from 'zustand'
import { api } from '@/lib/api'

type Mode = 'guided' | 'semi' | 'auto' | null

type CreatorState = {
  mode: Mode
  steps: any[]
  story?: string
  characters: any[]
  media?: { video?: string; audio?: string; images?: string[] }
  title?: string
  description?: string
  tags?: string[]
  connectedPlatforms: string[]
  // Produção (persistência para retomada)
  productionTaskId?: string | null
  productionStatus?: string
  productionPreviewUrl?: string
  productionError?: string | null
  productionJobId?: number | null
  chosenSuggestionIndex?: number | null
  publicationEntries?: Array<{ id: number; platform: string; status: string; external_id?: string | null; error_message?: string | null }>
  publicationJobStatus?: string | null
  setMode: (m: NonNullable<Mode>) => void
  pushStep: (step: any) => void
  setMedia: (m: CreatorState['media']) => void
  setStory: (s?: string) => void
  setCharacters: (c: any[]) => void
  setTitle: (t?: string) => void
  setDescription: (d?: string) => void
  setTags: (t?: string[]) => void
  setConnectedPlatforms: (p: string[]) => void
  setProductionTaskId: (id: string | null) => void
  setProductionStatus: (s: string) => void
  setProductionPreviewUrl: (u: string) => void
  setProductionError: (e: string | null) => void
  setProductionJobId: (id: number | null) => void
  setChosenSuggestionIndex: (index: number | null) => void
  refreshPublicationProgress: (jobId: number) => Promise<void>
  resetProduction: () => void
}

export const useCreatorStore = create<CreatorState>((set) => ({
  mode: null,
  steps: [],
  story: undefined,
  characters: [],
  media: {},
  title: undefined,
  description: undefined,
  tags: [],
  connectedPlatforms: [],
  productionTaskId: null,
  productionStatus: '',
  productionPreviewUrl: '',
  productionError: null,
  productionJobId: null,
  chosenSuggestionIndex: null,
  publicationEntries: [],
  publicationJobStatus: null,
  setMode: (m) => set({ mode: m }),
  pushStep: (step) => set((s) => ({ steps: [...s.steps, step] })),
  setMedia: (m) => set({ media: m }),
  setStory: (s) => set({ story: s }),
  setCharacters: (c) => set({ characters: c }),
  setTitle: (t) => set({ title: t }),
  setDescription: (d) => set({ description: d }),
  setTags: (t) => set({ tags: t || [] }),
  setConnectedPlatforms: (p) => set({ connectedPlatforms: p }),
  setProductionTaskId: (id) => set({ productionTaskId: id }),
  setProductionStatus: (s) => set({ productionStatus: s }),
  setProductionPreviewUrl: (u) => set({ productionPreviewUrl: u }),
  setProductionError: (e) => set({ productionError: e }),
  setProductionJobId: (id) => set({ productionJobId: id }),
  setChosenSuggestionIndex: (index) => set({ chosenSuggestionIndex: index }),
  refreshPublicationProgress: async (jobId: number) => {
    try {
      const [pubRes, jobRes] = await Promise.all([
        api.get('/publications', { params: { job_id: jobId } }),
        api.get(`/jobs/${jobId}`),
      ])
      const publications = Array.isArray(pubRes.data) ? pubRes.data : pubRes.data?.items ?? []
      const entries = publications.map((p: any) => ({
        id: p.id,
        platform: p.platform,
        status: p.status,
        external_id: p.external_id ?? null,
        error_message: p.error_message ?? null,
      }))
      const jobStatus = jobRes.data?.status ?? null
      set({ publicationEntries: entries, publicationJobStatus: jobStatus })
    } catch (_) {
      // ignore errors
    }
  },
  resetProduction: () => set({ productionTaskId: null, productionStatus: '', productionPreviewUrl: '', productionError: null, productionJobId: null, chosenSuggestionIndex: null, publicationEntries: [], publicationJobStatus: null }),
}))