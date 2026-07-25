import type { MetadataRoute } from "next";
import { BASE_URL } from "@/lib/metadata";

/**
 * Admin paneli ve API benzeri yollar taramadan çıkarılır. Admin rotaları ayrıca kendi
 * `metadata.robots = { index: false, follow: false }` başlığını da veriyor (admin/layout.tsx,
 * admin/giris/page.tsx) — burada ikinci bir katman olarak tarama tamamen engellenir.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/admin/"],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
