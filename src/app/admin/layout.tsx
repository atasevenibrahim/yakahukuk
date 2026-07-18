import type { Metadata } from "next";
import { cormorant, manrope, plexMono } from "../fonts";
import "../globals.css";

export const metadata: Metadata = {
  title: { default: "Yönetim Paneli — YAKA Hukuk", template: "%s · YAKA Hukuk Yönetim" },
  robots: { index: false, follow: false },
};

/**
 * `/admin` ağacı next-intl `[locale]` bağlamının dışında (bkz. src/proxy.ts matcher'ı),
 * bu yüzden kendi kök HTML belgesini sağlar — global-not-found.tsx ile aynı gerekçe.
 * Oturum guard'ı burada değil, iç (panel) route group layout'unda: /admin/giris bu
 * kabuğu paylaşır ama guard'a takılıp yönlendirme döngüsüne girmemesi gerekir.
 */
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={`${manrope.variable} ${cormorant.variable} ${plexMono.variable}`}>
      <body className="min-h-screen bg-cream text-ink antialiased">{children}</body>
    </html>
  );
}
