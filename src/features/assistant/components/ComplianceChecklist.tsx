import React from "react";

function countHashtags(tags: string[]) { return tags.filter((t) => t.startsWith("#") || /^[A-Za-z0-9_]+$/.test(t)).length; }

export default function ComplianceChecklist({ platform, draft }: { platform: string; draft: { title: string; description: string; tags: string[] } }) {
  const titleLen = draft.title.length;
  const descLen = draft.description.length;
  const tagsTotalChars = draft.tags.join(",").length;
  const hashtags = countHashtags(draft.tags);

  type Item = { ok: boolean; label: string; tip?: string };
  const rules: Item[] = [];
  if (platform === "youtube") {
    rules.push({ ok: titleLen <= 100, label: `Título ≤ 100 (${titleLen})`, tip: "Títulos curtos performam melhor" });
    rules.push({ ok: descLen <= 5000, label: `Descrição ≤ 5000 (${descLen})`, tip: "Inclua links e capítulos" });
    rules.push({ ok: tagsTotalChars <= 500, label: `Tags total ≤ 500 (${tagsTotalChars})`, tip: "Use 5–15 tags relevantes" });
  } else if (["shorts", "instagram", "tiktok"].includes(platform)) {
    rules.push({ ok: descLen >= 150 && descLen <= 220, label: `Descrição 150–220 (${descLen})`, tip: "Frases curtas e CTA" });
    rules.push({ ok: hashtags >= 2 && hashtags <= 3, label: `2–3 hashtags (${hashtags})`, tip: "Evite excesso de hashtags" });
  } else if (platform === "x") {
    rules.push({ ok: descLen <= 280, label: `Texto ≤ 280 (${descLen})`, tip: "Seja direto e objetivo" });
    rules.push({ ok: hashtags <= 2, label: `≤ 2 hashtags (${hashtags})`, tip: "Foque no conteúdo" });
  }

  const sensitiveTerms = ["proibido", "banimento", "violência", "discurso de ódio"]; // exemplo
  const hasSensitive = sensitiveTerms.some((w) => draft.description.toLowerCase().includes(w));

  const statusIcon = (ok: boolean) => ok ? "✅" : ("⚠️");

  return (
    <section>
      <h2 className="text-sm font-medium mb-2">Checklist de Conformidade</h2>
      <ul className="text-xs space-y-1">
        {rules.map((r, i) => (
          <li key={i} className={r.ok ? "text-green-600" : "text-yellow-600"}>
            <span className="mr-2">{statusIcon(r.ok)}</span>
            {r.label}
            {r.tip && <span className="ml-2 text-gray-500">– {r.tip}</span>}
          </li>
        ))}
        <li className={hasSensitive ? "text-red-600" : "text-green-600"}>
          <span className="mr-2">{hasSensitive ? "❌" : "✅"}</span>
          Linguagem sensível: {hasSensitive ? "detectada" : "ok"}
          {hasSensitive && <span className="ml-2 text-gray-500">– reescreva termos controversos</span>}
        </li>
      </ul>
    </section>
  );
}