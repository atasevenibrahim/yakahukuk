"use client";

import { useEffect, useState, type ElementType } from "react";

/**
 * Scroll ile görünürken yumuşak beliren sarmalayıcı.
 * Gizleme yalnızca `.js` sınıfı varken CSS'te uygulanır → no-JS/SEO güvenli.
 * `prefers-reduced-motion` globals.css'te devre dışı bırakılır.
 */
export function Reveal({
  as,
  className,
  threshold = 0.1,
  children,
}: {
  as?: ElementType;
  className?: string;
  threshold?: number;
  children: React.ReactNode;
}) {
  const Tag = as ?? "div";
  const [el, setEl] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      el.classList.add("is-visible");
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        }
      },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [el, threshold]);

  return (
    <Tag ref={setEl} data-reveal className={className}>
      {children}
    </Tag>
  );
}
