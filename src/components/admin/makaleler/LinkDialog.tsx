"use client";

import { useMemo, useState } from "react";

/**
 * İç bağlantı seçici.
 *
 * Neden var: iç linkleme sayfa-içi SEO'nun en güçlü kalemlerinden biri, ama şimdiye kadar
 * kullanıcının `/calisma-alanlari/gayrimenkul-hukuku` gibi bir yolu elle yazması gerekiyordu —
 * yazım hatası sessizce kırık bağlantıya dönüşüyordu. Artık gerçek sayfa listesinden seçiliyor.
 */

export type LinkTargetOption = {
  title: string;
  href: string;
  /** "Çalışma alanı" | "Makale" — listede gruplama etiketi. */
  kind: string;
};

export function LinkDialog({
  open,
  onClose,
  targets,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  targets: LinkTargetOption[];
  onSelect: (href: string, label: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [manual, setManual] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr");
    if (!q) return targets;
    return targets.filter(
      (t) =>
        t.title.toLocaleLowerCase("tr").includes(q) ||
        t.href.toLocaleLowerCase("tr").includes(q),
    );
  }, [targets, query]);

  if (!open) return null;

  const manualValid = /^(\/|#|https?:\/\/)/i.test(manual.trim());

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-[rgba(28,34,48,0.45)] p-6 pt-24"
      onClick={onClose}
    >
      <div
        className="flex max-h-[70vh] w-[560px] max-w-full flex-col rounded-md border-t-2 border-t-gold bg-white shadow-[0_24px_60px_rgba(28,34,48,0.3)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-line px-5 py-4">
          <h2 className="m-0 mb-2.5 text-[15px] font-bold">Bağlantı ekle</h2>
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Sayfa adı ara…"
            className="h-10 w-full rounded border border-line px-3 text-[13px] outline-none focus:border-gold"
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="px-5 py-8 text-center text-[13px] text-muted">Eşleşen sayfa yok.</p>
          ) : (
            filtered.map((t) => (
              <button
                key={t.href}
                type="button"
                onClick={() => {
                  onSelect(t.href, t.title);
                  onClose();
                }}
                className="flex w-full flex-col gap-0.5 border-b border-cream px-5 py-2.5 text-left transition-colors hover:bg-[#FAF8F3]"
              >
                <span className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold text-ink">{t.title}</span>
                  <span className="font-mono text-[9px] tracking-[1px] text-gold">
                    {t.kind.toLocaleUpperCase("tr")}
                  </span>
                </span>
                <span className="font-mono text-[10.5px] text-muted">{t.href}</span>
              </button>
            ))
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-line px-5 py-3">
          <input
            type="text"
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            placeholder="veya dış adres: https://…"
            className="h-9 min-w-0 flex-1 rounded border border-line px-2.5 font-mono text-[11.5px] outline-none focus:border-gold"
          />
          <button
            type="button"
            disabled={!manualValid}
            onClick={() => {
              onSelect(manual.trim(), manual.trim());
              onClose();
            }}
            className="rounded bg-ink px-4 py-2 text-[12px] font-semibold text-cream disabled:opacity-50"
            title={manualValid ? undefined : "Yalnızca /, # ile başlayan yollar veya http(s) adresleri"}
          >
            Ekle
          </button>
        </div>
      </div>
    </div>
  );
}
