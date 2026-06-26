type Props = {
  selected: string[]
  onChange: (val: string[]) => void
}

const CONTEXTS = ['F11','F12','F03','F04','Analytics','Moderation']

export default function ContextSwitches({ selected, onChange }: Props) {
  const toggle = (key: string) => {
    if (selected.includes(key)) onChange(selected.filter(k => k !== key))
    else onChange([...selected, key])
  }
  return (
    <div className="border rounded-md p-3">
      <h3 className="font-medium mb-2">Ativação por Contexto</h3>
      <div className="flex flex-wrap gap-2">
        {CONTEXTS.map(c => (
          <label key={c} className={`px-2 py-1 rounded border cursor-pointer ${selected.includes(c) ? 'bg-green-50 border-green-300' : ''}`}>
            <input type="checkbox" className="mr-2" checked={selected.includes(c)} onChange={() => toggle(c)} />
            {c}
          </label>
        ))}
      </div>
    </div>
  )
}