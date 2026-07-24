import { getPathname } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { safeQuery } from "@/lib/content/safe-query";
import type { Locale, Localized } from "./types";
import { pick } from "./types";

export type PressItem = {
  slug: string;
  date: string;
  isoDate: string;
  tag: "BASIN" | "DUYURU";
  source?: string | null; // dış kaynak adı (yalnızca tag === "BASIN" için anlamlı)
  t: Localized<{ title: string; excerpt: string; content: string }>;
};

// DB'ye ulaşılamazsa düşülecek statik yedek — 5 basın kaydı, gerçek veri artık Admin İçerik'te.
const FALLBACK_PRESS: PressItem[] = [
  {
    slug: "hukuk-gundemi-dosyasinda-yaka-hukuk",
    date: "02 TEM 2026",
    isoDate: "2026-07-02",
    tag: "BASIN",
    source: "Hukuk Gündemi",
    t: {
      tr: {
        title:
          "YAKA Hukuk, Ankara'nın yükselen bürolarına dair dosyada yer aldı",
        excerpt:
          "Hukuk Gündemi dergisinin \"Başkentte yeni nesil bürolar\" dosyasında büromuza yer verildi.",
        content:
          "Hukuk Gündemi dergisinin Temmuz sayısında yayımlanan dosyada, büromuzun müvekkil iletişimi ve şeffaflık yaklaşımı öne çıkarıldı. [Yer tutucu özet.]",
      },
    },
  },
  {
    slug: "yaz-donemi-ucretsiz-on-degerlendirme-gunleri",
    date: "18 HAZ 2026",
    isoDate: "2026-06-18",
    tag: "DUYURU",
    t: {
      tr: {
        title: "Yaz dönemi ücretsiz ön değerlendirme günleri başlıyor",
        excerpt:
          "Temmuz ayı boyunca cuma günleri, tüketici hukuku dosyalarında ücretsiz ön değerlendirme yapılacaktır.",
        content:
          "Temmuz ayı boyunca her cuma 14:00–17:00 arasında, tüketici hukuku kapsamındaki dosyalar için ücretsiz ön değerlendirme randevusu verilecektir. [Yer tutucu detay.]",
      },
    },
  },
  {
    slug: "kurucu-avukatimiz-kira-uyusmazliklarini-degerlendirdi",
    date: "05 HAZ 2026",
    isoDate: "2026-06-05",
    tag: "BASIN",
    source: "Ekonomi TV",
    t: {
      tr: {
        title: "Kurucu avukatımız kira uyuşmazlıklarını değerlendirdi",
        excerpt:
          "Ekonomi TV canlı yayınında güncel kira davaları ve arabuluculuk süreci konuşuldu.",
        content:
          "Canlı yayında; kira tespit davaları, arabuluculuk şartı ve tahliye süreçlerine ilişkin sık sorulan sorular yanıtlandı. [Yer tutucu detay.]",
      },
    },
  },
  {
    slug: "buromuz-yeni-adresinde-hizmet-vermeye-basladi",
    date: "22 MAY 2026",
    isoDate: "2026-05-22",
    tag: "DUYURU",
    t: {
      tr: {
        title: "Büromuz yeni adresinde hizmet vermeye başladı",
        excerpt:
          "Beştepe, Meriç Sk. No:54/A adresindeki yeni ofisimizde müvekkillerimizi ağırlıyoruz.",
        content:
          "Genişleyen ekibimizle birlikte Beştepe'deki yeni ofisimize taşındık. Randevularınız aynı telefon ve e-posta üzerinden devam etmektedir. [Yer tutucu detay.]",
      },
    },
  },
  {
    slug: "kvkk-yukumlulukleri-uzerine-soylesi",
    date: "09 NİS 2026",
    isoDate: "2026-04-09",
    tag: "BASIN",
    source: "Başkent Gazetesi",
    t: {
      tr: {
        title: "KVKK yükümlülükleri üzerine söyleşi yayımlandı",
        excerpt:
          "KOBİ'lerin kişisel veri yükümlülükleri üzerine kapsamlı bir söyleşi.",
        content:
          "Söyleşide; VERBİS kaydı, aydınlatma yükümlülüğü ve veri ihlali bildirimlerine ilişkin pratik öneriler paylaşıldı. [Yer tutucu detay.]",
      },
    },
  },
];

/** Ham (locale seçilmemiş) basın listesi — DB'den, başarısız olursa statik yedekten. */
export const getPressItemsRaw = safeQuery(async (): Promise<PressItem[]> => {
  const rows = await prisma.pressItem.findMany({
    where: { published: true },
    orderBy: { order: "asc" },
  });
  return rows.map((r) => ({
    slug: r.slug,
    date: r.date,
    isoDate: r.isoDate.toISOString().slice(0, 10),
    tag: r.tag as "BASIN" | "DUYURU",
    source: r.source,
    t: r.t as PressItem["t"],
  }));
}, FALLBACK_PRESS);

export type LocalizedPressItem = {
  slug: string;
  date: string;
  isoDate: string;
  tag: "BASIN" | "DUYURU";
  source?: string | null;
  title: string;
  excerpt: string;
  content: string;
  href: string;
};

function localizePress(item: PressItem, locale: Locale): LocalizedPressItem {
  return {
    slug: item.slug,
    date: item.date,
    isoDate: item.isoDate,
    tag: item.tag,
    source: item.source,
    href: getPathname({
      href: { pathname: "/basinda-biz/[slug]", params: { slug: item.slug } },
      locale,
    }),
    ...pick(item.t, locale),
  };
}

export async function localizedPress(locale: Locale): Promise<LocalizedPressItem[]> {
  const pressItems = await getPressItemsRaw();
  return pressItems.map((item) => localizePress(item, locale));
}

export async function pressItemBySlug(slug: string, locale: Locale) {
  const pressItems = await getPressItemsRaw();
  const item = pressItems.find((p) => p.slug === slug);
  return item ? localizePress(item, locale) : undefined;
}

export async function pressSlugs(): Promise<string[]> {
  const pressItems = await getPressItemsRaw();
  return pressItems.map((p) => p.slug);
}
