type Account = { id: number; display_name?: string; provider: string };

type Props = {
  accounts: Account[];
  platform: string;
  social_account_id?: number;
  onChange: (v: { platform: string; social_account_id?: number }) => void;
};

export default function AccountPlatformPicker({ accounts, platform, social_account_id, onChange }: Props) {
  return (
    <div className="flex items-center gap-2">
      <select className="border rounded px-2 py-1 text-sm" value={platform} onChange={(e) => onChange({ platform: e.target.value, social_account_id })}>
        <option value="youtube">YouTube</option>
        <option value="shorts">YouTube Shorts</option>
        <option value="instagram">Instagram</option>
        <option value="tiktok">TikTok</option>
        <option value="facebook">Facebook</option>
        <option value="x">X (Twitter)</option>
      </select>
      <select className="border rounded px-2 py-1 text-sm" value={social_account_id ?? ""} onChange={(e) => onChange({ platform, social_account_id: Number(e.target.value) })}>
        <option value="">Selecione a conta</option>
        {accounts.filter((a) => !platform || a.provider === platform).map((a) => (
          <option key={a.id} value={a.id}>{a.display_name || `Conta #${a.id}`}</option>
        ))}
      </select>
    </div>
  );
}