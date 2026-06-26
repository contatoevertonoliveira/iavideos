import { useMemo } from "react";

type Props = {
  start: string;
  end: string;
  onChange: (start: string, end: string) => void;
};

function toISO(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default function DateRangePicker({ start, end, onChange }: Props) {
  const presets = useMemo(() => {
    const now = new Date();
    const today = toISO(now);
    const d7 = toISO(new Date(now.getTime() - 7 * 86400000));
    const d28 = toISO(new Date(now.getTime() - 28 * 86400000));
    const d90 = toISO(new Date(now.getTime() - 90 * 86400000));
    const monthStart = toISO(new Date(now.getFullYear(), now.getMonth(), 1));
    const monthEnd = toISO(new Date(now.getFullYear(), now.getMonth() + 1, 0));
    return [
      { label: "Hoje", start: today, end: today },
      { label: "7 dias", start: d7, end: today },
      { label: "28 dias", start: d28, end: today },
      { label: "90 dias", start: d90, end: today },
      { label: "Mês atual", start: monthStart, end: monthEnd },
    ];
  }, []);

  return (
    <div className="flex items-center gap-2">
      <select className="border rounded px-2 py-1 text-sm" onChange={(e) => {
        const p = presets.find((x) => x.label === e.target.value);
        if (p) onChange(p.start, p.end);
      }}>
        <option value="">Custom</option>
        {presets.map((p) => (
          <option key={p.label} value={p.label}>{p.label}</option>
        ))}
      </select>
      <input type="date" className="border rounded px-2 py-1 text-sm" value={start} onChange={(e) => onChange(e.target.value, end)} />
      <input type="date" className="border rounded px-2 py-1 text-sm" value={end} onChange={(e) => onChange(start, e.target.value)} />
    </div>
  );
}