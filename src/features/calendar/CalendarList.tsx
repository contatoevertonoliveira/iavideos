import { useMemo, useState, useEffect } from "react";
import { useCalendar } from "./useCalendar";
import FilterBar from "./components/FilterBar";
import { api } from "@/lib/api";

export default function CalendarList() {
  const { items, filters, setFilters, updateSchedule } = useCalendar();
  const [accounts, setAccounts] = useState<{ id: number; display_name?: string; provider: string }[]>([]);
  const [reschedule, setReschedule] = useState<Record<number, string>>({});

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/accounts");
        setAccounts(data ?? []);
      } catch {}
    })();
  }, []);

  const filtered = useMemo(() => {
    return items.filter((it) => {
      if (filters.platform && it.platform !== filters.platform) return false;
      if (filters.account && it.social_account_id !== filters.account) return false;
      if (filters.status && it.status !== filters.status) return false;
      return true;
    });
  }, [items, filters]);

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">Lista de Postagens</h1>
      <FilterBar
        platform={filters.platform}
        account={filters.account}
        status={filters.status}
        accounts={accounts}
        onChange={setFilters}
      />
      <div className="rounded-xl border border-white/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#1C1835]">
            <tr>
              <th className="text-left p-2">ID</th>
              <th className="text-left p-2">Título</th>
              <th className="text-left p-2">Plataforma</th>
              <th className="text-left p-2">Conta</th>
              <th className="text-left p-2">Status</th>
              <th className="text-left p-2">Agendado</th>
              <th className="text-left p-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((it) => (
              <tr key={it.id} className="border-t border-white/10">
                <td className="p-2">{it.id}</td>
                <td className="p-2">{it.title}</td>
                <td className="p-2">{it.platform}</td>
                <td className="p-2">{it.social_account_id}</td>
                <td className="p-2">{it.status}</td>
                <td className="p-2">{it.scheduled_at ? new Date(it.scheduled_at).toLocaleString() : "—"}</td>
                <td className="p-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="datetime-local"
                      className="bg-transparent border border-white/20 rounded-md px-2 py-1"
                      value={reschedule[it.id] ?? ""}
                      onChange={(e) => setReschedule((r) => ({ ...r, [it.id]: e.target.value }))}
                    />
                    <button
                      className="px-3 py-1 rounded-md bg-white/10 hover:bg-white/20"
                      onClick={() => {
                        const iso = reschedule[it.id];
                        if (iso) updateSchedule(it.id, new Date(iso).toISOString());
                      }}
                    >
                      Reagendar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}