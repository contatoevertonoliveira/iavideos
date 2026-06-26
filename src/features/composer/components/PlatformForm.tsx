import { formatFor } from "../platforms";
import AspectCropper from "./AspectCropper";
import SubtitlesPicker from "./SubtitlesPicker";
import ThumbnailPicker from "./ThumbnailPicker";
import SchedulePicker from "./SchedulePicker";
import PolicyChecklist from "./PolicyChecklist";
import ChipsInput from "./ChipsInput";
import type { PlatformKey } from "../platforms";

type Props = {
  provider: PlatformKey;
  media_asset_id: number;
  value: {
    title: string; description: string; tags: string[]; aspect: "16:9"|"9:16"|"1:1"; privacy?: "public"|"unlisted"|"private"; thumb_id?: string; subtitles_id?: string; schedule_at?: string;
  };
  onChange: (patch: Partial<Props["value"]>) => void;
};

export default function PlatformForm({ provider, media_asset_id, value, onChange }: Props) {
  const formatted = formatFor(provider, { title: value.title, description: value.description, tags: value.tags });
  const privacyOptions = ["public","unlisted","private"] as const;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-3">
        <label className="text-sm">Título</label>
        <input className="w-full border rounded px-2 py-1 text-sm bg-transparent" value={value.title} onChange={(e)=>onChange({ title: e.target.value })} />
        <label className="text-sm">Descrição</label>
        <textarea className="w-full border rounded px-2 py-1 text-sm bg-transparent h-28" value={value.description} onChange={(e)=>onChange({ description: e.target.value })} />
        <label className="text-sm">Hashtags/Tags</label>
        <ChipsInput value={value.tags} onChange={(tags)=>onChange({ tags })} />
        <div className="text-xs text-white/60">Formatado: título {formatted.title.length}, desc {formatted.description.length}, tags {formatted.tags.length}</div>
        <AspectCropper aspect={value.aspect} onChange={(a)=>onChange({ aspect: a })} />
        <div className="space-y-2">
          <label className="text-sm">Privacidade (se aplicável)</label>
          <select className="w-full border rounded px-2 py-1 text-sm bg-transparent" value={value.privacy || ""} onChange={(e)=>onChange({ privacy: (e.target.value || undefined) as any })}>
            <option value="">-</option>
            {privacyOptions.map((p)=>(<option key={p} value={p}>{p}</option>))}
          </select>
        </div>
      </div>
      <div className="space-y-3">
        <ThumbnailPicker media_asset_id={media_asset_id} selectedId={value.thumb_id} onSelect={(id)=>onChange({ thumb_id: id })} />
        <SubtitlesPicker media_asset_id={media_asset_id} selectedId={value.subtitles_id} onSelect={(id)=>onChange({ subtitles_id: id })} />
        <SchedulePicker value={value.schedule_at} onChange={(v)=>onChange({ schedule_at: v })} />
        <PolicyChecklist provider={provider} config={{ title: value.title, description: value.description, tags: value.tags, aspect: value.aspect, privacy: value.privacy }} />
      </div>
    </div>
  );
}