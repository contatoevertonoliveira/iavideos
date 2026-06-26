import { useState } from "react";
import { toastSuccess, toastError } from "@/lib/toast";

type Props = {
  accounts: { id: number; display_name?: string; provider: string }[];
  bestTimes: (social_account_id: number, platform: string) => Promise<{ start: string; end: string }[]>;
  onPickSlot: (startISO: string) => void;
};

const platforms = ["youtube", "shorts", "instagram", "tiktok", "facebook", "x"];

export default function CalendarSidebar({ accounts, bestTimes, onPickSlot }: Props) {
  const [account, setAccount] = useState<number | null>(null);
  const [platform, setPlatform] = useState<string>("");
  const [slots, setSlots] = useState<{ start: string; end: string }[]>([]);

  async function loadBestTimes() {
    if (!account || !platform) {
      toastError("Selecione conta e plataforma");
      return;
    }
    const s = await bestTimes(account, platform);
    setSlots(s);
  }

  return (
    <aside className="w-full md:w-64 space-y-3">
      <div className="p-3 rounded-xl border border-white/10 bg-[#1C1835]">
        <h2 className="text-sm font-semibold mb-3">Melhores horários</h2>
        <div className="space-y-2">
          <select
            className="w-full bg-transparent border border-white/20 rounded-md px-3 py-2 text-sm"
            value={account ?? ""}
            onChange={(e) => setAccount(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">Conta</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.provider} · {a.display_name ?? a.id}
              </option>
            ))}
          </select>
          <select
            className="w-full bg-transparent border border-white/20 rounded-md px-3 py-2 text-sm"
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
          >
            <option value="">Plataforma</option>
            {platforms.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <button
            className="w-full px-3 py-2 rounded-md bg-white/10 hover:bg-white/20"
            onClick={loadBestTimes}
          >
            Ver melhores horários
          </button>
        </div>
        {slots.length > 0 && (
          <div className="mt-3 space-y-2">
            {slots.slice(0, 3).map((s, idx) => (
              <button
                key={idx}
                className="w-full text-left px-3 py-2 rounded-md bg-white/5 hover:bg-white/10"
                onClick={() => {
                  onPickSlot(s.start);
                  toastSuccess("Slot aplicado ao post selecionado (se houver)");
                }}
              >
                {new Date(s.start).toLocaleString()}
              </button>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}