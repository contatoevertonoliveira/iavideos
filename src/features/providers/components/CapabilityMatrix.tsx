type Props = {
  discovered: string[]
  selected: string[]
  onChange: (val: string[]) => void
}

const ALL: { key: string; label: string; supported?: boolean }[] = [
  { key: 'text_gen', label: 'Text Gen ✅', supported: true },
  { key: 'image_gen', label: 'Image Gen ✅', supported: true },
  { key: 'video_gen', label: 'Video Gen ✅', supported: true },
  { key: 'tts', label: 'TTS ✅', supported: true },
  { key: 'stt', label: 'STT ✅', supported: true },
  { key: 'embeddings', label: 'Embeddings (preview)' },
  { key: 'moderation', label: 'Moderation (preview)' },
]

export default function CapabilityMatrix({ discovered, selected, onChange }: Props) {
  const toggle = (key: string) => {
    if (selected.includes(key)) onChange(selected.filter(k => k !== key))
    else onChange([...selected, key])
  }
  return (
    <div className="border rounded-md p-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium">Capacidades</h3>
        <span className="text-xs text-gray-500">Descobertas: {discovered?.length || 0}</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {ALL.map(item => {
          const isDiscovered = discovered?.includes(item.key)
          const isSelected = selected.includes(item.key)
          const disabled = item.supported === false
          return (
            <label key={item.key} className={`flex items-center gap-2 p-2 rounded border ${isSelected ? 'bg-blue-50 border-blue-300' : 'bg-white'}`}>
              <input type="checkbox" checked={isSelected} disabled={disabled} onChange={() => toggle(item.key)} />
              <span>{item.label}</span>
              {isDiscovered && <span className="text-xs text-green-600">(auto)</span>}
            </label>
          )
        })}
      </div>
      <p className="text-xs text-gray-500 mt-2">Embeddings/Moderation aparecem como preview e podem exigir mapeamento manual no backend.</p>
    </div>
  )
}