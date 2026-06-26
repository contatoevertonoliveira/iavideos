import type { PlatformKey } from "../platforms";

type Tab = { label: string; key: PlatformKey; index: number };

export default function PlatformTabs({ tabs, activeIndex, onChange }: { tabs: Tab[]; activeIndex: number; onChange: (index: number) => void }) {
  return (
    <div className="flex gap-2 border-b border-white/10">
      {tabs.map((t) => (
        <button
          key={`${t.key}-${t.index}`}
          onClick={() => onChange(t.index)}
          className={`px-3 py-2 text-sm rounded-t ${activeIndex === t.index ? 'bg-white/10 text-white' : 'text-white/70 hover:text-white'}`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}