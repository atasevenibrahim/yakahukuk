import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["tr", "en"],
  defaultLocale: "tr",
  // /tr ve /en her zaman URL'de görünür (mockup'lardaki dil prefix'i).
  localePrefix: "always",
  // Dile özgü rota segmentleri (SEO). Yeni sayfalar eklendikçe genişletilir.
  pathnames: {
    "/": "/",
    "/hakkimizda": { tr: "/hakkimizda", en: "/about" },
    "/ekip": { tr: "/ekip", en: "/team" },
    "/ekip/[slug]": { tr: "/ekip/[slug]", en: "/team/[slug]" },
    "/calisma-alanlari": { tr: "/calisma-alanlari", en: "/practice-areas" },
    "/calisma-alanlari/[slug]": {
      tr: "/calisma-alanlari/[slug]",
      en: "/practice-areas/[slug]",
    },
    "/makaleler": { tr: "/makaleler", en: "/articles" },
    // Arşivler makale detayından ÖNCE tanımlı olmalı değil (next-intl birebir eşleşme yapıyor),
    // ama okunurluk için burada gruplandı: kategori ve etiket arşivleri her biri kendi
    // canonical/hreflang'i olan ayrı açılış sayfaları.
    "/makaleler/kategori/[slug]": {
      tr: "/makaleler/kategori/[slug]",
      en: "/articles/category/[slug]",
    },
    "/makaleler/etiket/[slug]": {
      tr: "/makaleler/etiket/[slug]",
      en: "/articles/tag/[slug]",
    },
    "/makaleler/[slug]": { tr: "/makaleler/[slug]", en: "/articles/[slug]" },
    "/basinda-biz": { tr: "/basinda-biz", en: "/press" },
    "/basinda-biz/[slug]": { tr: "/basinda-biz/[slug]", en: "/press/[slug]" },
    "/sss": { tr: "/sss", en: "/faq" },
    "/iletisim": { tr: "/iletisim", en: "/contact" },
    "/yasal": { tr: "/yasal", en: "/legal" },
    "/yorumlar": { tr: "/yorumlar", en: "/testimonials" },
    "/randevu-al": { tr: "/randevu-al", en: "/book-appointment" },
  },
});

export type Locale = (typeof routing.locales)[number];
