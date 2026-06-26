import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { PlatformKey } from "../platforms";

type Account = { id: number; provider: PlatformKey; display_name: string; avatar_url?: string; status?: string; scopes?: string[] };

type Props = {
  selected: { provider: PlatformKey; social_account_id: number }[];
  onToggle: (acc: { provider: PlatformKey; social_account_id: number }) => void;
  onLoaded?: (accounts: Account[]) => void;
};

const useMocks = () => (import.meta.env.VITE_USE_MOCKS ?? "false") === "true";

export default function AccountSelector({ selected, onToggle, onLoaded }: Props) {
  const mocks = useMocks();
  const [accounts, setAccounts] = useState<Account[]>([]);

  useEffect(() => {
    async function load() {
      if (!mocks) {
        const { data } = await api.get(`/accounts`);
        const list = Array.isArray(data) ? data : [];
        setAccounts(list);
        onLoaded?.(list);
      } else {
        const list = [
          { id: 1, provider: "youtube", display_name: "YouTube A" },
          { id: 2, provider: "shorts", display_name: "YouTube B" },
          { id: 3, provider: "instagram", display_name: "Instagram 1" },
          { id: 4, provider: "tiktok", display_name: "TikTok 1" },
        ];
        setAccounts(list);
        onLoaded?.(list);
      }
    }
    load();
  }, [mocks]);

  const isSelected = (acc: Account) => selected.some((s) => s.social_account_id === acc.id && s.provider === acc.provider);

  return (
    <div className="space-y-2">
      <h4 className="font-medium">Selecionar contas</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {accounts.map((acc) => (
          <label
            key={`${acc.provider}-${acc.id}`}
            className={`flex items-center gap-2 border rounded px-2 py-2 text-sm cursor-pointer ${isSelected(acc) ? 'border-blue-500 bg-blue-500/10' : 'border-white/20'}`}
          >
            <input type="checkbox" className="accent-blue-500" checked={isSelected(acc)} onChange={() => onToggle({ provider: acc.provider, social_account_id: acc.id })} />
            <span className="inline-flex w-6 h-6 items-center justify-center rounded bg-white/10 text-xs">
              {acc.provider.slice(0,1).toUpperCase()}
            </span>
            <span>{acc.display_name} · {acc.provider}</span>
          </label>
        ))}
      </div>
    </div>
  );
}