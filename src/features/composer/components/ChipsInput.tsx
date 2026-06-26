import { useState } from "react";

export default function ChipsInput({ value, onChange, placeholder = "Adicionar tag" }: { value: string[]; onChange: (tags: string[]) => void; placeholder?: string }) {
  const [input, setInput] = useState("");
  const addChip = () => {
    const t = input.trim();
    if (!t) return;
    onChange([...value, t]);
    setInput("");
  };
  const removeChip = (i: number) => {
    onChange(value.filter((_, idx) => idx !== i));
  };
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {value.map((t, i) => (
          <span key={`${t}-${i}`} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white/10 text-xs">
            #{t}
            <button className="text-white/60" onClick={() => removeChip(i)}>✕</button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input className="flex-1 border rounded px-2 py-1 text-sm bg-transparent" value={input} onChange={(e)=>setInput(e.target.value)} placeholder={placeholder} onKeyDown={(e)=>{ if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addChip(); } }} />
        <button className="px-2 py-1 text-sm rounded bg-white/10 border border-white/20" onClick={addChip}>Adicionar</button>
      </div>
    </div>
  );
}