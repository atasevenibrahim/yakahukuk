"use client";

/**
 * AI önerilerini seçilebilir kartlar halinde gösterir. Sihirbaz ve editördeki AI yan paneli
 * aynı bileşeni kullanır.
 *
 * Tasarım kararı: öneri asla otomatik uygulanmaz. Kullanıcı "Kullan"a basmadan hiçbir alan
 * değişmez — böylece elle yazılmış bir metin sessizce ezilmiş olmaz.
 */

export type Suggestion = {
  /** Alana yazılacak değer. */
  value: string;
  /** Kartta gösterilecek metin (varsayılan: `value`). */
  preview?: string;
  /** Küçük açıklama satırı — ör. başlığın yaklaşımı. */
  note?: string;
};

export function SuggestionList({
  suggestions,
  onPick,
  /** Seçilen değeri vurgulamak için — ör. alanın mevcut içeriği. */
  currentValue,
  /** Karakter sayısı hedefi varsa gösterilir (SEO alanları için). */
  charTarget,
  emptyLabel = "Öneri yok.",
}: {
  suggestions: Suggestion[];
  onPick: (value: string) => void;
  currentValue?: string;
  charTarget?: { min: number; max: number };
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
              <p className="m-0 text-[13px] leading-relaxed text-ink">{label}</p>
              {s.note && <p className="m-0 mt-1 text-[11.5px] italic text-muted">{s.note}</p>}
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
