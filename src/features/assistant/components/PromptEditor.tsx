import React from "react";

export default function PromptEditor({ draft, setDraft, onSuggest, onRefine }: { draft: { title: string; description: string; tags: string[] }; setDraft: (updater: any) => void; onSuggest?: () => void; onRefine?: () => void }) {
  const [tagInput, setTagInput] = React.useState("");
  function addTag() {
    const v = tagInput.trim();
    if (!v) return;
    setDraft((d: any) => ({ ...d, tags: [...d.tags, v] }));
    setTagInput("");
  }
  const titleChars = draft.title.length;
  const descChars = draft.description.length;
  const descWords = draft.description.trim() ? draft.description.trim().split(/\s+/).length : 0;
  return (
    <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="text-sm">Título</label>
        <input className="mt-1 w-full border rounded px-3 py-2" value={draft.title} onChange={(e) => setDraft((d: any) => ({ ...d, title: e.target.value }))} />
        <div className="mt-1 text-[11px] text-gray-500">{titleChars} chars</div>
      </div>
      <div>
        <label className="text-sm">Descrição</label>
        <textarea className="mt-1 w-full border rounded px-3 py-2" rows={5} value={draft.description} onChange={(e) => setDraft((d: any) => ({ ...d, description: e.target.value }))} />
        <div className="mt-1 text-[11px] text-gray-500">{descChars} chars • {descWords} words</div>
      </div>
      <div className="md:col-span-2">
        <label className="text-sm">Tags</label>
        <div className="flex gap-2 mt-1">
          <input className="flex-1 border rounded px-3 py-2" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }} />
          <button className="px-3 py-2 border rounded" onClick={addTag}>Adicionar</button>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {draft.tags.map((t) => (
            <span key={t} className="text-xs bg-gray-100 border rounded px-2 py-1">
              {t}
              <button className="ml-2 text-red-500" onClick={() => setDraft((d: any) => ({ ...d, tags: d.tags.filter((x: string) => x !== t) }))}>×</button>
            </span>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <button className="px-3 py-2 bg-blue-600 text-white rounded text-sm" onClick={() => onSuggest?.()}>Gerar Sugestões</button>
          <button className="px-3 py-2 border rounded text-sm" onClick={() => onRefine?.()}>Refinar</button>
        </div>
      </div>
    </section>
  );
}