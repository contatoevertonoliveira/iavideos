export default function SchedulePicker({ value, onChange }: { value?: string; onChange: (v?: string) => void }) {
  return (
    <div className="space-y-2">
      <label className="text-sm">Agendar (ISO)</label>
      <input type="datetime-local" className="w-full border rounded px-2 py-1 text-sm bg-transparent" value={value ? value : ""} onChange={(e) => onChange(e.target.value || undefined)} />
    </div>
  );
}