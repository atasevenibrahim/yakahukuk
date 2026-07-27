"use client";

import type { FaqItem } from "@/app/admin/(panel)/makaleler/types";

/**
 * Makaleye özel SSS düzenleyici.
 *
 * Neden ayrı bir alan: Google `FAQPage` yapılandırılmış verisini soru-cevap çiftleri hâlinde
 * istiyor ve karşılığında arama sonucunda açılır soru listesi basabiliyor. Gövde markdown'ından
 * çıkarım yapmak kırılgan olurdu; çiftler burada açıkça giriliyor.
 */
export function FaqEditor({
  items,
  onChange,
  langLabel,
}: {
  items: FaqItem[];
  onChange: (next: FaqItem[]) => void;
  langLabel: string;
}) {
  function update(index: number, patch: Partial<FaqItem>) {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-3">
      {items.length === 0 && (
        <p className="m-0 text-[11.5px] leading-relaxed text-muted">
          Henüz soru yok. Okuyucunun Google&apos;a yazdığı gerçek soruları ekleyin — cevap ilk
          cümlede net verilirse arama sonucunda doğrudan gösterilebiliyor.
        </p>
      )}

      {items.map((item, i) => (
        <div key={i} className="rounded border border-line bg-white p-3">
          <div className="mb-2 flex items-center gap-1.5">
            <span className="font-mono text-[9.5px] tracking-[1.5px] text-muted">
              SORU {i + 1} · {langLabel}
            </span>
            <span className="ml-auto flex gap-1">
              <IconButton label="↑" title="Yukarı taşı" onClick={() => move(i, -1)} disabled={i === 0} />
              <IconButton
                label="↓"
                title="Aşağı taşı"
                onClick={() => move(i, 1)}
                disabled={i === items.length - 1}
              />
              <IconButton
                label="✕"
                title="Soruyu sil"
                danger
                onClick={() => onChange(items.filter((_, index) => index !== i))}
              />
            </span>
          </div>
          <input
            type="text"
            value={item.question}
            onChange={(e) => update(i, { question: e.target.value })}
            placeholder="Soru (ör. Anlaşmalı boşanma ne kadar sürer?)"
            className="mb-2 h-10 w-full rounded border border-line bg-surface px-3 text-[13px] text-ink outline-none focus:border-gold"
          />
          <textarea
            value={item.answer}
            onChange={(e) => update(i, { answer: e.target.value })}
            rows={3}
            placeholder="Kısa ve doğrudan cevap. Süre, tutar ya da madde numarası yazacaksanız kaynaktan doğrulayın."
            className="w-full resize-y rounded border border-line bg-surface px-3 py-2.5 text-[13px] leading-relaxed text-ink outline-none focus:border-gold"
          />
          <p className="m-0 mt-1 text-right font-mono text-[10px] text-muted">
            {item.answer.trim().length} karakter
          </p>
        </div>
      ))}

      <button
        type="button"
        onClick={() => onChange([...items, { question: "", answer: "" }])}
        className="self-start rounded border border-line bg-surface px-3.5 py-2 text-[12px] font-semibold text-muted transition-colors hover:border-gold hover:text-gold"
      >
        + Soru ekle
      </button>
    </div>
  );
}

function IconButton({
  label,
  title,
  onClick,
  disabled,
  danger,
}: {
  label: string;
  title: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`flex h-6 w-6 items-center justify-center rounded border border-line text-[11px] transition-colors disabled:opacity-40 ${
        danger ? "text-[#A23A32] hover:border-[#E8C5C1]" : "text-muted hover:border-gold hover:text-gold"
      }`}
    >
      {label}
    </button>
  );
}
