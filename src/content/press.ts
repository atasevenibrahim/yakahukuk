import { getPathname } from "@/i18n/navigation";
import type { Locale, Localized } from "./types";
import { pick } from "./types";

export type PressItem = {
  slug: string;
  date: string;
  isoDate: string;
  tag: "BASIN" | "DUYURU";
  source?: string; // dış kaynak adı (yalnızca tag === "BASIN" için anlamlı)
  t: Localized<{ title: string; excerpt: string; content: string }>;
};

export const pressItems: PressItem[] = [
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

export type LocalizedPressItem = {
  slug: string;
  date: string;
  isoDate: string;
  tag: "BASIN" | "DUYURU";
  source?: string;
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

export function localizedPress(locale: Locale): LocalizedPressItem[] {
  return pressItems.map((item) => localizePress(item, locale));
}

export function pressItemBySlug(slug: string, locale: Locale) {
  const item = pressItems.find((p) => p.slug === slug);
  return item ? localizePress(item, locale) : undefined;
}

export function pressSlugs(): string[] {
  return pressItems.map((p) => p.slug);
}
