import { getPathname } from "@/i18n/navigation";
import type { Locale, Localized } from "./types";
import { pick } from "./types";

export type ArticleBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string }
  | { type: "list"; items: string[] }
  | { type: "quote"; text: string };

export type Article = {
  slug: string;
  practiceAreaSlug: string;
  category: string; // görünen etiket (TR, büyük harf)
  date: string; // "12 TEM 2026"
  isoDate: string;
  readMinutes: number;
  tags: string[];
  t: Localized<{ title: string; excerpt: string; body: ArticleBlock[] }>;
};

// Admin panelindeki zengin metin editörü gelene kadar kullanılan yer tutucu gövde.
function placeholderBody(intro: string): ArticleBlock[] {
  return [
    { type: "paragraph", text: intro },
    {
      type: "paragraph",
      text: "[Bu içerik admin panelindeki zengin metin editöründen girilecektir.]",
    },
  ];
}

export const articles: Article[] = [
  {
    slug: "anlasmali-bosanmada-surec",
    practiceAreaSlug: "aile-hukuku",
    category: "AİLE HUKUKU",
    date: "12 TEM 2026",
    isoDate: "2026-07-12",
    readMinutes: 6,
    tags: ["BOŞANMA", "PROTOKOL", "AİLE MAHKEMESİ"],
    t: {
      tr: {
        title: "Anlaşmalı boşanmada süreç nasıl ilerler?",
        excerpt:
          "Protokol hazırlığından duruşma gününe, adım adım anlaşmalı boşanma.",
        body: [
          {
            type: "paragraph",
            text: "Anlaşmalı boşanma, tarafların boşanmanın tüm sonuçlarında uzlaştığı en hızlı boşanma yoludur. Doğru hazırlanmış bir protokolle çoğu zaman tek celsede sonuçlanır. [Örnek içerik — makale gövdesi admin panelindeki zengin metin editöründen girilecek.]",
          },
          { type: "heading", text: "Şartlar nelerdir?" },
          {
            type: "paragraph",
            text: "Evliliğin en az bir yıl sürmüş olması ve tarafların boşanma ile mali sonuçları ve çocukların durumu konusunda anlaşmış olması gerekir. Hâkim, tarafları bizzat dinler ve protokolü uygun bulursa boşanmaya hükmeder.",
          },
          {
            type: "list",
            items: [
              "Evlilik en az 1 yıl sürmüş olmalı",
              "Taraflar mahkemeye birlikte başvurmalı ya da biri diğerinin davasını kabul etmeli",
              "Protokol; nafaka, velayet, tazminat ve mal paylaşımını kapsamalı",
              "Taraflar duruşmada iradelerini bizzat açıklamalı",
            ],
          },
          {
            type: "quote",
            text: "İyi hazırlanmış bir protokol, yalnızca bugünü değil; velayet, nafaka ve mal rejimiyle yarını da güvence altına alır.",
          },
          { type: "heading", text: "Süreç adım adım" },
          {
            type: "paragraph",
            text: "Protokolün hazırlanması, dava dilekçesiyle birlikte aile mahkemesine başvuru, duruşma gününün belirlenmesi ve tek celsede karar. Kararın kesinleşmesiyle nüfus kaydı güncellenir. Sürecin her adımında avukatınız protokol hükümlerinin uygulanabilirliğini denetler.",
          },
          { type: "heading", text: "Sonuç" },
          {
            type: "paragraph",
            text: "Anlaşmalı boşanma hızlıdır; ama hız, özensizliğin mazereti olamaz. Protokolü imzalamadan önce mutlaka bir avukatla gözden geçirin. Bu yazı genel bilgilendirme amaçlıdır; hukuki tavsiye niteliği taşımaz.",
          },
        ],
      },
    },
  },
  {
    slug: "sirket-kurulusunda-sozlesme-titizligi",
    practiceAreaSlug: "ticaret-hukuku",
    category: "TİCARET HUKUKU",
    date: "28 HAZ 2026",
    isoDate: "2026-06-28",
    readMinutes: 8,
    tags: ["ŞİRKET KURULUŞU", "SÖZLEŞME", "TİCARET SİCİLİ"],
    t: {
      tr: {
        title: "Şirket kuruluşunda sözleşme titizliği neden önemli?",
        excerpt:
          "Ortaklık yapısından imza yetkisine, kuruluşta atlanmaması gerekenler.",
        body: placeholderBody(
          "Şirket kuruluşunda ortaklık yapısından imza yetkisine kadar her ayrıntı, ileride doğabilecek uyuşmazlıkların önünü keser. Kuruluş sözleşmesinin titizlikle hazırlanması, şirketin ilk ve en kalıcı güvencesidir.",
        ),
      },
    },
  },
  {
    slug: "vergi-incelemesinde-mukellefin-haklari",
    practiceAreaSlug: "vergi-hukuku",
    category: "VERGİ HUKUKU",
    date: "15 HAZ 2026",
    isoDate: "2026-06-15",
    readMinutes: 5,
    tags: ["VERGİ İNCELEMESİ", "UZLAŞMA", "MÜKELLEF HAKLARI"],
    t: {
      tr: {
        title: "Vergi incelemesinde mükellefin hakları nelerdir?",
        excerpt:
          "İnceleme tutanağından uzlaşmaya, bilmeniz gereken temel güvenceler.",
        body: placeholderBody(
          "Vergi incelemesi süreci başladığında, mükellefin bilmesi gereken temel güvenceler vardır: inceleme tutanağına itiraz hakkı, uzlaşma yolu ve savunma için tanınan süreler bunların başında gelir.",
        ),
      },
    },
  },
  {
    slug: "police-reddinde-sigortalinin-yol-haritasi",
    practiceAreaSlug: "sigorta-hukuku",
    category: "SİGORTA HUKUKU",
    date: "03 HAZ 2026",
    isoDate: "2026-06-03",
    readMinutes: 7,
    tags: ["POLİÇE REDDİ", "TAHKİM", "TAZMİNAT"],
    t: {
      tr: {
        title: "Poliçe reddi durumunda sigortalının yol haritası",
        excerpt:
          "Red gerekçesinden itiraz sürecine, tazminat hakkınızı korumanın yolları.",
        body: placeholderBody(
          "Sigorta şirketinin poliçe kapsamındaki bir talebi reddetmesi, sürecin sonu değildir. Ret gerekçesinin hukuki dayanağını incelemek ve gerekirse tahkim veya dava yoluna başvurmak, sigortalının elindeki en güçlü araçlardır.",
        ),
      },
    },
  },
  {
    slug: "velayet-kararlarinda-cocugun-ustun-yarari",
    practiceAreaSlug: "aile-hukuku",
    category: "AİLE HUKUKU",
    date: "20 MAY 2026",
    isoDate: "2026-05-20",
    readMinutes: 6,
    tags: ["VELAYET", "ÇOCUĞUN ÜSTÜN YARARI"],
    t: {
      tr: {
        title: "Velayet kararlarında çocuğun üstün yararı",
        excerpt:
          "Mahkemeler velayeti neye göre belirler? Kriterler ve içtihat.",
        body: placeholderBody(
          "Velayet uyuşmazlıklarında mahkemelerin gözettiği temel ilke, çocuğun üstün yararıdır. Bu ilkenin somut olayda nasıl değerlendirildiğini bilmek, sürecin sonucunu doğrudan etkiler.",
        ),
      },
    },
  },
  {
    slug: "ifadeye-cagrildiniz-haklarinizi-biliyor-musunuz",
    practiceAreaSlug: "ceza-hukuku",
    category: "CEZA HUKUKU",
    date: "08 MAY 2026",
    isoDate: "2026-05-08",
    readMinutes: 4,
    tags: ["İFADE", "MÜDAFİ", "SUSMA HAKKI"],
    t: {
      tr: {
        title: "İfadeye çağrıldınız: haklarınızı biliyor musunuz?",
        excerpt:
          "Müdafi talebi, susma hakkı ve tutanak imzası hakkında temel bilgiler.",
        body: placeholderBody(
          "İfadeye çağrılmak kaygı verici olabilir; ancak müdafi talep etme ve susma hakkınız, sürecin en başından itibaren sizi korur. Tutanağı imzalamadan önce bilmeniz gereken temel haklar vardır.",
        ),
      },
    },
  },
  {
    slug: "ayipli-malda-tuketicinin-secimlik-haklari",
    practiceAreaSlug: "tuketici-hukuku",
    category: "TÜKETİCİ HUKUKU",
    date: "24 NİS 2026",
    isoDate: "2026-04-24",
    readMinutes: 5,
    tags: ["AYIPLI MAL", "SEÇİMLİK HAK"],
    t: {
      tr: {
        title: "Ayıplı malda tüketicinin seçimlik hakları",
        excerpt: "İade, değişim, indirim ve onarım: hangi durumda hangisi?",
        body: placeholderBody(
          "Satın aldığınız bir ürün ayıplı çıktığında; iade, değişim, bedel indirimi ve ücretsiz onarım arasında seçimlik bir hakkınız vardır. Hangi durumda hangisinin daha avantajlı olduğunu bilmek önemlidir.",
        ),
      },
    },
  },
  {
    slug: "idari-isleme-karsi-dava-acma-sureleri",
    practiceAreaSlug: "idari-hukuk",
    category: "İDARİ HUKUK",
    date: "10 NİS 2026",
    isoDate: "2026-04-10",
    readMinutes: 6,
    tags: ["İDARİ DAVA", "DAVA SÜRESİ"],
    t: {
      tr: {
        title: "İdari işleme karşı dava açma süreleri",
        excerpt:
          "Sürelerin kaçırılması hak kaybıdır; kritik tarihler ve istisnalar.",
        body: placeholderBody(
          "İdari bir işleme karşı dava açma süreleri, hak kaybına yol açabilecek kadar kritiktir. Sürenin başlangıcını doğru tespit etmek, davanın kabul edilebilirliği açısından belirleyicidir.",
        ),
      },
    },
  },
  {
    slug: "ticari-sozlesmelerde-cezai-sart-nasil-kurgulanir",
    practiceAreaSlug: "ticaret-hukuku",
    category: "TİCARET HUKUKU",
    date: "27 MAR 2026",
    isoDate: "2026-03-27",
    readMinutes: 7,
    tags: ["CEZAİ ŞART", "TİCARİ SÖZLEŞME"],
    t: {
      tr: {
        title: "Ticari sözleşmelerde cezai şart nasıl kurgulanır?",
        excerpt:
          "Caydırıcı ama geçerli cezai şartın sınırları ve kaleme alınışı.",
        body: placeholderBody(
          "Cezai şart, sözleşmeye caydırıcılık kazandırır; ancak orantısız kurgulandığında hâkim tarafından indirilebilir ya da geçersiz sayılabilir. Doğru kaleme alınmış bir cezai şart, tarafların gerçek niyetini yansıtmalıdır.",
        ),
      },
    },
  },
];

export type LocalizedArticle = {
  slug: string;
  practiceAreaSlug: string;
  category: string;
  date: string;
  isoDate: string;
  readMinutes: number;
  tags: string[];
  title: string;
  excerpt: string;
  body: ArticleBlock[];
  href: string;
};

function localizeArticle(a: Article, locale: Locale): LocalizedArticle {
  return {
    slug: a.slug,
    practiceAreaSlug: a.practiceAreaSlug,
    category: a.category,
    date: a.date,
    isoDate: a.isoDate,
    readMinutes: a.readMinutes,
    tags: a.tags,
    href: getPathname({
      href: { pathname: "/makaleler/[slug]", params: { slug: a.slug } },
      locale,
    }),
    ...pick(a.t, locale),
  };
}

export function localizedArticles(locale: Locale): LocalizedArticle[] {
  return articles.map((a) => localizeArticle(a, locale));
}

export function articleBySlug(slug: string, locale: Locale) {
  const a = articles.find((item) => item.slug === slug);
  return a ? localizeArticle(a, locale) : undefined;
}

export function articleSlugs(): string[] {
  return articles.map((a) => a.slug);
}

/** Belirli bir çalışma alanındaki makaleler (Çalışma Alanı Detay sidebar'ı için). */
export function articlesByPracticeArea(
  practiceAreaSlug: string,
  locale: Locale,
  limit = 2,
): LocalizedArticle[] {
  return articles
    .filter((a) => a.practiceAreaSlug === practiceAreaSlug)
    .slice(0, limit)
    .map((a) => localizeArticle(a, locale));
}

/** Aynı çalışma alanındaki diğer makaleler (kendisi hariç). */
export function relatedArticles(
  slug: string,
  locale: Locale,
  limit = 3,
): LocalizedArticle[] {
  const current = articles.find((a) => a.slug === slug);
  if (!current) return [];
  return articles
    .filter((a) => a.slug !== slug && a.practiceAreaSlug === current.practiceAreaSlug)
    .slice(0, limit)
    .map((a) => localizeArticle(a, locale));
}
