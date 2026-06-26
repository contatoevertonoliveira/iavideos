import type { PlatformKey } from "../platforms";

type Item = {
  provider: PlatformKey;
  social_account_id: number;
  title: string;
  description: string;
  tags: string[];
  aspect: "16:9"|"9:16"|"1:1";
  thumb_id?: string;
  subtitles_id?: string;
  schedule_at?: string;
  privacy?: "public"|"unlisted"|"private";
};

export default function SummaryCard({ items }: { items: Item[] }) {
  return (
    <div className="space-y-4">
      {items.map((it, idx) => (
        <div key={idx} className="border rounded p-3">
          <div className="text-sm text-white/80">{it.provider} · conta #{it.social_account_id}</div>
          <div className="text-base font-medium">{it.title}</div>
          <div className="text-xs text-white/70">{it.description}</div>
          <div className="text-xs mt-1">Tags: {it.tags.join(", ")}</div>
          <div className="text-xs mt-1">Aspect: {it.aspect} · Privacy: {it.privacy || '-'} · Agendar: {it.schedule_at || '-'}</div>
        </div>
      ))}
    </div>
  );
}