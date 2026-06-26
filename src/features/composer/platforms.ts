export type PlatformKey = "youtube"|"shorts"|"instagram"|"tiktok"|"facebook"|"x";

export type FormatInput = { title: string; description: string; tags: string[] };
export type FormatOutput = { title: string; description: string; tags: string[] };
export type ValidateResult = { ok: boolean; errors: string[]; warnings: string[] };

const clampText = (s: string, max: number) => (s.length > max ? s.slice(0, max) : s);
const ensureTags = (tags: string[], maxChars?: number) => {
  const joined = tags.join(" ");
  if (!maxChars) return tags;
  if (joined.length <= maxChars) return tags;
  const out: string[] = [];
  let total = 0;
  for (const t of tags) {
    if (total + t.length + (out.length ? 1 : 0) > maxChars) break;
    out.push(t);
    total += t.length + (out.length ? 1 : 0);
  }
  return out;
};

export function formatFor(provider: PlatformKey, input: FormatInput): FormatOutput {
  const { title, description, tags } = input;
  switch (provider) {
    case "youtube":
      return {
        title: clampText(title, 100),
        description: clampText(description, 5000),
        tags: ensureTags(tags, 500),
      };
    case "shorts":
      return {
        title: clampText(title, 100),
        description: clampText(description, 220),
        tags: ensureTags(tags, 200),
      };
    case "instagram":
      return {
        title: clampText(title, 100),
        description: clampText(description, 2200),
        tags: ensureTags(tags, 200),
      };
    case "tiktok":
      return {
        title: clampText(title, 100),
        description: clampText(description, 300),
        tags: ensureTags(tags, 200),
      };
    case "facebook":
      return {
        title: clampText(title, 100),
        description: clampText(description, 5000),
        tags: tags,
      };
    case "x":
      return {
        title: clampText(title, 100),
        description: clampText(description, 280),
        tags: ensureTags(tags, 80),
      };
    default:
      return { title, description, tags };
  }
}

export function validateFor(provider: PlatformKey, cfg: {
  title: string;
  description: string;
  tags: string[];
  aspect?: "16:9"|"9:16"|"1:1";
  privacy?: "public"|"unlisted"|"private";
}): ValidateResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const tlen = cfg.title.length;
  const dlen = cfg.description.length;
  const tagsCount = cfg.tags.length;

  switch (provider) {
    case "youtube":
      if (tlen > 100) warnings.push("Título > 100 caracteres");
      if (dlen > 5000) warnings.push("Descrição > 5000 caracteres");
      if (!cfg.privacy) warnings.push("Privacy não definido");
      break;
    case "shorts":
      if (cfg.aspect && cfg.aspect !== "9:16") warnings.push("Recomendado 9:16 para Shorts");
      if (dlen > 220) warnings.push("Descrição muito longa para Shorts (<=220)");
      if (tagsCount < 3) warnings.push("Poucas hashtags para Shorts");
      break;
    case "instagram":
      if (cfg.aspect && cfg.aspect !== "9:16") warnings.push("Recomendado 9:16 para Reels");
      if (tagsCount > 30) errors.push("Máximo 30 hashtags");
      if (dlen > 300 && dlen < 2200) warnings.push("Caption longa; considere resumir");
      break;
    case "tiktok":
      if (cfg.aspect && cfg.aspect !== "9:16") warnings.push("Recomendado 9:16 para TikTok");
      if (dlen > 300) warnings.push("Caption muito longa para TikTok");
      if (/(https?:\/\/)/i.test(cfg.description)) warnings.push("Links são desencorajados no TikTok");
      break;
    case "facebook":
      if (cfg.aspect && !(cfg.aspect === "16:9" || cfg.aspect === "9:16")) warnings.push("Aspect recomendado 16:9 ou 9:16");
      break;
    case "x":
      if (dlen > 280) errors.push("Máximo 280 caracteres no X");
      if (tagsCount > 5) warnings.push("Evite muitas hashtags no X");
      if (cfg.aspect && cfg.aspect !== "16:9") warnings.push("Recomendado 16:9 para X");
      break;
  }

  return { ok: errors.length === 0, errors, warnings };
}