"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  dropZoneHandlers,
  formatBytes,
  useMediaUpload,
  type MediaAssetDTO,
} from "./useMediaUpload";

/**
 * Görsel seçme kipi. Kapak görseli, ekip portresi ve avatar alanlarının üçü de bunu kullanır —
 * önceden hepsi düz bir URL kutusuydu ve "medya kütüphanesi eklenene kadar" notu taşıyordu.
 *
 * Liste açılışta bir kez çekilir; yükleme yapılırsa yeni görsel listenin başına eklenir.
 */
export function MediaPicker({
  open,
  onClose,
  onSelect,
  /** Şu an seçili olan URL — ızgarada vurgulanır. */
  currentUrl,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (asset: MediaAssetDTO) => void;
  currentUrl?: string;
}) {
  const [assets, setAssets] = useState<MediaAssetDTO[] | null>(null);
  const [query, setQuery] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const { upload, uploading, error, progress } = useMediaUpload((asset) =>
    setAssets((cur) => [asset, ...(cur ?? [])]),
  );

  useEffect(() => {
    if (!open || assets !== null) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/admin/api/medya/liste");
        const payload = (await res.json().catch(() => null)) as
          | { assets?: MediaAssetDTO[]; error?: string }
          | null;
        if (cancelled) return;
        if (!res.ok || !payload?.assets) {
          setLoadError(payload?.error ?? "Medya listesi alınamadı.");
          setAssets([]);
          return;
        }
        setAssets(payload.assets);
      } catch {
        if (!cancelled) {
          setLoadError("Medya listesi alınamadı.");
          setAssets([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, assets]);

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr");
    if (!q) return assets ?? [];
    return (assets ?? []).filter(
      (a) =>
        a.filename.toLocaleLowerCase("tr").includes(q) ||
        a.alt.toLocaleLowerCase("tr").includes(q),
    );
  }, [assets, query]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(28,34,48,0.45)] p-6"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-[900px] max-w-full flex-col rounded-md border-t-2 border-t-gold bg-white shadow-[0_24px_60px_rgba(28,34,48,0.3)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-wrap items-center gap-3 border-b border-line px-6 py-4">
          <h2 className="m-0 text-[17px] font-bold">Görsel seç</h2>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Dosya adı veya alt metin ara…"
            className="ml-auto h-10 w-56 rounded border border-line bg-surface px-3 text-[13px] outline-none focus:border-gold"
          />
          <label className="cursor-pointer rounded bg-ink px-4 py-2.5 text-[12.5px] font-semibold text-cream transition-colors hover:bg-gold">
            {uploading ? `Yükleniyor… ${progress?.done}/${progress?.total}` : "Görsel yükle"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              multiple
              hidden
              disabled={uploading}
              onChange={(e) => e.target.files && void upload(e.target.files)}
            />
          </label>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded border border-line text-muted transition-colors hover:border-gold hover:text-gold"
            aria-label="Kapat"
          >
            ✕
          </button>
        </div>

        {(error || loadError) && (
          <p
            className="m-0 border-b border-line px-6 py-2.5 text-[12.5px]"
            style={{ background: "#FBF1F0", color: "#A23A32" }}
          >
            {error ?? loadError}
          </p>
        )}

        <div
          className="flex-1 overflow-y-auto p-6"
          {...dropZoneHandlers((files) => void upload(files))}
        >
          {assets === null ? (
            <p className="py-16 text-center text-sm text-muted">Yükleniyor…</p>
          ) : filtered.length === 0 ? (
            <div className="rounded-md border border-dashed border-line py-16 text-center">
              <span className="inline-block h-4 w-4 rotate-45 border-[1.5px] border-gold" />
              <p className="m-0 mt-4 text-[14px] font-semibold">
                {query ? "Eşleşen görsel yok." : "Henüz görsel yok."}
              </p>
              <p className="m-0 mt-1.5 text-[12.5px] text-muted">
                Buraya sürükleyip bırakabilir ya da yukarıdaki düğmeyi kullanabilirsiniz.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {filtered.map((asset) => {
                const active = currentUrl === asset.url;
                return (
                  <button
                    key={asset.id}
                    type="button"
                    onClick={() => {
                      onSelect(asset);
                      onClose();
                    }}
                    className="overflow-hidden rounded border text-left transition-colors"
                    style={{ borderColor: active ? "#9C7C4A" : "#E4DFD5" }}
                  >
                    <span className="relative block h-[110px] w-full bg-[#FAF8F3]">
                      <Image
                        src={asset.url}
                        alt={asset.alt || asset.filename}
                        fill
                        sizes="200px"
                        className="object-cover"
                      />
                    </span>
                    <span className="block px-2.5 py-2">
                      <span className="block overflow-hidden text-ellipsis whitespace-nowrap text-[11.5px] font-semibold">
                        {asset.filename}
                      </span>
                      <span className="mt-0.5 block font-mono text-[10px] text-muted">
                        {formatBytes(asset.size)}
                        {!asset.alt && <span className="ml-1.5 text-[#9C7C4A]">alt metin yok</span>}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
