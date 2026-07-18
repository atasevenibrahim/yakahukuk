"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AppIcon } from "@/components/ui/AppIcon";
import { cn } from "@/lib/cn";

type Item = { quote: string; author: string; rating: number };

/** Müvekkil yorumları carousel'i (oklar + noktalar, klavye erişilebilir). */
export function TestimonialsCarousel({ items }: { items: Item[] }) {
  const t = useTranslations("aria");
  const [index, setIndex] = useState(0);
  const count = items.length;
  if (count === 0) return null;

  return (
    <div>
      <div className="mt-8 overflow-hidden">
        <div
          className="flex transition-transform duration-[450ms] ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {items.map((item, idx) => (
            <blockquote
              key={idx}
              className="box-border w-full flex-none px-2"
              aria-hidden={idx !== index}
            >
              <div className="mt-5 font-serif text-[64px] leading-[0.5] text-gold">
                &ldquo;
              </div>
              <p className="mt-[18px] font-serif text-[27px] italic leading-[1.4] text-balance text-ink">
                {item.quote}
              </p>
              <div className="mt-5 flex gap-1 text-gold" aria-hidden>
                {Array.from({ length: 5 }, (_, i) => (
                  <AppIcon
                    key={i}
                    name="star"
                    size={15}
                    strokeWidth={1.5}
                    fill={i < item.rating ? "currentColor" : "none"}
                  />
                ))}
              </div>
              <p className="mt-3.5 font-mono text-[12.5px] tracking-[2px] text-muted">
                {item.author}
              </p>
            </blockquote>
          ))}
        </div>
      </div>

      <div className="mt-8 flex items-center justify-center gap-5">
        <button
          type="button"
          aria-label={t("prevTestimonial")}
          onClick={() => setIndex((index - 1 + count) % count)}
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-line bg-surface text-ink transition-colors hover:border-gold hover:text-gold"
        >
          <AppIcon name="chevronLeft" size={18} />
        </button>
        <div className="flex gap-2">
          {items.map((_, dot) => (
            <button
              key={dot}
              type="button"
              aria-label={t("gotoTestimonial")}
              aria-current={dot === index ? "true" : undefined}
              onClick={() => setIndex(dot)}
              className={cn(
                "h-[7px] w-[7px] cursor-pointer rounded-full border-none p-0",
                dot === index ? "bg-gold" : "bg-line",
              )}
            />
          ))}
        </div>
        <button
          type="button"
          aria-label={t("nextTestimonial")}
          onClick={() => setIndex((index + 1) % count)}
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-line bg-surface text-ink transition-colors hover:border-gold hover:text-gold"
        >
          <AppIcon name="chevronRight" size={18} />
        </button>
      </div>
    </div>
  );
}
