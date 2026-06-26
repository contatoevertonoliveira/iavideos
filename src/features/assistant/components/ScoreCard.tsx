import React from "react";

export default function ScoreCard({ score, onFix }: { score: { score: number; issues: { id: string; severity: string; message: string; fix?: string }[]; gauges: { readability: number; keywordDensity: number; length: number } } | null; onFix?: (id: string) => void }) {
  return (
    <section>
      <h2 className="text-sm font-medium mb-2">Score de SEO/Engajamento</h2>
      {!score ? (
        <p className="text-xs text-gray-500">Execute o Score para avaliar.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border rounded p-3">
            <div className="text-xs text-gray-500">Score</div>
            <div className="text-2xl font-semibold">{score.score}</div>
          </div>
          <div className="border rounded p-3">
            <div className="text-xs text-gray-500">Gauges</div>
            <div className="text-xs">Legibilidade: {score.gauges.readability}%</div>
            <div className="text-xs">Densidade de palavras-chave: {score.gauges.keywordDensity}%</div>
            <div className="text-xs">Tamanho: {score.gauges.length}%</div>
          </div>
          <div className="border rounded p-3">
            <div className="text-xs text-gray-500">Issues</div>
            <ul className="text-xs space-y-1">
              {score.issues.map((i) => (
                <li key={i.id} className="flex items-center justify-between">
                  <span>{i.message}</span>
                  {i.fix ? <button className="ml-2 px-2 py-0.5 border rounded" onClick={() => onFix?.(i.id)}>Aplicar</button> : null}
                </li>
              ))}
              {score.issues.length === 0 && <li className="text-gray-500">Sem issues</li>}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}