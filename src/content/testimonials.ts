import { prisma } from "@/lib/prisma";
import { safeQuery } from "@/lib/content/safe-query";
import type { Locale, Localized } from "./types";
import { pick } from "./types";

export type Testimonial = {
  practiceAreaSlug: string;
  areaLabel: string; // kısa büyük harf etiket (mockup ile aynı, "TİCARET" gibi)
  initials: string; // "A. K."
  monthLabel: string; // "HAZİRAN 2026"
  rating: number;
  t: Localized<{ quote: string }>;
};

// DB'ye ulaşılamazsa düşülecek statik yedek — 9 yorum, gerçek veri artık Admin İçerik'te.
const FALLBACK_TESTIMONIALS: Testimonial[] = [
  {
    practiceAreaSlug: "ticaret-hukuku",
    areaLabel: "TİCARET",
    initials: "A. K.",
    monthLabel: "HAZİRAN 2026",
    rating: 5,
    t: {
      tr: {
        quote:
          "Sürecin her adımında ne olduğunu bilerek ilerledik. Sorularımız hiç yanıtsız kalmadı; her duruşma öncesi arandık.",
      },
    },
  },
  {
    practiceAreaSlug: "aile-hukuku",
    areaLabel: "AİLE",
    initials: "S. D.",
    monthLabel: "HAZİRAN 2026",
    rating: 5,
    t: {
      tr: {
        quote:
          "Dosyamıza gösterilen titizlik gerçekten güven vericiydi. En zor günümüzde sakinliklerini hiç bozmadılar.",
      },
    },
  },
  {
    practiceAreaSlug: "sigorta-hukuku",
    areaLabel: "SİGORTA",
    initials: "M. Y.",
    monthLabel: "MAYIS 2026",
    rating: 5,
    t: {
      tr: {
        quote:
          "Net, sakin ve her zaman ulaşılabilir bir ekip. Gece geç saatte bile sorularıma dönüş aldım.",
      },
    },
  },
  {
    practiceAreaSlug: "vergi-hukuku",
    areaLabel: "VERGİ",
    initials: "E. T.",
    monthLabel: "MAYIS 2026",
    rating: 5,
    t: {
      tr: {
        quote:
          "Vergi incelemesi sürecinde adım adım yönlendirildik. Uzlaşma aşaması beklediğimizden çok daha iyi sonuçlandı.",
      },
    },
  },
  {
    practiceAreaSlug: "ceza-hukuku",
    areaLabel: "CEZA",
    initials: "H. B.",
    monthLabel: "NİSAN 2026",
    rating: 5,
    t: {
      tr: {
        quote:
          "İlk görüşmede süreci ve riskleri açıkça anlattılar. Pembe tablo çizmemeleri en güven veren kısımdı.",
      },
    },
  },
  {
    practiceAreaSlug: "ticaret-hukuku",
    areaLabel: "TİCARET",
    initials: "Z. A.",
    monthLabel: "NİSAN 2026",
    rating: 5,
    t: {
      tr: {
        quote:
          "Şirket kuruluşumuzda her sözleşme satır satır açıklandı. Hâlâ tüm hukuki işlerimizi onlara emanet ediyoruz.",
      },
    },
  },
  {
    practiceAreaSlug: "aile-hukuku",
    areaLabel: "AİLE",
    initials: "G. Ç.",
    monthLabel: "MART 2026",
    rating: 5,
    t: {
      tr: {
        quote:
          "Velayet sürecinde önceliğin hep çocuğumda olduğunu hissettim. İyi ki bu ekiple çalışmışız.",
      },
    },
  },
  {
    practiceAreaSlug: "sigorta-hukuku",
    areaLabel: "SİGORTA",
    initials: "O. S.",
    monthLabel: "MART 2026",
    rating: 4,
    t: {
      tr: {
        quote:
          "Poliçe reddine itiraz sürecini onlar yürüttü; tazminatımız eksiksiz ödendi. Süreç boyunca hiçbir belgeyle uğraşmadım.",
      },
    },
  },
  {
    practiceAreaSlug: "tuketici-hukuku",
    areaLabel: "TÜKETİCİ",
    initials: "N. K.",
    monthLabel: "ŞUBAT 2026",
    rating: 5,
    t: {
      tr: {
        quote:
          "Kurumsal ama samimi bir yaklaşım. Sorulan her soruya anlaşılır bir dille cevap veriyorlar; ağdalı hukuk dili yok.",
      },
    },
  },
];

/** Ham (locale seçilmemiş) yorum listesi — DB'den, başarısız olursa statik yedekten. */
export const getTestimonialsRaw = safeQuery(async (): Promise<Testimonial[]> => {
  const rows = await prisma.testimonial.findMany({
    where: { published: true },
    orderBy: { order: "asc" },
  });
  return rows.map((r) => ({
    practiceAreaSlug: r.practiceAreaSlug,
    areaLabel: r.areaLabel,
    initials: r.initials,
    monthLabel: r.monthLabel,
    rating: r.rating,
    t: r.t as Testimonial["t"],
  }));
}, FALLBACK_TESTIMONIALS);

export type LocalizedTestimonial = {
  practiceAreaSlug: string;
  areaLabel: string;
  initials: string;
  monthLabel: string;
  rating: number;
  quote: string;
  author: string; // "A. K. — TİCARET HUKUKU" — carousel gibi tekil metin gösterenler için
};

function localizeTestimonial(item: Testimonial, locale: Locale): LocalizedTestimonial {
  return {
    practiceAreaSlug: item.practiceAreaSlug,
    areaLabel: item.areaLabel,
    initials: item.initials,
    monthLabel: item.monthLabel,
    rating: item.rating,
    author: `${item.initials} — ${item.areaLabel} HUKUKU`,
    ...pick(item.t, locale),
  };
}

export async function localizedTestimonials(locale: Locale): Promise<LocalizedTestimonial[]> {
  const testimonials = await getTestimonialsRaw();
  return testimonials.map((item) => localizeTestimonial(item, locale));
}
