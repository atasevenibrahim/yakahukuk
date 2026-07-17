import type { Locale, Localized } from "./types";
import { pick } from "./types";

export type DiamondVariant =
  | "diamond" // içi boş, 45° döndürülmüş kare
  | "square" // içi boş kare
  | "circle" // içi boş daire
  | "rounded" // yuvarlatılmış, 45° kare
  | "dot" // küçük dolu eşkenar dörtgen
  | "corner"; // sol-alt köşe (L)

export type PracticeArea = {
  slug: string;
  icon: DiamondVariant;
  featured: boolean;
  t: Localized<{ title: string; excerpt: string }>;
};

// 12 çalışma alanı — mega menü sırası (mockup ile aynı).
export const practiceAreas: PracticeArea[] = [
  {
    slug: "aile-hukuku",
    icon: "diamond",
    featured: true,
    t: {
      tr: {
        title: "Aile Hukuku",
        excerpt:
          "Boşanma, velayet, nafaka ve mal paylaşımında sakin ve koruyucu temsil.",
      },
    },
  },
  {
    slug: "ceza-hukuku",
    icon: "square",
    featured: true,
    t: {
      tr: {
        title: "Ceza Hukuku",
        excerpt:
          "Soruşturmadan istinafa, savunmanızın her aşamasında yanınızdayız.",
      },
    },
  },
  {
    slug: "fikri-mulkiyet-hukuku",
    icon: "dot",
    featured: false,
    t: {
      tr: {
        title: "Fikri Mülkiyet Hukuku",
        excerpt:
          "Marka, patent ve telif haklarının tescili ile ihlallere karşı korunması.",
      },
    },
  },
  {
    slug: "gocmenlik-ve-vatandaslik-hukuku",
    icon: "circle",
    featured: false,
    t: {
      tr: {
        title: "Göçmenlik ve Vatandaşlık Hukuku",
        excerpt:
          "Oturma izni, vatandaşlık ve çalışma izni süreçlerinde uçtan uca danışmanlık.",
      },
    },
  },
  {
    slug: "idari-hukuk",
    icon: "corner",
    featured: true,
    t: {
      tr: {
        title: "İdari Hukuk",
        excerpt:
          "İptal ve tam yargı davalarında idare karşısında dengeyi kurarız.",
      },
    },
  },
  {
    slug: "iflas-hukuku",
    icon: "square",
    featured: false,
    t: {
      tr: {
        title: "İflas Hukuku",
        excerpt:
          "Konkordato, yeniden yapılandırma ve tasfiye süreçlerinde stratejik yönetim.",
      },
    },
  },
  {
    slug: "istinaf-hukuku",
    icon: "corner",
    featured: false,
    t: {
      tr: {
        title: "İstinaf Hukuku",
        excerpt:
          "Kararların istinaf ve temyiz incelemesinde titiz dilekçe ve takip.",
      },
    },
  },
  {
    slug: "kisisel-yaralanma-ve-mulk-hasari",
    icon: "diamond",
    featured: false,
    t: {
      tr: {
        title: "Kişisel Yaralanma ve Mülk Hasarı",
        excerpt:
          "Kaza, yaralanma ve mal hasarı tazminatlarında hakkınızın peşindeyiz.",
      },
    },
  },
  {
    slug: "sigorta-hukuku",
    icon: "rounded",
    featured: true,
    t: {
      tr: {
        title: "Sigorta Hukuku",
        excerpt:
          "Poliçe uyuşmazlıkları ve tazminat süreçlerinde hakkınızın takipçisiyiz.",
      },
    },
  },
  {
    slug: "ticaret-hukuku",
    icon: "circle",
    featured: true,
    t: {
      tr: {
        title: "Ticaret Hukuku",
        excerpt:
          "Şirket kuruluşu, sözleşmeler ve ticari uyuşmazlıklarda güvenli zemin.",
      },
    },
  },
  {
    slug: "tuketici-hukuku",
    icon: "dot",
    featured: false,
    t: {
      tr: {
        title: "Tüketici Hukuku",
        excerpt:
          "Ayıplı mal ve hizmet, cayma hakkı ve hakem heyeti süreçlerinde destek.",
      },
    },
  },
  {
    slug: "vergi-hukuku",
    icon: "dot",
    featured: true,
    t: {
      tr: {
        title: "Vergi Hukuku",
        excerpt:
          "Vergi incelemesi, uzlaşma ve davalarda mükellef haklarını savunuruz.",
      },
    },
  },
];

export type LocalizedPracticeArea = {
  slug: string;
  icon: DiamondVariant;
  featured: boolean;
  title: string;
  excerpt: string;
  href: string;
};

// Çalışma alanı detay sayfaları henüz yok → href şimdilik "#".
export function localizedPracticeAreas(
  locale: Locale,
): LocalizedPracticeArea[] {
  return practiceAreas.map((area) => ({
    slug: area.slug,
    icon: area.icon,
    featured: area.featured,
    href: "#",
    ...pick(area.t, locale),
  }));
}
