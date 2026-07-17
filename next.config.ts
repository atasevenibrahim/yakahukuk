import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  // Görsel optimizasyonu: şimdilik yalnızca /public kaynakları kullanılıyor.
  // Vercel Blob eklendiğinde remotePatterns buraya eklenecek.
};

const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
