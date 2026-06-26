import { Link } from 'react-router-dom'

type Props = {
  missing: Array<'llm' | 'image' | 'video' | 'tts'>
}

export default function AiWarningBanner({ missing }: Props) {
  if (!missing || missing.length === 0) return null
  const msgBase = 'Para criar com IA, ative as integrações necessárias.'
  const kinds = missing.map((k) => (
    ({ llm: 'Texto (LLM)', image: 'Imagem', video: 'Vídeo', tts: 'Voz/TTS' } as Record<string, string>)[k]
  )).join(', ')
  return (
    <div className="rounded-2xl border border-yellow-400/40 bg-yellow-500/10 p-4 text-yellow-100">
      <div className="font-semibold">⚠️ IA não configurada: {kinds}</div>
      <div className="text-sm">{msgBase} Configure em <Link to="/settings/ai" className="underline">IA & Automações</Link> ou gerencie <Link to="/settings/providers" className="underline">Provedores</Link>.</div>
    </div>
  )
}