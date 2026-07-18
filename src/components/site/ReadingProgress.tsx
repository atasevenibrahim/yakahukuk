"use client";

import { useEffect, useState } from "react";

/** Sayfa üstünde ince okuma ilerleme çubuğu (scroll yüzdesi). */
export function ReadingProgress() {
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const height = document.documentElement.scrollHeight - window.innerHeight;
      const value = height > 0 ? Math.min(100, Math.round((window.scrollY / height) * 100)) : 0;
      setPercent(value);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="fixed inset-x-0 top-0 z-[99] h-[3px] bg-transparent">
      <div
        className="h-full bg-gold transition-[width] duration-100 ease-linear"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
