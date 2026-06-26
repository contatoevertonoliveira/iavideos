import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import UploadDropzone from "../../components/UploadDropzone";
import { api } from "../../lib/api";
import { toastError, toastInfo, toastSuccess } from "../../lib/toast";
import { useAuthStore } from "../../features/auth/store";

type Privacy = "public" | "unlisted" | "private";

export default function NewPost() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [privacy, setPrivacy] = useState<Privacy>("unlisted");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isShort, setIsShort] = useState(false);
  const [scheduledAt, setScheduledAt] = useState<string>("");
  const [socialAccountId, setSocialAccountId] = useState<string>("");
  const [mediaAssetId, setMediaAssetId] = useState<number | null>(null);
  const [durationSecs, setDurationSecs] = useState<number | null>(null);
  const [aspect, setAspect] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return title.trim().length > 0 && mediaAssetId != null && socialAccountId.trim().length > 0;
  }, [title, mediaAssetId, socialAccountId]);

  function addTagFromInput() {
    const v = tagInput.trim();
    if (!v) return;
    if (tags.includes(v)) return;
    if (tags.length >= 50) {
      toastInfo("Limite de 50 tags atingido");
      return;
    }
    setTags([...tags, v]);
    setTagInput("");
  }

  async function createVideoPost() {
    if (!canSubmit) {
      toastError("Preencha título, conta e faça o upload do vídeo.");
      return null;
    }
    try {
      const payload = {
        title,
        description,
        privacy,
        tags,
        is_short: isShort,
        social_account_id: socialAccountId,
        media_asset_id: mediaAssetId,
        scheduled_at: scheduledAt || null,
      };
      const resp = await api.post("/videoposts", payload, {
        headers: useAuthStore.getState().accessToken ? { Authorization: `Bearer ${useAuthStore.getState().accessToken}` } : {},
      });
      const vp = resp.data;
      return vp;
    } catch (err: any) {
      toastError(err?.response?.data?.detail ?? err?.message ?? "Falha ao criar VideoPost");
      return null;
    }
  }

  async function handleSaveDraft() {
    const vp = await createVideoPost();
    if (!vp) return;
    toastSuccess("Rascunho criado");
    navigate(`/posts/${vp.id}`);
  }

  async function handleQueue() {
    const vp = await createVideoPost();
    if (!vp) return;
    try {
      await api.post(`/videoposts/${vp.id}/queue`, {}, {
        headers: useAuthStore.getState().accessToken ? { Authorization: `Bearer ${useAuthStore.getState().accessToken}` } : {},
      });
      toastSuccess("Post enfileirado");
      navigate("/posts/queue");
    } catch (err: any) {
      toastError(err?.response?.data?.detail ?? err?.message ?? "Falha ao enfileirar");
    }
  }

  async function handleGenerateThumbnail() {
    if (!mediaAssetId) {
      toastInfo("Faça upload do vídeo antes de gerar thumbnail.");
      return;
    }
    try {
      // Endpoint pode variar; tentamos um caminho comum.
      await api.post(`/media/${mediaAssetId}/thumbnail`, {}, {
        headers: useAuthStore.getState().accessToken ? { Authorization: `Bearer ${useAuthStore.getState().accessToken}` } : {},
      });
      toastSuccess("Thumbnail enfileirada");
    } catch (_err) {
      toastInfo("Endpoint de thumbnail indisponível no ambiente atual.");
    }
  }

  function onUploaded(mediaId: number, payload?: any) {
    setMediaAssetId(mediaId);
    const d = payload?.duration_secs ?? payload?.duration ?? null;
    const a = payload?.aspect ?? null;
    if (d != null) setDurationSecs(Number(d));
    if (a != null) setAspect(String(a));
    if ((d && Number(d) <= 60) || a === "9:16") {
      setIsShort(true);
      toastInfo("Sugerido Short (<=60s ou 9:16)");
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <h1 className="text-xl font-semibold">Criar Post</h1>

      <section>
        <h2 className="text-sm font-medium mb-2">Upload do vídeo</h2>
        <UploadDropzone onUploaded={onUploaded} accept="video/*" />
        {mediaAssetId && (
          <p className="text-xs text-gray-600 mt-2">asset #{mediaAssetId} {durationSecs ? `• ${durationSecs}s` : ""} {aspect ? `• ${aspect}` : ""}</p>
        )}
      </section>

      <section className="grid grid-cols-1 gap-4">
        <div>
          <label className="text-sm">Título</label>
          <input
            className="mt-1 w-full border rounded px-3 py-2"
            value={title}
            maxLength={100}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título do vídeo"
          />
          <p className="text-xs text-gray-500 mt-1">Sugestão: até 100 caracteres</p>
        </div>

        <div>
          <label className="text-sm">Descrição</label>
          <textarea
            className="mt-1 w-full border rounded px-3 py-2"
            value={description}
            maxLength={500}
            rows={4}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descrição do vídeo"
          />
          <p className="text-xs text-gray-500 mt-1">Até ~500 caracteres</p>
        </div>

        <div>
          <label className="text-sm">Privacidade</label>
          <select className="mt-1 w-full border rounded px-3 py-2" value={privacy} onChange={(e) => setPrivacy(e.target.value as Privacy)}>
            <option value="public">Public</option>
            <option value="unlisted">Unlisted</option>
            <option value="private">Private</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">Em dev, default unlisted</p>
        </div>

        <div>
          <label className="text-sm">Tags</label>
          <div className="flex gap-2 mt-1">
            <input
              className="flex-1 border rounded px-3 py-2"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTagFromInput(); } }}
              placeholder="Adicionar tag e Enter"
            />
            <button className="px-3 py-2 border rounded" onClick={addTagFromInput}>Adicionar</button>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {tags.map((t) => (
              <span key={t} className="text-xs bg-gray-100 border rounded px-2 py-1">
                {t}
                <button className="ml-2 text-red-500" onClick={() => setTags(tags.filter((x) => x !== t))}>×</button>
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm">Conta social (ID)</label>
            <input
              className="mt-1 w-full border rounded px-3 py-2"
              value={socialAccountId}
              onChange={(e) => setSocialAccountId(e.target.value)}
              placeholder="ID da conta do YouTube"
            />
            <p className="text-xs text-gray-500 mt-1">Seleção avançada pode ser adicionada depois.</p>
          </div>
          <div>
            <label className="text-sm">Agendar (opcional)</label>
            <input
              type="datetime-local"
              className="mt-1 w-full border rounded px-3 py-2"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input id="is_short" type="checkbox" checked={isShort} onChange={(e) => setIsShort(e.target.checked)} />
          <label htmlFor="is_short" className="text-sm">É Short (auto-sugerir por duração/aspecto)</label>
        </div>
      </section>

      <section className="flex gap-2">
        <button className="px-4 py-2 bg-gray-800 text-white rounded" onClick={handleSaveDraft} disabled={!canSubmit}>Salvar rascunho</button>
        <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={handleQueue} disabled={!canSubmit}>Enfileirar postagem</button>
        <button className="px-4 py-2 border rounded" onClick={handleGenerateThumbnail} disabled={!mediaAssetId}>Gerar thumbnail</button>
      </section>
    </div>
  );
}