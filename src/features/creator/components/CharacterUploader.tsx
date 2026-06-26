import { useState } from 'react'

type Character = { name: string; description: string; face?: File | null }

type Props = {
  characters: Character[]
  setCharacters: (chars: Character[]) => void
}

export default function CharacterUploader({ characters, setCharacters }: Props) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [face, setFace] = useState<File | null>(null)

  function addCharacter() {
    if (!name) return
    setCharacters([...characters, { name, description, face }])
    setName('')
    setDescription('')
    setFace(null)
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
      <div className="grid gap-2 sm:grid-cols-[1fr_1fr]">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome" className="rounded bg-white/5 border border-white/10 px-3 py-2 text-white" />
        <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descrição" className="rounded bg-white/5 border border-white/10 px-3 py-2 text-white" />
      </div>
      <input type="file" accept="image/*" onChange={(e) => setFace(e.target.files?.[0] || null)} className="text-white/80" />
      <div>
        <button type="button" onClick={addCharacter} className="px-3 py-2 rounded-lg border border-white/10 bg-white/10 text-white">Adicionar personagem</button>
      </div>
      {characters.length > 0 && (
        <div className="mt-2 text-sm text-white/80">{characters.length} personagem(ns) adicionados</div>
      )}
    </div>
  )
}