"use client";

import { useMemo, useState } from "react";
import type { LocalizedTestimonial } from "@/content/testimonials";
import { AppIcon } from "@/components/ui/AppIcon";
import { cn } from "@/lib/cn";

export function TestimonialsBrowser({ items }: { items: LocalizedTestimonial[] }) {
  const [filter, setFilter] = useState("Tümü");

  const areas = useMemo(
    () => ["Tümü", ...Array.from(new Set(items.map((i) => i.areaLabel)))],
    [items],
  );
  const visible = useMemo(
    () => (filter === "Tümü" ? items : items.filter((i) => i.areaLabel === filter)),
    [items, filter],
  );
  const average = useMemo(
    () => (items.reduce((sum, i) => sum + i.rating, 0) / items.length).toFixed(1),
    [items],
  );

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-8">
        <div className="max-w-[640px]">
          <div className="flex items-center gap-3.5">
            <span className="relative block h-px w-[34px] animate-draw bg-gold">
              <span
                aria-hidden
                className="absolute -top-[3px] right-[9px] block h-px w-2 rotate-[-45deg] bg-gold"
              />
            </span>
            <span className="font-mono text-[12.5px] tracking-[3px] text-muted">
              MÜVEKKİL YORUMLARI
            </span>
          </div>
          <h1 className="mt-[22px] font-serif text-[40px] font-medium leading-[1.08] text-balance sm:text-[52px] md:text-[60px]">
            Bize güvenenlerin sözleri.
          </h1>
          <p className="mt-5 text-[17px] leading-relaxed text-pretty text-muted">
            Gizlilik gereği yorumlar yalnızca ad-soyad baş harfleriyle yayımlanır; tümü müvekkil
            onayıyla paylaşılmıştır.
          </p>
        </div>
        <div className="flex flex-none items-center gap-6 rounded-md border border-line bg-surface px-7 py-[22px] shadow-card">
          <div className="text-center">
            <div className="font-serif text-[44px] font-semibold leading-none">{average}</div>
            <div className="mt-1.5 flex justify-center gap-0.5 text-gold">
              {Array.from({ length: 5 }, (_, i) => (
                <AppIcon
                  key={i}
                  name="star"
                  size={13}
                  fill={i < Math.round(Number(average)) ? "currentColor" : "none"}
                />
              ))}
            </div>
          </div>
          <div className="h-full w-px self-stretch bg-line" />
          <div className="text-[13px] leading-relaxed text-muted">
            <span className="font-bold text-ink">{items.length}</span> yorum
            <br />
            ortalaması
          </div>
        </div>
      </div>

      <div className="mt-11 flex flex-wrap gap-2.5">
        {areas.map((area) => {
          const active = area === filter;
          return (
            <button
              key={area}
              type="button"
              onClick={() => setFilter(area)}
              className={cn(
                "cursor-pointer rounded-full border px-[18px] py-2.5 font-sans text-[13.5px] font-semibold transition-colors",
                active
                  ? "border-ink bg-ink text-cream"
                  : "border-line bg-surface text-ink hover:border-gold hover:text-gold",
              )}
            >
              {area === "Tümü" ? area : `${area.charAt(0)}${area.slice(1).toLocaleLowerCase("tr")} Hukuku`}
            </button>
          );
        })}
      </div>

      <div className="mt-11">
        {visible.length === 0 ? (
          <div className="rounded-md border border-line bg-surface px-8 py-16 text-center">
            <span className="inline-block h-[18px] w-[18px] rotate-45 border-[1.5px] border-gold" />
            <p className="mt-5 text-base font-semibold text-ink">Bu alanda henüz yorum yok.</p>
            <p className="mt-2 text-[14.5px] text-muted">
              Diğer alanlardaki yorumlara göz atabilirsiniz.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((item, index) => (
              <div
                key={`${item.initials}-${index}`}
                className="rounded-md border border-t-2 border-line border-t-transparent bg-surface p-7 shadow-card transition-all hover:-translate-y-0.5 hover:border-t-gold"
              >
                <div className="mt-2.5 font-serif text-[44px] leading-[0.5] text-gold">
                  &ldquo;
                </div>
                <p className="mt-3.5 text-pretty text-[15px] leading-[1.7] text-ink">
                  {item.quote}
                </p>
                <div className="mt-4 flex gap-0.5 text-gold">
                  {Array.from({ length: 5 }, (_, i) => (
                    <AppIcon
                      key={i}
                      name="star"
                      size={13}
                      fill={i < item.rating ? "currentColor" : "none"}
                    />
                  ))}
                </div>
                <div className="mt-3.5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
                  <span className="text-sm font-bold">{item.initials}</span>
                  <span className="rounded-full border border-line px-2.5 py-1 font-mono text-[10px] tracking-[1.5px] text-muted">
                    {item.areaLabel}
                  </span>
                </div>
                <p className="mt-2.5 font-mono text-[11px] text-muted">{item.monthLabel}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mx-auto mt-24 max-w-[840px] text-center">
        <p className="rounded-md border border-line bg-surface px-6 py-[18px] text-pretty text-[13.5px] leading-relaxed text-muted">
          <span className="font-mono text-[11px] tracking-[2px] text-gold">NOT</span> — Yorumlar
          bilgilendirme amaçlıdır; avukatlık mevzuatı gereği hizmet sonucuna dair taahhüt içermez.
          Tüm yorumlar yayın öncesi müvekkil onayından geçer.
        </p>
      </div>
    </>
  );
}
