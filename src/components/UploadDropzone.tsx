import React, { useCallback, useRef, useState } from "react";
import { api } from "../lib/api";
import { useAuthStore } from "../features/auth/store";

type Props = {
  onUploaded?: (mediaAssetId: number, payload?: any) => void;
  accept?: string; // e.g. "video/*"
  maxSizeBytes?: number; // optional client-side size validation
};

export default function UploadDropzone({ onUploaded, accept = "video/*", maxSizeBytes }: Props) {
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleSelect = useCallback(async (file: File) => {
    setError(null);
    if (maxSizeBytes && file.size > maxSizeBytes) {
      setError(`Arquivo excede o tamanho máximo de ${(maxSizeBytes / (1024 * 1024)).toFixed(0)}MB`);
      return;
    }
    setUploading(true);
    setProgress(0);
    try {
      const form = new FormData();
      form.append("file", file);
      const token = useAuthStore.getState().accessToken;
      const resp = await api.post("/media/upload", form, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        onUploadProgress: (evt) => {
          if (!evt.total) return;
          const pct = Math.round((evt.loaded / evt.total) * 100);
          setProgress(pct);
        },
      });
      const mediaAssetId = resp.data?.media_asset_id ?? resp.data?.id;
      onUploaded?.(mediaAssetId, resp.data);
    } catch (err: any) {
      setError(err?.message ?? "Falha no upload");
    } finally {
      setUploading(false);
    }
  }, [maxSizeBytes, onUploaded]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleSelect(file);
  }, [handleSelect]);

  const onChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleSelect(file);
  }, [handleSelect]);

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
        onDrop={onDrop}
        className={`border-2 border-dashed rounded-md p-6 text-center cursor-pointer ${dragOver ? "bg-blue-50 border-blue-400" : "border-gray-300"}`}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={onChange}
        />
        <p className="text-sm text-gray-600">Arraste e solte seu vídeo aqui, ou clique para selecionar.</p>
        {uploading && (
          <div className="mt-4">
            <div className="h-2 bg-gray-200 rounded">
              <div
                className="h-2 bg-blue-600 rounded"
                style={{ width: `${progress}%`, transition: "width 0.2s" }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">{progress}%</p>
          </div>
        )}
        {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
      </div>
    </div>
  );
}