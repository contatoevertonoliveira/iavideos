import React from "react";

export default function ActionBar({ loading, onApply, onSaveDraft, onDiscard }: { loading?: boolean; onApply: () => Promise<void> | void; onSaveDraft?: () => void; onDiscard?: () => void }) {
  return (
    <section className="flex gap-2 justify-end">
      <button className="px-4 py-2 border rounded" onClick={() => onSaveDraft?.()}>Salvar rascunho</button>
      <button className="px-4 py-2 border rounded" onClick={() => onDiscard?.()}>Descartar</button>
      <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={() => onApply()} disabled={loading}>Aplicar ao Post</button>
      <button className="px-4 py-2 border rounded" onClick={() => window.open('#/posts/queue', '_self')}>Ir para Fila</button>
    </section>
  );
}