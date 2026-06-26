type Props = { kind: 'video' | 'image' | 'audio' | 'story'; title?: string; src?: string }

export default function MediaPreview({ kind, title, src }: Props) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="text-sm text-white/70">Preview ({kind})</div>
      {!src && (
        <div className="mt-2 h-40 rounded bg-black/40 flex items-center justify-center text-white/70">
          {title || 'Conteúdo gerado'}
        </div>
      )}
      {src && kind === 'image' && (
        <img src={src} alt={title || 'Prévia'} className="mt-2 max-h-96 rounded" />
      )}
      {src && kind === 'video' && (
        <video src={src} controls className="mt-2 w-full rounded" />
      )}
      {src && kind === 'audio' && (
        <audio src={src} controls className="mt-2 w-full" />
      )}
    </div>
  )
}