import React from "react";

export default function SuggestionsPanel({ lastSuggest, draft, adoptVariant, onCopy, onRefine }: { lastSuggest: { title: string; description: string; tags: string[] } | null; draft: { platformVariants: Record<string, { title: string; description: string; tags: string[] } | undefined> }; adoptVariant: (platform: any) => void; onCopy?: (text: string) => void; onRefine?: (platform?: string) => void }) {
  const entries = Object.entries(draft.platformVariants || {});
  if (!entries.length && !lastSuggest) return (
    <section>
      <h2 className="text-sm font-medium mb-2">Sugestões IA</h2>
      <p className="text-xs text-gray-500">Nenhuma sugestão gerada ainda.</p>
    </section>
  );
  return (
    <section>
      <h2 className="text-sm font-medium mb-2">Sugestões IA</h2>
      {lastSuggest && (
        <div className="border rounded p-3 mb-4">
          <div className="text-xs text-gray-500 mb-1">Sugerido (Geral)</div>
          <div className="font-medium">{lastSuggest.title}</div>
          <div className="text-xs text-gray-600 whitespace-pre-wrap mt-1">{lastSuggest.description}</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {lastSuggest.tags.map((t) => <span key={t} className="text-xs border rounded px-2 py-1 bg-gray-50">#{t}</span>)}
          </div>
          <div className="mt-3 flex gap-2">
            <button className="px-3 py-1 border rounded text-sm" onClick={() => onCopy?.(`${lastSuggest.title}\n\n${lastSuggest.description}`)}>Copiar</button>
            <button className="px-3 py-1 border rounded text-sm" onClick={() => onRefine?.()}>Refinar com…</button>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {entries.map(([platform, v]) => (
          v ? (
            <div key={platform} className="border rounded p-3">
              <div className="text-xs text-gray-500 mb-1">{platform}</div>
              <div className="font-medium">{v.title}</div>
              <div className="text-xs text-gray-600 whitespace-pre-wrap mt-1">{v.description}</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {v.tags.map((t) => <span key={t} className="text-xs border rounded px-2 py-1 bg-gray-50">#{t}</span>)}
              </div>
              <div className="mt-3 flex gap-2">
                <button className="px-3 py-1 border rounded text-sm" onClick={() => adoptVariant(platform)}>Usar</button>
                <button className="px-3 py-1 border rounded text-sm" onClick={() => onCopy?.(`${v.title}\n\n${v.description}`)}>Copiar</button>
                <button className="px-3 py-1 border rounded text-sm" onClick={() => onRefine?.(platform)}>Refinar com…</button>
              </div>
            </div>
          ) : null
        ))}
      </div>
    </section>
  );
}