import { useEffect, useMemo, useState } from "react";
import CalendarGrid from "./components/CalendarGrid";
import FilterBar from "./components/FilterBar";
import CalendarSidebar from "./CalendarSidebar";
import { api } from "@/lib/api";
import { useCalendar } from "./useCalendar";
import { toastInfo } from "@/lib/toast";

export default function CalendarPage() {
  const { items, filters, setFilters, setRange, updateSchedule, bestTimes } = useCalendar();
  const [accounts, setAccounts] = useState<{ id: number; display_name?: string; provider: string }[]>([]);

  useEffect(() => {
    // carregar contas para dropdown
    (async () => {
      try {
        const { data } = await api.get("/accounts");
        setAccounts(data ?? []);
      } catch (err) {
        // em mocks, ignore
      }
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
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Calendário Editorial</h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-[1fr_256px] gap-4">
        <div className="space-y-4">
          <FilterBar
            platform={filters.platform}
            account={filters.account}
            status={filters.status}
            accounts={accounts}
            onChange={setFilters}
          />
          <CalendarGrid
            items={filtered}
            onRangeChange={(start, end) => setRange(start, end)}
            onEventClick={(id) => {
              toastInfo(`Abrir detalhes do post #${id}`);
              // Navegação para /calendar/:id pode ser adicionada após modal
            }}
            onEventDrop={(id, iso) => updateSchedule(id, iso)}
          />
        </div>
        <div>
          <span className="sr-only">Sidebar</span>
          <CalendarSidebar
            accounts={accounts}
            bestTimes={bestTimes}
            onPickSlot={(startISO) => {
              // Sem seleção de item ativo, apenas informa
              toastInfo("Selecione um post para aplicar o horário");
            }}
          />
        </div>
      </div>
    </div>
  );
}