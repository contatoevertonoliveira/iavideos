import React, { useEffect, useMemo } from "react";

export default function BestTimes({ bestTimes, onLoad }: { bestTimes: { times: { datetime: string; confidence: number }[]; timezone: string } | null; onLoad: () => void }) {
  useEffect(() => { if (!bestTimes) onLoad(); }, [bestTimes]);
  const top3 = useMemo(() => (bestTimes?.times || []).slice(0, 3), [bestTimes]);
  return (
    <section>
      <h2 className="text-sm font-medium mb-2">Melhores horários</h2>
      {!bestTimes ? (
        <p className="text-xs text-gray-500">Carregando…</p>
      ) : (
        <div className="border rounded p-3 text-xs">
          <div className="text-gray-500 mb-2">Timezone: {bestTimes.timezone}</div>
          <ul className="space-y-1">
            {top3.map((t, i) => (
              <li key={i} className="flex items-center justify-between">
                <span>{new Date(t.datetime).toLocaleString()}</span>
                <span className="text-gray-600">conf: {t.confidence}%</span>
              </li>
            ))}
            {top3.length === 0 && <li className="text-gray-500">Sem recomendações</li>}
          </ul>
        </div>
      )}
    </section>
  );
}