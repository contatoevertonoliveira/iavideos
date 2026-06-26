type Props = {
  llmOk?: boolean
  imageOk?: boolean
  videoOk?: boolean
  ttsOk?: boolean
  loading?: boolean
}

const Dot = ({ ok, label, loading }: { ok?: boolean; label: string; loading?: boolean }) => (
  <div className="flex items-center gap-2 text-xs">
    <span
      className={[
        'inline-block h-2.5 w-2.5 rounded-full',
        loading ? 'bg-gray-400' : ok ? 'bg-emerald-400' : 'bg-red-500',
      ].join(' ')}
      title={loading ? 'Verificando…' : ok ? `${label} ok` : `${label} não conectado`}
    />
    <span className="text-white/80">{label}</span>
  </div>
)

export default function AiStatusBar({ llmOk, imageOk, videoOk, ttsOk, loading }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-3">
      <Dot ok={llmOk} label="Texto (LLM)" loading={loading} />
      <Dot ok={imageOk} label="Imagem" loading={loading} />
      <Dot ok={videoOk} label="Vídeo" loading={loading} />
      <Dot ok={ttsOk} label="Voz/TTS" loading={loading} />
    </div>
  )
}