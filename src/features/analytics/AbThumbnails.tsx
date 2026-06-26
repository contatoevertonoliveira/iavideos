import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAnalytics } from "./hooks/useAnalytics";
import DateRangePicker from "./components/DateRangePicker";

export default function AbThumbnails() {
  const [accounts, setAccounts] = useState<{ id: number; display_name?: string; provider: string }[]>([]);
  const [accountId, setAccountId] = useState<number | undefined>(undefined);
  const [start, setStart] = useState<string>(() => new Date(Date.now() - 28 * 86400000).toISOString().slice(0, 10));
  const [end, setEnd] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const { ab, fetchABThumbnails } = useAnalytics();

  useEffect(() => {
    async function loadAccounts() {
      try {
        const { data } = await api.get("/accounts");
        setAccounts(data || []);
      } catch (err) {
        if (import.meta.env.VITE_USE_MOCKS === "true") {
          setAccounts([
            { id: 1, provider: "youtube", display_name: "Canal Principal" },
            { id: 2, provider: "youtube", display_name: "Cortes" },
          ]);
        }
      }
    }
    loadAccounts();
  }, []);

  useEffect(() => {
    if (accountId) fetchABThumbnails({ social_account_id: accountId, start, end });
  }, [accountId, start, end]);

  return (
    <div className="p-4 space-y-6">
      <header className="flex items-center justify-between gap-3">
        <select className="border rounded px-2 py-1 text-sm" value={accountId ?? ""} onChange={(e) => setAccountId(Number(e.target.value))}>
          <option value="">Selecione a conta</option>
          {accounts.filter((a) => a.provider === "youtube").map((a) => (
            <option key={a.id} value={a.id}>{a.display_name || `Conta #${a.id}`}</option>
          ))}
        </select>
        <DateRangePicker start={start} end={end} onChange={(s, e) => { setStart(s); setEnd(e); }} />
      </header>

      <div className="border rounded p-3">
        <div className="text-sm mb-2">Resultados de A/B de thumbnails</div>
        <div className="space-y-4">
          {(ab?.experiments || []).map((exp: any) => (
            <div key={exp.video_id} className="border rounded p-3">
              <div className="font-semibold mb-2">Vídeo #{exp.video_id}</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {exp.variants.map((v: any) => (
                  <div key={v.thumbnail_id} className="border rounded p-2">
                    <div>Thumb #{v.thumbnail_id}</div>
                    <div>Impressions: {Intl.NumberFormat("pt-BR").format(v.impressions)}</div>
                    <div>CTR: {(v.ctr * 100).toFixed(1)}%</div>
                    <div>Views: {Intl.NumberFormat("pt-BR").format(v.views)}</div>
                  </div>
                ))}
              </div>
              {exp.winner_thumbnail_id && <div className="mt-2 text-sm text-green-700">Vencedor: Thumb #{exp.winner_thumbnail_id}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}