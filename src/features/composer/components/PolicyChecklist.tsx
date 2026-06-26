import { validateFor } from "../platforms";
import type { PlatformKey } from "../platforms";

export default function PolicyChecklist({ provider, config }: { provider: PlatformKey; config: { title: string; description: string; tags: string[]; aspect?: "16:9"|"9:16"|"1:1"; privacy?: "public"|"unlisted"|"private" } }) {
  const res = validateFor(provider, config);
  return (
    <div className="space-y-2">
      <h4 className="font-medium">Checklist de políticas</h4>
      <ul className="space-y-1 text-sm">
        {res.errors.map((e, i) => (
          <li key={`e-${i}`} className="text-red-400">✗ {e}</li>
        ))}
        {res.warnings.map((w, i) => (
          <li key={`w-${i}`} className="text-yellow-300">⚠ {w}</li>
        ))}
        {!res.errors.length && !res.warnings.length ? <li className="text-green-400">✅ OK</li> : null}
      </ul>
    </div>
  );
}