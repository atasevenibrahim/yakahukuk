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
  },
});

export type Locale = (typeof routing.locales)[number];
