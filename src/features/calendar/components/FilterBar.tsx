type Props = {
  platform?: string;
  account?: number;
  status?: string;
  onChange: (f: { platform?: string; account?: number; status?: string }) => void;
  accounts?: { id: number; display_name?: string; provider: string }[];
};

const platforms = ["youtube", "shorts", "instagram", "tiktok", "facebook", "x"];
const statuses = ["Draft", "Queued", "Processing", "Posted", "Failed", "Canceled"];

export default function FilterBar({ platform, account, status, onChange, accounts = [] }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3 p-3 border border-white/10 rounded-xl bg-[#1C1835]">
      <select
        className="bg-transparent border border-white/20 rounded-md px-3 py-2 text-sm"
        value={platform ?? ""}
        onChange={(e) => onChange({ platform: e.target.value || undefined, account, status })}
      >
        <option value="">Todas plataformas</option>
        {platforms.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>

      <select
        className="bg-transparent border border-white/20 rounded-md px-3 py-2 text-sm"
        value={account ?? ""}
        onChange={(e) => onChange({ platform, account: e.target.value ? Number(e.target.value) : undefined, status })}
      >
        <option value="">Todas contas</option>
        {accounts.map((a) => (
          <option key={a.id} value={a.id}>
            {a.provider} · {a.display_name ?? a.id}
          </option>
        ))}
      </select>

      <select
        className="bg-transparent border border-white/20 rounded-md px-3 py-2 text-sm"
        value={status ?? ""}
        onChange={(e) => onChange({ platform, account, status: e.target.value || undefined })}
      >
        <option value="">Todos status</option>
        {statuses.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    </div>
  );
}