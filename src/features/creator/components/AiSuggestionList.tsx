type Suggestion = { title: string; summary: string }

type Props = {
  suggestions: Suggestion[]
  onChoose: (index: number) => void
  chosenIndex: number | null
}

export default function AiSuggestionList({ suggestions, onChoose, chosenIndex }: Props) {
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {suggestions.map((s, i) => (
        <button
          key={i}
          className={`text-left rounded-xl border p-4 ${chosenIndex === i ? 'border-[#06B6D4] bg-[#06B6D4]/10' : 'border-white/10 bg-white/5'}`}
          onClick={() => onChoose(i)}
        >
          <div className="font-semibold text-white">{s.title}</div>
          <div className="text-sm text-white/80">{s.summary}</div>
        </button>
      ))}
    </div>
  )
}