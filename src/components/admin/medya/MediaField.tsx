"use client";

import Image from "next/image";
import { useState } from "react";
import { MediaPicker } from "./MediaPicker";

/**
 * Görsel seçme alanı: önizleme + "Kütüphaneden seç" + "Kaldır".
 *
 * Kapak görseli, ekip portresi ve avatar alanlarının üçü de bunu kullanır. Önceden hepsi düz
 * bir URL kutusuydu ve "medya kütüphanesi eklenene kadar doğrudan adres girin" notu taşıyordu.
 * Elle URL yapıştırma yolu korunuyor — dış bir CDN'deki görsel de kullanılabilsin diye.
 */
export function MediaField({
  label,
  value,
  onChange,
  hint,
}: {
  /** Boş bırakılırsa etiket basılmaz — jenerik form zaten kendi etiketini gösteriyor. */
  label?: string;
  value: string;
  onChange: (url: string) => void;
  hint?: string;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-[13px] font-semibold">{label}</label>}

      {value ? (
        <div className="flex items-start gap-3">
          <div className="relative h-[72px] w-[100px] flex-none overflow-hidden rounded border border-line bg-[#FAF8F3]">
            <Image src={value} alt="" fill sizes="100px" className="object-cover" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <span className="overflow-hidden text-ellipsis whitespace-nowrap font-mono text-[10.5px] text-muted">
              {value}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="rounded border border-line bg-surface px-3 py-1.5 text-[11.5px] font-semibold text-muted transition-colors hover:border-gold hover:text-gold"
              >
                Değiştir
              </button>
              <button
                type="button"
                onClick={() => onChange("")}
                className="rounded border border-[#E8C5C1] bg-surface px-3 py-1.5 text-[11.5px] font-semibold text-[#A23A32] transition-colors hover:bg-[#FBF1F0]"
              >
                Kaldır
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="flex h-[72px] items-center justify-center gap-2 rounded border border-dashed border-line bg-surface text-[13px] font-semibold text-muted transition-colors hover:border-gold hover:text-gold"
        >
          <span aria-hidden>▦</span> Kütüphaneden görsel seç
        </button>
      )}

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="veya doğrudan görsel adresi yapıştırın"
        className="h-11 rounded border border-line bg-surface px-3.5 font-mono text-[12px] text-muted outline-none focus:border-gold"
      />
      {hint && <p className="m-0 text-[11.5px] leading-relaxed text-muted">{hint}</p>}

      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(asset) => onChange(asset.url)}
        currentUrl={value}
      />
    </div>
  );
}
