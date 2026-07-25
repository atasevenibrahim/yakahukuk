"use client";

import { useMemo } from "react";
import {
  buildVerificationReport,
  uniqueCitations,
  CITATION_HINTS,
  CITATION_LABELS,
} from "@/lib/ai/citations";

/**
 * Doğrulama paneli — yapay zekanın ürettiği metindeki somut hukuki/sayısal iddiaları listeler.
 *
 * Hesaplama tamamen istemcide, saf fonksiyonlarla yapılır (`lib/ai/citations.ts`): AI çağrısı
 * yok, ücretsiz ve anında. Kullanıcı metni düzenledikçe liste canlı güncellenir.
 *
 * İki kademe:
 * - `[DOĞRULANACAK]` işaretçileri: yapay zeka bilmediğini söylemiş → kırmızı, kaldırılması şart.
 * - Atıf bulguları: meşru olabilir → sarı, her biri için insan onayı istenir.
 */
export function VerificationPanel({
  text,
  confirmed,
  onToggle,
}: {
  text: string;
  /** Onaylanmış bulgu anahtarları. Verilmezse panel yalnızca bilgilendirir. */
  confirmed?: ReadonlySet<string>;
  onToggle?: (key: string, next: boolean) => void;
}) {
  const report = useMemo(() => buildVerificationReport(text), [text]);
  const findings = useMemo(() => uniqueCitations(report.citations), [report.citations]);

  if (!text.trim()) {
    return (
      <p className="m-0 text-[12px] text-muted">
        Metin üretildiğinde doğrulanması gereken bilgiler burada listelenecek.
      </p>
    );
  }

  const pendingCount = confirmed
    ? findings.filter((f) => !confirmed.has(f.key)).length
    : findings.length;
  const clean = report.placeholders.length === 0 && pendingCount === 0;

  return (
    <div className="flex flex-col gap-3">
      {clean && (
        <p
          className="m-0 rounded border px-3 py-2.5 text-[12.5px] leading-relaxed"
          style={{ borderColor: "#CDE0D4", background: "rgba(63,122,91,.06)", color: "#3F7A5B" }}
        >
          Doğrulanması gereken bilgi kalmadı.
        </p>
      )}

      {report.placeholders.length > 0 && (
        <div
          className="rounded border px-3 py-2.5"
          style={{ borderColor: "#E8C5C1", background: "#FBF1F0" }}
        >
          <p className="m-0 text-[12.5px] font-semibold text-[#A23A32]">
            {report.placeholders.length} bilgi eksik — yayınlanamaz
          </p>
          <p className="m-0 mt-1 text-[11.5px] leading-relaxed text-muted">
            Yapay zeka bu değerleri bilmediğini belirtti. Doğru bilgiyi yazıp{" "}
            <code>[DOĞRULANACAK: …]</code> işaretçilerini metinden kaldırın.
          </p>
          <ul className="m-0 mt-2 flex list-none flex-col gap-1 p-0">
            {report.placeholders.map((p, i) => (
              <li key={`${i}-${p}`} className="font-mono text-[11px] text-[#A23A32]">
                • {p}
              </li>
            ))}
          </ul>
        </div>
      )}

      {findings.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="m-0 text-[12px] font-semibold text-ink">
            {onToggle
              ? `Doğrulanacak bilgi: ${pendingCount}/${findings.length}`
              : `${findings.length} bilgi kaynaktan teyit edilmeli`}
          </p>
          <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
            {findings.map((f) => {
              const isConfirmed = confirmed?.has(f.key) ?? false;
              return (
                <li
                  key={f.key}
                  className="rounded border px-3 py-2"
                  style={{
                    borderColor: isConfirmed ? "#CDE0D4" : "#E4DFD5",
                    background: isConfirmed ? "rgba(63,122,91,.05)" : "#FFFFFF",
                  }}
                >
                  <div className="flex items-start gap-2.5">
                    {onToggle && (
                      <input
                        type="checkbox"
                        checked={isConfirmed}
                        onChange={(e) => onToggle(f.key, e.target.checked)}
                        className="mt-[3px] h-3.5 w-3.5 flex-none cursor-pointer accent-gold"
                        aria-label={`${f.match} bilgisini doğruladım`}
                      />
                    )}
                    <div className="min-w-0">
                      <p className="m-0 flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[11.5px] font-semibold text-ink">
                          {f.match}
                        </span>
                        <span className="font-mono text-[9.5px] tracking-[1px] text-gold">
                          {CITATION_LABELS[f.kind].toLocaleUpperCase("tr")}
                        </span>
                        <span className="font-mono text-[9.5px] text-muted">satır {f.line}</span>
                      </p>
                      <p className="m-0 mt-1 overflow-hidden text-ellipsis text-[11.5px] leading-relaxed text-muted">
                        {f.context.length > 120 ? `${f.context.slice(0, 120)}…` : f.context}
                      </p>
                      {!isConfirmed && (
                        <p className="m-0 mt-1 text-[11px] italic text-muted">
                          {CITATION_HINTS[f.kind]}
                        </p>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
