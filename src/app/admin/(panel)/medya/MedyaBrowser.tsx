"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { AdminToast } from "@/components/admin/AdminToast";
import {
  dropZoneHandlers,
  formatBytes,
  useMediaUpload,
  type MediaAssetDTO,
} from "@/components/admin/medya/useMediaUpload";
import { deleteMedia, updateMediaAlt } from "./actions";

export function MedyaBrowser({
  initialAssets,
  storageConfigured,
}: {
  initialAssets: MediaAssetDTO[];
  storageConfigured: boolean;
}) {
  const [assets, setAssets] = useState(initialAssets);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(initialAssets[0]?.id ?? null);
  const [altDraft, setAltDraft] = useState(initialAssets[0]?.alt ?? "");
  const [savingAlt, setSavingAlt] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const { upload, uploading, error, progress } = useMediaUpload((asset) => {
    setAssets((cur) => [asset, ...cur]);
    setSelectedId(asset.id);
    setAltDraft("");
  });

  function showToast(message: string) {
    setToast(message);
    setTimeout(() => setToast((c) => (c === message ? null : c)), 2500);
  }

  const selected = assets.find((a) => a.id === selectedId) ?? null;
  const missingAltCount = assets.filter((a) => !a.alt.trim()).length;

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr");
    if (!q) return assets;
    return assets.filter(
      (a) =>
        a.filename.toLocaleLowerCase("tr").includes(q) ||
        a.alt.toLocaleLowerCase("tr").includes(q),
    );
  }, [assets, query]);

  async function handleSaveAlt() {
    if (!selected) return;
    setSavingAlt(true);
    const result = await updateMediaAlt(selected.id, altDraft);
    setSavingAlt(false);
    if (!result.ok) {
      showToast(result.error);
      return;
    }
    setAssets((cur) =>
      cur.map((a) => (a.id === selected.id ? { ...a, alt: altDraft.trim() } : a)),
    );
    showToast("Alt metin kaydedildi");
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    const id = deleteTarget;
    setDeleteTarget(null);
    const result = await deleteMedia(id);
    if (!result.ok) {
      showToast(result.error);
      return;
    }
    setAssets((cur) => {
      const next = cur.filter((a) => a.id !== id);
      if (selectedId === id) {
        setSelectedId(next[0]?.id ?? null);
        setAltDraft(next[0]?.alt ?? "");
      }
      return next;
    });
    showToast("Görsel silindi");
  }

  const deleteTargetAsset = assets.find((a) => a.id === deleteTarget) ?? null;
  const altDirty = Boolean(selected && altDraft.trim() !== selected.alt.trim());

  return (
    <div className="flex flex-1 flex-col gap-4 p-8">
      {!storageConfigured && (
        <p
          className="m-0 rounded border px-4 py-3 text-[13px] leading-relaxed"
          style={{ borderColor: "#E8C5C1", background: "#FBF1F0", color: "#A23A32" }}
        >
          Medya depolaması yapılandırılmamış: <code>SUPABASE_URL</code> ve{" "}
          <code>SUPABASE_SERVICE_ROLE_KEY</code> ortam değişkenleri eksik. Yükleme yapılamaz.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <p className="m-0 text-[12.5px] text-muted">
          {assets.length} görsel
          {missingAltCount > 0 && (
            <span className="ml-2 text-[#9C7C4A]">· {missingAltCount} tanesinde alt metin yok</span>
          )}
        </p>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Dosya adı veya alt metin ara…"
          className="ml-auto h-11 w-60 rounded border border-line bg-surface px-3.5 text-[14px] outline-none focus:border-gold"
        />
        <label className="cursor-pointer rounded bg-ink px-[22px] py-[11px] text-[13.5px] font-semibold text-cream transition-colors hover:bg-gold">
          {uploading ? `Yükleniyor… ${progress?.done}/${progress?.total}` : "+ Görsel yükle"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            multiple
            hidden
            disabled={uploading || !storageConfigured}
            onChange={(e) => e.target.files && void upload(e.target.files)}
          />
        </label>
      </div>

      {error && (
        <p
          className="m-0 rounded border px-4 py-2.5 text-[12.5px]"
          style={{ borderColor: "#E8C5C1", background: "#FBF1F0", color: "#A23A32" }}
        >
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div
          className="rounded-md border border-line bg-surface p-5 shadow-[0_1px_2px_rgba(28,34,48,0.05)]"
          {...dropZoneHandlers((files) => void upload(files))}
        >
          {filtered.length === 0 ? (
            <div className="rounded border border-dashed border-line py-16 text-center">
              <span className="inline-block h-4 w-4 rotate-45 border-[1.5px] border-gold" />
              <p className="m-0 mt-4 text-[14px] font-semibold">
                {query ? "Eşleşen görsel yok." : "Henüz görsel yok."}
              </p>
              <p className="m-0 mt-1.5 text-[12.5px] text-muted">
                Dosyaları buraya sürükleyip bırakabilirsiniz. JPEG, PNG, WebP veya AVIF · en fazla 5 MB.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {filtered.map((asset) => {
                const active = asset.id === selectedId;
                return (
                  <button
                    key={asset.id}
                    type="button"
                    onClick={() => {
                      setSelectedId(asset.id);
                      setAltDraft(asset.alt);
                    }}
                    className="overflow-hidden rounded border text-left transition-colors"
                    style={{ borderColor: active ? "#9C7C4A" : "#E4DFD5" }}
                  >
                    <span className="relative block h-[120px] w-full bg-[#FAF8F3]">
                      <Image
                        src={asset.url}
                        alt={asset.alt || asset.filename}
                        fill
                        sizes="220px"
                        className="object-cover"
                      />
                    </span>
                    <span className="block px-2.5 py-2">
                      <span className="block overflow-hidden text-ellipsis whitespace-nowrap text-[11.5px] font-semibold">
                        {asset.filename}
                      </span>
                      <span className="mt-0.5 block font-mono text-[10px] text-muted">
                        {formatBytes(asset.size)}
                        {!asset.alt && <span className="ml-1.5 text-[#9C7C4A]">alt yok</span>}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          {selected ? (
            <div className="rounded-md border border-line bg-surface p-5 shadow-[0_1px_2px_rgba(28,34,48,0.05)]">
              <span className="font-mono text-[10px] tracking-[2px] text-gold">DETAY</span>
              <h2 className="m-0 mb-3.5 mt-1.5 break-all text-[15px] font-bold">
                {selected.filename}
              </h2>

              <div className="relative mb-4 h-[160px] w-full overflow-hidden rounded border border-line bg-[#FAF8F3]">
                <Image
                  src={selected.url}
                  alt={selected.alt || selected.filename}
                  fill
                  sizes="320px"
                  className="object-contain"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold">Alt metin</label>
                <textarea
                  value={altDraft}
                  onChange={(e) => setAltDraft(e.target.value)}
                  rows={3}
                  placeholder="Görselde ne olduğunu kısaca yazın."
                  className="rounded border border-line bg-surface px-3.5 py-3 text-[14px] leading-relaxed outline-none focus:border-gold"
                />
                <p className="m-0 text-[11.5px] leading-relaxed text-muted">
                  Görme engelli ziyaretçiler ve arama motorları görseli bu metinden anlar.
                  Boş bırakılırsa görsel SEO&apos;ya katkı vermez.
                </p>
                <button
                  type="button"
                  onClick={handleSaveAlt}
                  disabled={savingAlt || !altDirty}
                  className="mt-1 self-start rounded bg-ink px-5 py-2.5 text-[12.5px] font-semibold text-cream transition-colors hover:bg-gold disabled:opacity-50"
                >
                  {savingAlt ? "Kaydediliyor…" : "Alt metni kaydet"}
                </button>
              </div>

              <dl className="m-0 mt-4 grid grid-cols-2 gap-x-3 gap-y-1 border-t border-line pt-3.5 text-[11.5px]">
                <dt className="m-0 text-muted">Boyut</dt>
                <dd className="m-0 font-mono text-ink">{formatBytes(selected.size)}</dd>
                <dt className="m-0 text-muted">Tür</dt>
                <dd className="m-0 font-mono text-ink">{selected.mimeType.replace("image/", "")}</dd>
              </dl>

              <button
                type="button"
                onClick={() => setDeleteTarget(selected.id)}
                className="mt-4 w-full rounded border border-[#E8C5C1] bg-surface px-5 py-2.5 text-[12.5px] font-semibold text-[#A23A32] transition-colors hover:bg-[#FBF1F0]"
              >
                Görseli sil
              </button>
            </div>
          ) : (
            <div className="rounded-md border border-dashed border-line bg-surface p-10 text-center">
              <p className="m-0 text-[14px] font-semibold">Detay için bir görsel seçin.</p>
            </div>
          )}
        </div>
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-[98] flex items-center justify-center bg-[rgba(28,34,48,0.4)] p-6">
          <div className="w-[420px] max-w-full rounded-md border-t-2 border-t-[#A23A32] bg-white p-8 shadow-[0_24px_60px_rgba(28,34,48,0.3)]">
            <h2 className="m-0 font-serif text-2xl font-semibold">Görseli silmek üzeresiniz</h2>
            <p className="m-0 mt-3 text-sm leading-relaxed text-muted">
              <strong>{deleteTargetAsset?.filename}</strong> kalıcı olarak silinecek. Bu görseli
              kullanan makale veya ekip kartları varsa görselleri kırılır.
            </p>
            <div className="mt-[26px] flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded border border-line bg-surface px-5 py-[11px] text-[13.5px] font-semibold text-muted transition-colors hover:border-gold hover:text-gold"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="rounded bg-[#A23A32] px-[22px] py-[11px] text-[13.5px] font-semibold text-white"
              >
                Evet, sil
              </button>
            </div>
          </div>
        </div>
      )}

      <AdminToast message={toast} />
    </div>
  );
}
