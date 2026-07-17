import type { Locale, Localized } from "./types";
import { pick } from "./types";

export type Article = {
  slug: string;
  category: string; // görünen etiket (TR, kısa/büyük harf)
  date: string; // "12 TEM 2026"
  isoDate: string;
  readMinutes: number;
  t: Localized<{ title: string; excerpt: string }>;
};

export const articles: Article[] = [
  {
    slug: "anlasmali-bosanmada-surec",
    category: "AİLE HUKUKU",
    date: "12 TEM 2026",
    isoDate: "2026-07-12",
    readMinutes: 6,
    t: {
      tr: {
        title: "Anlaşmalı boşanmada süreç nasıl ilerler?",
        excerpt:
          "Protokol hazırlığından duruşma gününe, adım adım anlaşmalı boşanma.",
      },
    },
  },
  {
    slug: "sirket-kurulusunda-sozlesme-titizligi",
    category: "TİCARET HUKUKU",
    date: "28 HAZ 2026",
    isoDate: "2026-06-28",
    readMinutes: 8,
    t: {
      tr: {
        title: "Şirket kuruluşunda sözleşme titizliği neden önemli?",
        excerpt:
          "Ortaklık yapısından imza yetkisine, kuruluşta atlanmaması gerekenler.",
      },
    },
  },
  {
    slug: "vergi-incelemesinde-mukellefin-haklari",
    category: "VERGİ HUKUKU",
    date: "15 HAZ 2026",
    isoDate: "2026-06-15",
    readMinutes: 5,
    t: {
      tr: {
        title: "Vergi incelemesinde mükellefin hakları nelerdir?",
        excerpt:
          "İnceleme tutanağından uzlaşmaya, bilmeniz gereken temel güvenceler.",
      },
    },
  },
  {
    slug: "police-reddinde-sigortalinin-yol-haritasi",
    category: "SİGORTA HUKUKU",
    date: "03 HAZ 2026",
    isoDate: "2026-06-03",
    readMinutes: 7,
    t: {
      tr: {
        title: "Poliçe reddi durumunda sigortalının yol haritası",
        excerpt:
          "Red gerekçesinden itiraz sürecine, tazminat hakkınızı korumanın yolları.",
      },
    },
  },
];

export type LocalizedArticle = {
  slug: string;
  category: string;
  date: string;
  isoDate: string;
  readMinutes: number;
  title: string;
  excerpt: string;
  href: string;
};

// Makale detay sayfaları henüz yok → href şimdilik "#".
export function localizedArticles(locale: Locale): LocalizedArticle[] {
  return articles.map((a) => ({
    slug: a.slug,
    category: a.category,
    date: a.date,
    isoDate: a.isoDate,
    readMinutes: a.readMinutes,
    href: "#",
    ...pick(a.t, locale),
  }));
}

export function articleBySlug(slug: string): Article | undefined {
  return articles.find((a) => a.slug === slug);
}
