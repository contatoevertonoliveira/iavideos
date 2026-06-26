type Props = { aspect: "16:9"|"9:16"|"1:1"; onChange: (a: "16:9"|"9:16"|"1:1") => void };
export default function AspectCropper({ aspect, onChange }: Props) {
  return (
    <div className="space-y-2">
      <label className="text-sm">Aspect ratio</label>
      <div className="flex gap-2">
        {(["16:9","9:16","1:1"] as const).map((a) => (
          <button key={a} onClick={() => onChange(a)} className={`px-2 py-1 border rounded text-xs ${aspect===a?'border-blue-400 bg-blue-400/10':'border-white/20'}`}>{a}</button>
        ))}
      </div>
      <div className="mt-2 h-32 border border-dashed border-white/20 flex items-center justify-center text-xs text-white/60">
        Preview estático ({aspect})
      </div>
    </div>
  );
}