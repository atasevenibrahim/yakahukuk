"use client";

import { useEffect, useState } from "react";

/**
 * Görüntülenme sayacı — sayfayı açınca bir kez artırır ve güncel sayıyı gösterir.
 *
 * `initialViews` sunucudan (statik sayfa) geliyor; en fazla bir saat eski olabilir. İstek
 * dönünce gerçek değerle değiştirilir. Aynı sekmede aynı makale tekrar açılırsa
 * `sessionStorage` işareti sayımı engeller — sayfa yenilemeyle sayı şişmez.
 *
 * Üçüncü taraf analitik yok, çerez yok: bu yüzden çerez onay bandrolü de gerekmiyor.
 */
export function ViewCounter({
  slug,
  initialViews,
  label,
}: {
  slug: string;
  initialViews: number;
  /** "GÖRÜNTÜLENME" — çeviriden gelir. */
  label: string;
}) {
  const [views, setViews] = useState(initialViews);

  useEffect(() => {
    const key = `yaka:viewed:${slug}`;
    if (window.sessionStorage.getItem(key)) return;
    window.sessionStorage.setItem(key, "1");

    const controller = new AbortController();
    fetch("/api/goruntulenme", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ slug }),
      signal: controller.signal,
      keepalive: true,
    })
      .then((r) => r.json())
      .then((data: { views?: number | null }) => {
        if (typeof data.views === "number") setViews(data.views);
      })
      // Sayaç ikincil: ağ hatası okuyucuya yansıtılmaz.
      .catch(() => {});

    return () => controller.abort();
  }, [slug]);

  return (
    <span className="font-mono text-[11.5px] text-muted">
      {views.toLocaleString("tr-TR")} {label}
    </span>
  );
}
