type Block = { type: string; content: string }

type Props = { blocks: Block[] }

export default function DreamCanvas({ blocks }: Props) {
  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-white/0 p-4">
      <div className="text-sm font-medium text-white/80 mb-2">Roteiro Vivo</div>
      <div className="space-y-2">
        {blocks.map((b, i) => (
          <div key={i} className="rounded-xl bg-white/[0.06] border border-white/10 p-3">
            <div className="text-xs uppercase tracking-wide text-white/60">{b.type}</div>
            <div className="text-white mt-1 whitespace-pre-wrap">{b.content}</div>
          </div>
        ))}
      </div>
    </div>
  )
}