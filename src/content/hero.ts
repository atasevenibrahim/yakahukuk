import { prisma } from "@/lib/prisma";
import { safeQuery } from "@/lib/content/safe-query";

export type HomeHeroData = {
  headline: string; // "\n" ile ayrılmış satırlar (mevcut 2 satırlı <br/> düzeni için)
  subtext: string;
  closingCtaTitle: string;
  closingCtaText: string;
};

// DB'ye ulaşılamazsa düşülecek statik yedek — page.tsx'teki eski sabit değerlerle birebir.
const FALLBACK_HERO: HomeHeroData = {
  headline: "Dik duruş,\ndürüst hukuk.",
  subtext:
    "YAKA Hukuk & Danışmanlık, hakkınızı sakin ve sağlam bir duruşla savunur. Süreci bilerek ilerlersiniz; işin titizliği bize aittir.",
  closingCtaTitle: "Hakkınız için ilk adımı atın.",
  closingCtaText: "Ön görüşme için randevu oluşturun; ekibimiz aynı gün içinde dönüş yapar.",
};

export const getHomeHero = safeQuery(async (): Promise<HomeHeroData> => {
  const row = await prisma.homeHero.findFirst();
  if (!row) return FALLBACK_HERO;
  return {
    headline: row.headline,
    subtext: row.subtext,
    closingCtaTitle: row.closingCtaTitle,
    closingCtaText: row.closingCtaText,
  };
}, FALLBACK_HERO);
