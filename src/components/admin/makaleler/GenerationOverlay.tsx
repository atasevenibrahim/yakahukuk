"use client";

import { useEffect, useState } from "react";

/**
 * Yapay zeka metin üretirken gösterilen yükleme ekranı.
 *
 * Neden gerekli: model ilk kelimeyi yazmadan önce "düşünüyor" — gerçek bir ölçümde ilk metin
 * parçasından önce 451 düşünme token'ı harcadı. Önceden bu süre boyunca boş bir textarea
 * görünüyordu ve ekran donmuş gibi duruyordu.
 *
 * Aşamalar geçen süreye bağlı, gerçek model olaylarına değil. Bu yüzden sahte bir yüzde
 * çubuğu GÖSTERİLMEZ — bilmediğimiz bir ilerlemeyi biliyormuş gibi yapmak yanıltıcı olurdu;
 * bunun yerine gerçek olan iki şey gösterilir: geçen süre ve yazılan karakter sayısı.
 */

const PHASES = [
  { after: 0, label: "Konu çözümleniyor", detail: "Çalışma alanı ve başlık okunuyor." },
  { after: 6, label: "Bölümler planlanıyor", detail: "Yazının iskeleti çıkarılıyor." },
  { after: 14, label: "Metin yazılıyor", detail: "Mevzuata atıf yapılmıyor; bilinmeyen değerler işaretleniyor." },
  { after: 40, label: "Son okuma", detail: "Uzun yazılarda bu adım biraz daha sürebilir." },
] as const;

export function GenerationOverlay({
  startedAt,
  charCount,
  onCancel,
}: {
  /** Akışın başladığı an (ms). */
  startedAt: number;
  /** O ana kadar biriken karakter sayısı — gerçek ilerleme göstergesi. */
  charCount: number;
  onCancel: () => void;
}) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const tick = () => setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  const activeIndex = PHASES.reduce(
    (acc, phase, i) => (elapsed >= phase.after ? i : acc),
    0,
  );

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center rounded border border-line bg-[#FAF8F3] px-6 py-14 text-center"
    >
      <span
        aria-hidden
        className="mb-6 inline-block h-5 w-5 animate-spin rounded-sm border-[1.5px] border-line border-t-gold"
      />

      <p className="m-0 text-[15px] font-semibold text-ink">{PHASES[activeIndex].label}</p>
      <p className="m-0 mt-1.5 max-w-[420px] text-[12.5px] leading-relaxed text-muted">
        {PHASES[activeIndex].detail}
      </p>

      <ol className="m-0 mt-6 flex list-none flex-wrap items-center justify-center gap-2 p-0">
        {PHASES.map((phase, i) => (
          <li key={phase.label} className="flex items-center gap-2">
            <span
              className="h-1.5 w-8 rounded-full transition-colors"
              style={{ background: i <= activeIndex ? "#9C7C4A" : "#E4DFD5" }}
            />
          </li>
        ))}
      </ol>

      <p className="m-0 mt-5 font-mono text-[11px] tracking-[1px] text-muted">
        {elapsed} sn · {charCount > 0 ? `${charCount} karakter yazıldı` : "yanıt bekleniyor"}
      </p>
      <p className="m-0 mt-1 text-[11.5px] text-muted">Genellikle 30-60 saniye sürer.</p>

      <button
        type="button"
        onClick={onCancel}
        className="mt-6 rounded border border-line bg-surface px-5 py-2.5 text-[12.5px] font-semibold text-muted transition-colors hover:border-[#E8C5C1] hover:text-[#A23A32]"
      >
        İptal et
      </button>
    </div>
  );
}
