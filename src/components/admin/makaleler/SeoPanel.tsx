"use client";

import { useMemo } from "react";
import { analyzeSeo, scoreBand, SERP_DESCRIPTION_LIMIT, SERP_TITLE_LIMIT, type CheckStatus, type SeoInput } from "@/lib/seo/score";

/**
 * SEO paneli — tek bir sayı ve renkli satırlarla "bu makale yayına hazır mı?" sorusunu
 * uzman olmayan birinin de yanıtlayabilmesi için.
 *
 * Tüm hesaplama istemcide, saf fonksiyonlarla (`lib/seo/score.ts`): AI çağrısı yok, ücretsiz,
 * kullanıcı yazarken canlı güncelleniyor.
 */

const STATUS_COLOR: Record<CheckStatus, string> = {
  ok: "#3F7A5B",
  warn: "#9C7C4A",
  fail: "#A23A32",
};
const STATUS_MARK: Record<CheckStatus, string> = { ok: "✓", warn: "!", fail: "×" };

export function SeoPanel({ input }: { input: SeoInput }) {
  const analysis = useMemo(() => analyzeSeo(input), [input]);
  const band = scoreBand(analysis.score);

  return (
    <div className="flex flex-col gap-4">
      {/* Skor halkası + özet sayılar */}
      <div className="flex flex-wrap items-center gap-5">
        <ScoreRing score={analysis.score} color={band.color} />
        <div className="flex min-w-0 flex-col gap-1">
          <p className="m-0 text-sm font-bold" style={{ color: band.color }}>
            {band.label}
          </p>
          <dl className="m-0 grid grid-cols-2 gap-x-4 gap-y-0.5 text-[11.5px] text-muted">
            <dt className="m-0">Kelime</dt>
            <dd className="m-0 font-mono text-ink">{analysis.wordCount}</dd>
            <dt className="m-0">Okuma</dt>
            <dd className="m-0 font-mono text-ink">{analysis.readMinutes} dk</dd>
            <dt className="m-0">Okunabilirlik</dt>
            <dd className="m-0 font-mono text-ink">
              {analysis.readability.score} · {analysis.readability.label}
            </dd>
            <dt className="m-0">Bağlantı</dt>
            <dd className="m-0 font-mono text-ink">
              {analysis.internalLinks} iç / {analysis.externalLinks} dış
            </dd>
          </dl>
        </div>
      </div>

      {/* Google sonuç önizlemesi */}
      <div>
        <p className="m-0 mb-2 font-mono text-[9.5px] tracking-[1.5px] text-muted">
          GOOGLE&apos;DA BÖYLE GÖRÜNECEK
        </p>
        <div className="rounded border border-line bg-white px-4 py-3">
          <p className="m-0 truncate font-mono text-[11px] text-[#3F7A5B]">{analysis.serp.url}</p>
          <p className="m-0 mt-0.5 text-[16px] leading-snug text-[#1a0dab]">
            {truncate(analysis.serp.title, SERP_TITLE_LIMIT)}
            {analysis.serp.titleTruncated && <span className="text-muted">…</span>}
          </p>
          <p className="m-0 mt-1 text-[12.5px] leading-relaxed text-[#4d5156]">
            {truncate(analysis.serp.description, SERP_DESCRIPTION_LIMIT) || (
              <span className="italic text-muted">Meta açıklama boş — Google kendi seçtiği bir metni gösterir.</span>
            )}
            {analysis.serp.descriptionTruncated && <span className="text-muted">…</span>}
          </p>
        </div>
      </div>

      {/* Denetim satırları — düzeltilmesi gerekenler önce */}
      <ul className="m-0 flex list-none flex-col gap-1 p-0">
        {[...analysis.checks]
          .sort((a, b) => rank(a.status) - rank(b.status) || b.weight - a.weight)
          .map((c) => (
            <li key={c.id} className="flex items-start gap-2.5 border-b border-cream py-1.5 last:border-b-0">
              <span
                aria-hidden
                className="mt-[1px] flex h-[15px] w-[15px] flex-none items-center justify-center rounded-full text-[10px] font-bold text-white"
                style={{ background: STATUS_COLOR[c.status] }}
              >
                {STATUS_MARK[c.status]}
              </span>
              <div className="min-w-0">
                <p className="m-0 text-[12px] font-semibold text-ink">{c.label}</p>
                <p className="m-0 text-[11.5px] leading-relaxed text-muted">{c.detail}</p>
              </div>
            </li>
          ))}
      </ul>
    </div>
  );
}

function rank(status: CheckStatus): number {
  return status === "fail" ? 0 : status === "warn" ? 1 : 2;
}

function truncate(text: string, limit: number): string {
  return text.length > limit ? text.slice(0, limit).trimEnd() : text;
}

function ScoreRing({ score, color }: { score: number; color: string }) {
  const size = 76;
  const stroke = 7;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = (Math.max(0, Math.min(100, score)) / 100) * circumference;

  return (
    <div className="relative flex-none" style={{ width: size, height: size }}>
      <svg width={size} height={size} role="img" aria-label={`SEO skoru ${score} / 100`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E4DFD5"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circumference - filled}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center font-mono text-[19px] font-semibold"
        style={{ color }}
      >
        {score}
      </span>
    </div>
  );
}
