"use client";

import { useCallback, useState } from "react";

export type MediaAssetDTO = {
  id: string;
  url: string;
  filename: string;
  mimeType: string;
  size: number;
  alt: string;
  createdAt: string;
};

/**
 * `/admin/api/medya/yukle` uç noktasına dosya yükler. Hem Medya ekranı hem MediaPicker
 * aynı kancayı kullanır — yükleme mantığı tek yerde.
 */
export function useMediaUpload(onUploaded: (asset: MediaAssetDTO) => void) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  const upload = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files);
      if (list.length === 0) return;

      setUploading(true);
      setError(null);
      setProgress({ done: 0, total: list.length });

      let failed = 0;
      for (const [index, file] of list.entries()) {
        const body = new FormData();
        body.append("file", file);
        try {
          const res = await fetch("/admin/api/medya/yukle", { method: "POST", body });
          const payload = (await res.json().catch(() => null)) as
            | { asset?: MediaAssetDTO; error?: string }
            | null;

          if (!res.ok || !payload?.asset) {
            failed += 1;
            setError(payload?.error ?? `${file.name} yüklenemedi.`);
          } else {
            onUploaded(payload.asset);
          }
        } catch {
          failed += 1;
          setError(`${file.name} yüklenirken bağlantı koptu.`);
        }
        setProgress({ done: index + 1, total: list.length });
      }

      setUploading(false);
      setProgress(null);
      if (failed === 0) setError(null);
    },
    [onUploaded],
  );

  return { upload, uploading, error, progress, setError };
}

/** Sürükle-bırak alanı için ortak olay yardımcıları. */
export function dropZoneHandlers(onFiles: (files: FileList) => void) {
  return {
    onDragOver: (e: React.DragEvent) => e.preventDefault(),
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer.files.length > 0) onFiles(e.dataTransfer.files);
    },
  };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
