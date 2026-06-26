import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAnalytics } from "./hooks/useAnalytics";
import DateRangePicker from "./components/DateRangePicker";
import AccountPlatformPicker from "./components/AccountPlatformPicker";
import CompareChart from "./components/CompareChart";
import ExportButtons from "./components/ExportButtons";

export default function ComparePage() {
  const [accounts, setAccounts] = useState<{ id: number; display_name?: string; provider: string }[]>([]);
  const [platform, setPlatform] = useState("youtube");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [start, setStart] = useState<string>(() => new Date(Date.now() - 28 * 86400000).toISOString().slice(0, 10));
  const [end, setEnd] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const { compare, fetchCompareAccounts, fetchComparePlatforms } = useAnalytics();

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
            { id: 3, provider: "youtube", display_name: "Backup" },
          ]);
        }
      }
    }
    loadAccounts();
  }, []);

  useEffect(() => {
    if (selectedIds.length) fetchCompareAccounts({ ids: selectedIds, platform, start, end });
    // Se houver ao menos uma conta selecionada, carregar comparativo de plataformas para a primeira
    if (selectedIds.length) fetchComparePlatforms({ social_account_id: selectedIds[0], start, end });
  }, [selectedIds, platform, start, end]);

  const series = compare?.accounts?.series || [];

  return (
    <div className="p-4 space-y-6">
      <header className="flex items-center justify-between gap-3">
        <AccountPlatformPicker
          accounts={accounts}
          platform={platform}
          onChange={(v) => setPlatform(v.platform)}
        />
        <DateRangePicker start={start} end={end} onChange={(s, e) => { setStart(s); setEnd(e); }} />
      </header>

      <div className="border rounded p-3">
        <div className="mb-2 text-sm">Selecione contas</div>
        <div className="flex flex-wrap gap-2">
          {accounts.filter((a) => a.provider === platform).map((a) => {
            const checked = selectedIds.includes(a.id);
            return (
              <label key={a.id} className="text-sm border rounded px-2 py-1">
                <input type="checkbox" className="mr-1" checked={checked} onChange={() => {
                  setSelectedIds((ids) => checked ? ids.filter((x) => x !== a.id) : [...ids, a.id]);
                }} />
                {a.display_name || `Conta #${a.id}`}
              </label>
            );
          })}
        </div>
      </div>

      {series.length ? <CompareChart series={series} /> : <div className="text-sm text-gray-600">Selecione ao menos uma conta.</div>}

      <div className="border rounded p-3">
        <div className="text-sm mb-2">Comparativo entre plataformas (conta selecionada)</div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className="p-2">Plataforma</th>
                <th className="p-2">Views</th>
                <th className="p-2">Watch hours</th>
                <th className="p-2">CTR</th>
                <th className="p-2">Impressions</th>
                <th className="p-2">Views/1k</th>
                <th className="p-2">Watch/1k</th>
              </tr>
            </thead>
            <tbody>
              {(compare?.platforms?.platforms || []).map((p: any) => (
                <tr key={p.platform} className="border-t">
                  <td className="p-2">{p.platform}</td>
                  <td className="p-2">{Intl.NumberFormat("pt-BR").format(p.views)}</td>
                  <td className="p-2">{Intl.NumberFormat("pt-BR").format(p.watch_hours)}</td>
                  <td className="p-2">{(p.ctr * 100).toFixed(1)}%</td>
                  <td className="p-2">{Intl.NumberFormat("pt-BR").format(p.impressions)}</td>
                  <td className="p-2">{(p.views / 1000).toFixed(2)}</td>
                  <td className="p-2">{(p.watch_hours / 1000).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ExportButtons csvName={`compare_${start}_${end}.csv`} csvData={series.flatMap((s: any) => s.timeseries.map((p: any) => ({ account: s.label, ...p })))} />
    </div>
  );
}