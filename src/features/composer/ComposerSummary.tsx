import { useLocation, useParams } from "react-router-dom";

export default function ComposerSummary() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const state = location.state as { enqueued?: { provider: string; social_account_id: number; job_id: string }[] } | undefined;
  const list = state?.enqueued || [];
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Resumo de publicação</h2>
      <div className="text-sm text-white/70">Batch ID: {id}</div>
      {list.length ? (
        <ul className="space-y-2">
          {list.map((e, i) => (
            <li key={i} className="border rounded px-3 py-2 text-sm">{e.provider} · conta #{e.social_account_id} → Job {e.job_id}</li>
          ))}
        </ul>
      ) : (
        <div className="border rounded p-3 text-sm">Nenhum job registrado no estado.</div>
      )}
    </div>
  );
}