import { Link } from "react-router-dom";

export default function ComposerList() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Rascunhos de Crosspost</h2>
        <Link to="/composer/new" className="px-3 py-2 rounded bg-blue-600 text-white text-sm">Criar crosspost</Link>
      </div>
      <div className="rounded border p-4 text-sm text-gray-300">
        Nenhum rascunho encontrado. Clique em "Criar crosspost" para iniciar.
      </div>
    </div>
  );
}