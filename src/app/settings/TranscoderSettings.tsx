import React, { useState } from "react";
import { api } from "../../lib/api";
import { toastError, toastSuccess } from "../../lib/toast";
import { useAuthStore } from "../../features/auth/store";

export default function TranscoderSettings() {
  const [preset1080, setPreset1080] = useState(true);
  const [preset720, setPreset720] = useState(true);
  const [presetShort916, setPresetShort916] = useState(true);
  const [generateVariants, setGenerateVariants] = useState(true);

  async function save() {
    try {
      const payload = {
        presets: {
          p1080: preset1080,
          p720: preset720,
          short_9_16: presetShort916,
        },
        generate_variants: generateVariants,
      };
      await api.post("/settings/transcoder", payload, {
        headers: useAuthStore.getState().accessToken ? { Authorization: `Bearer ${useAuthStore.getState().accessToken}` } : {},
      });
      toastSuccess("Configurações salvas");
    } catch (err: any) {
      toastError(err?.response?.data?.detail ?? err?.message ?? "Falha ao salvar");
    }
  }

  return (
    <div className="max-w-xl mx-auto p-4 space-y-4">
      <h1 className="text-xl font-semibold">Configurações de Transcodificação</h1>
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={preset1080} onChange={(e) => setPreset1080(e.target.checked)} /> 1080p
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={preset720} onChange={(e) => setPreset720(e.target.checked)} /> 720p
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={presetShort916} onChange={(e) => setPresetShort916(e.target.checked)} /> 9:16 (Short)
        </label>
      </div>
      <div className="flex items-center gap-2">
        <input id="generate_variants" type="checkbox" checked={generateVariants} onChange={(e) => setGenerateVariants(e.target.checked)} />
        <label htmlFor="generate_variants" className="text-sm">Gerar variações</label>
      </div>
      <div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={save}>Salvar</button>
      </div>
    </div>
  );
}