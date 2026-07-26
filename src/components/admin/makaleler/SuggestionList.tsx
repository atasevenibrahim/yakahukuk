"use client";

import { ArticleCardPreview, SerpPreview } from "./SerpPreview";

/**
 * AI önerilerini seçilebilir kartlar halinde gösterir. Sihirbaz ve editördeki AI yan paneli
 * aynı bileşeni kullanır.
 *
 * Tasarım kararı: öneri asla otomatik uygulanmaz. Kullanıcı "Kullan"a basmadan hiçbir alan
 * değişmez — böylece elle yazılmış bir metin sessizce ezilmiş olmaz.
 *
 * Seçenekler `previewAs` verildiğinde düz metin yerine **yayınlandığında görünecekleri hâlde**
 * gösterilir (Google sonuç kartı ya da sitedeki makale kartı). Üç başlık düz metin olarak
 * birbirine çok benzediği için karşılaştırma zordu; gerçek bağlamda fark hemen görülüyor.
 */

export type PreviewKind = "serp-title" | "serp-description" | "article-card" | "tags";

/** Önizlemenin ihtiyaç duyduğu, seçeneğin dışındaki sabit bağlam. */
export type PreviewContext = {
  url?: string;
  title?: string;
  description?: string;
  category?: string;
  readMinutes?: number;
};

export type Suggestion = {
  /** Alana yazılacak değer. */
  value: string;
  /** Kartta gösterilecek metin (varsayılan: `value`). */
  preview?: string;
  /** Küçük açıklama satırı — ör. başlığın yaklaşımı. */
  note?: string;
};

function PreviewFor({
  kind,
  value,
  context,
}: {
  kind: PreviewKind;
  value: string;
  context: PreviewContext;
}) {
  switch (kind) {
    case "serp-title":
      return (
        <SerpPreview
          title={value}
          description={context.description ?? ""}
          url={context.url ?? ""}
        />
      );
    case "serp-description":
      return (
        <SerpPreview title={context.title ?? ""} description={value} url={context.url ?? ""} />
      );
    case "article-card":
      return (
        <ArticleCardPreview
          category={context.category ?? ""}
          title={context.title ?? ""}
          excerpt={value}
          readMinutes={context.readMinutes ?? 5}
        />
      );
    case "tags":
      return (
        <div className="flex flex-wrap gap-1.5 rounded border border-line bg-white px-3 py-2.5">
          {value
            .split("\n")
            .map((t) => t.trim())
            .filter(Boolean)
            .map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-line px-2.5 py-1 font-mono text-[9.5px] tracking-[1px] text-gold"
              >
                {tag}
              </span>
            ))}
        </div>
      );
  }
}

export function SuggestionList({
  suggestions,
  onPick,
  /** Seçilen değeri vurgulamak için — ör. alanın mevcut içeriği. */
  currentValue,
  /** Karakter sayısı hedefi varsa gösterilir (SEO alanları için). */
  charTarget,
  /** Verilirse seçenek gerçek görünümüyle gösterilir. */
  previewAs,
  previewContext,
  emptyLabel = "Öneri yok.",
}: {
  suggestions: Suggestion[];
  onPick: (value: string) => void;
  currentValue?: string;
  charTarget?: { min: number; max: number };
  previewAs?: PreviewKind;
  previewContext?: PreviewContext;
  emptyLabel?: string;
}) {
  if (suggestions.length === 0) {
    return <p className="m-0 text-[12px] text-muted">{emptyLabel}</p>;
  }

  return (
    <ul className="m-0 flex list-none flex-col gap-2 p-0">
      {suggestions.map((s, i) => {
        const label = s.preview ?? s.value;
        const active = currentValue !== undefined && currentValue === s.value;
        const len = s.value.length;
        const inRange = charTarget ? len >= charTarget.min && len <= charTarget.max : true;

        return (
          <li key={`${i}-${s.value.slice(0, 24)}`}>
            <div
              className="rounded border px-3 py-2.5"
              style={{
                borderColor: active ? "#9C7C4A" : "#E4DFD5",
                background: active ? "rgba(156,124,74,.06)" : "#FFFFFF",
              }}
            >
              {previewAs ? (
                <PreviewFor kind={previewAs} value={s.value} context={previewContext ?? {}} />
              ) : (
                <p className="m-0 text-[13px] leading-relaxed text-ink">{label}</p>
              )}
              {s.note && <p className="m-0 mt-1.5 text-[11.5px] italic text-muted">{s.note}</p>}
              <div className="mt-2 flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => onPick(s.value)}
                  className="rounded border border-line bg-surface px-2.5 py-1 font-mono text-[10.5px] tracking-[0.5px] text-muted transition-colors hover:border-gold hover:text-gold"
                >
                  {active ? "KULLANILIYOR" : "KULLAN"}
                </button>
                {charTarget && (
                  <span
                    className="font-mono text-[10.5px]"
                    style={{ color: inRange ? "#3F7A5B" : "#9C7C4A" }}
                    title={`Hedef: ${charTarget.min}-${charTarget.max} karakter`}
                  >
                    {len} krk
                  </span>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
