import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  images: {
    // Medya kütüphanesi Supabase Storage'da duruyor; next/image uzak kaynakları yalnızca
    // burada izin verilen host'lardan yükler. Host, DATABASE_URL'deki proje ref'iyle aynı.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  experimental: {
    // Kök layout [locale] gibi üst düzey dinamik bir segmentte tanımlı olduğu için
    // (bu projede ayrı bir app/layout.tsx yok), eşleşmeyen rastgele URL'leri yakalamak
    // için Next.js'in önerdiği resmi çözüm: global-not-found.
    globalNotFound: true,
  },
};

const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
