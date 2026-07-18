import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  // Görsel optimizasyonu: şimdilik yalnızca /public kaynakları kullanılıyor.
  // Vercel Blob eklendiğinde remotePatterns buraya eklenecek.
  experimental: {
    // Kök layout [locale] gibi üst düzey dinamik bir segmentte tanımlı olduğu için
    // (bu projede ayrı bir app/layout.tsx yok), eşleşmeyen rastgele URL'leri yakalamak
    // için Next.js'in önerdiği resmi çözüm: global-not-found.
    globalNotFound: true,
  },
};

const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
