import { getPathname } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { safeQuery } from "@/lib/content/safe-query";
import type { Locale, Localized } from "./types";
import { pick } from "./types";

export type Article = {
  slug: string;
  practiceAreaSlug: string;
  category: string; // görünen etiket (TR, büyük harf)
  publishedAt: Date; // date/isoDate artık buradan formatlanır
  readMinutes: number;
  tags: string[];
  featured: boolean;
  t: Localized<{
    title: string;
    excerpt: string;
    /** Markdown metni — render'da `parseMarkdown` ile AST'e çevrilir (bkz. lib/markdown.ts). */
    body: string;
    metaTitle?: string;
    metaDescription?: string;
  }>;
};

// Gerçek içerik girilene kadar kullanılan yer tutucu gövde.
function placeholderBody(intro: string): string {
  return `${intro}\n\n[Bu içerik admin panelindeki AI destekli editörden girilecektir.]`;
}

// DB'ye ulaşılamazsa düşülecek statik yedek — 9 makale, gerçek veri artık Admin Makaleler'de.
const FALLBACK_ARTICLES: Article[] = [
  {
    slug: "anlasmali-bosanmada-surec",
    practiceAreaSlug: "aile-hukuku",
    category: "AİLE HUKUKU",
    publishedAt: new Date("2026-07-12"),
    readMinutes: 6,
    tags: ["BOŞANMA", "PROTOKOL", "AİLE MAHKEMESİ"],
    featured: true,
    t: {
      tr: {
        title: "Anlaşmalı boşanmada süreç nasıl ilerler?",
        excerpt:
          "Protokol hazırlığından duruşma gününe, adım adım anlaşmalı boşanma.",
        body: `Anlaşmalı boşanma, tarafların boşanmanın tüm sonuçlarında uzlaştığı en hızlı boşanma yoludur. Doğru hazırlanmış bir protokolle çoğu zaman tek celsede sonuçlanır.

## Şartlar nelerdir?

Evliliğin kanunda öngörülen asgari süreyi tamamlamış olması ve tarafların boşanma ile mali sonuçları ve çocukların durumu konusunda anlaşmış olması gerekir. Hâkim, tarafları bizzat dinler ve protokolü uygun bulursa boşanmaya hükmeder.

- Evlilik kanunda öngörülen asgari süre kadar sürmüş olmalı
- Taraflar mahkemeye birlikte başvurmalı ya da biri diğerinin davasını kabul etmeli
- Protokol; nafaka, velayet, tazminat ve mal paylaşımını kapsamalı
- Taraflar duruşmada iradelerini bizzat açıklamalı

> İyi hazırlanmış bir protokol, yalnızca bugünü değil; velayet, nafaka ve mal rejimiyle yarını da güvence altına alır.

## Süreç adım adım

Protokolün hazırlanması, dava dilekçesiyle birlikte aile mahkemesine başvuru, duruşma gününün belirlenmesi ve tek celsede karar. Kararın kesinleşmesiyle nüfus kaydı güncellenir. Sürecin her adımında avukatınız protokol hükümlerinin uygulanabilirliğini denetler.

Ayrıntılı bilgi için [Aile Hukuku](/calisma-alanlari/aile-hukuku) sayfamıza bakabilirsiniz.

## Sonuç

Anlaşmalı boşanma hızlıdır; ama hız, özensizliğin mazereti olamaz. Protokolü imzalamadan önce mutlaka bir avukatla gözden geçirin. Bu yazı genel bilgilendirme amaçlıdır; hukuki tavsiye niteliği taşımaz.`,
      },
    },
  },
  {
    slug: "sirket-kurulusunda-sozlesme-titizligi",
    practiceAreaSlug: "ticaret-hukuku",
    category: "TİCARET HUKUKU",
    publishedAt: new Date("2026-06-28"),
    readMinutes: 8,
    tags: ["ŞİRKET KURULUŞU", "SÖZLEŞME", "TİCARET SİCİLİ"],
    featured: true,
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
    publishedAt: new Date("2026-06-15"),
    readMinutes: 5,
    tags: ["VERGİ İNCELEMESİ", "UZLAŞMA", "MÜKELLEF HAKLARI"],
    featured: true,
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
    publishedAt: new Date("2026-06-03"),
    readMinutes: 7,
    tags: ["POLİÇE REDDİ", "TAHKİM", "TAZMİNAT"],
    featured: false,
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
    publishedAt: new Date("2026-05-20"),
    readMinutes: 6,
    tags: ["VELAYET", "ÇOCUĞUN ÜSTÜN YARARI"],
    featured: false,
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
    publishedAt: new Date("2026-05-08"),
    readMinutes: 4,
    tags: ["İFADE", "MÜDAFİ", "SUSMA HAKKI"],
    featured: false,
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
    publishedAt: new Date("2026-04-24"),
    readMinutes: 5,
    tags: ["AYIPLI MAL", "SEÇİMLİK HAK"],
    featured: false,
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
    publishedAt: new Date("2026-04-10"),
    readMinutes: 6,
    tags: ["İDARİ DAVA", "DAVA SÜRESİ"],
    featured: false,
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
    publishedAt: new Date("2026-03-27"),
    readMinutes: 7,
    tags: ["CEZAİ ŞART", "TİCARİ SÖZLEŞME"],
    featured: false,
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

/**
 * Ham (locale seçilmemiş, yalnızca yayındaki) makale listesi — DB'den, başarısız olursa yedekten.
 *
 * `SCHEDULED` makaleler, `publishAt` zamanı geldiğinde kendiliğinden bu listeye girer; durumu
 * çeviren bir cron'a gerek yoktur. Sayfaların bunu görmesi için makale rotalarında ISR
 * (`export const revalidate`) tanımlı.
 */
export const getArticlesRaw = safeQuery(async (): Promise<Article[]> => {
  const rows = await prisma.article.findMany({
    where: {
      OR: [
        { status: "PUBLISHED" },
        { status: "SCHEDULED", publishAt: { lte: new Date() } },
      ],
    },
    // PostgreSQL DESC sıralamada NULL'ları başa koyar; tohumlanan makalelerin publishAt'i
    // boş olduğu için tarihi olan makale listenin SONUNA düşüyordu. nulls:"last" bunu düzeltir.
    orderBy: [{ publishAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
  });
  return rows.map((r) => ({
    slug: r.slug,
    practiceAreaSlug: r.practiceAreaSlug ?? "",
    category: r.category,
    publishedAt: r.publishAt ?? r.createdAt,
    readMinutes: r.readMinutes,
    tags: r.tags,
    featured: r.featured,
    t: r.t as Article["t"],
  }));
}, FALLBACK_ARTICLES);

export type LocalizedArticle = {
  slug: string;
  practiceAreaSlug: string;
  category: string;
  date: string; // "12 TEM 2026"
  isoDate: string; // "2026-07-12"
  readMinutes: number;
  tags: string[];
  featured: boolean;
  title: string;
  excerpt: string;
  body: string; // markdown
  metaTitle?: string;
  metaDescription?: string;
  href: string;
};

const DATE_FMT = new Intl.DateTimeFormat("tr-TR", {
  timeZone: "Europe/Istanbul",
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function localizeArticle(a: Article, locale: Locale): LocalizedArticle {
  return {
    slug: a.slug,
    practiceAreaSlug: a.practiceAreaSlug,
    category: a.category,
    date: DATE_FMT.format(a.publishedAt).toUpperCase(),
    isoDate: a.publishedAt.toISOString().slice(0, 10),
    readMinutes: a.readMinutes,
    tags: a.tags,
    featured: a.featured,
    href: getPathname({
      href: { pathname: "/makaleler/[slug]", params: { slug: a.slug } },
      locale,
    }),
    ...pick(a.t, locale),
  };
}

export async function localizedArticles(locale: Locale): Promise<LocalizedArticle[]> {
  const articles = await getArticlesRaw();
  return articles.map((a) => localizeArticle(a, locale));
}

export async function articleBySlug(slug: string, locale: Locale) {
  const articles = await getArticlesRaw();
  const a = articles.find((item) => item.slug === slug);
  return a ? localizeArticle(a, locale) : undefined;
}

export async function articleSlugs(): Promise<string[]> {
  const articles = await getArticlesRaw();
  return articles.map((a) => a.slug);
}

/** Belirli bir çalışma alanındaki makaleler (Çalışma Alanı Detay sidebar'ı için). */
export async function articlesByPracticeArea(
  practiceAreaSlug: string,
  locale: Locale,
  limit = 2,
): Promise<LocalizedArticle[]> {
  const articles = await getArticlesRaw();
  return articles
    .filter((a) => a.practiceAreaSlug === practiceAreaSlug)
    .slice(0, limit)
    .map((a) => localizeArticle(a, locale));
}

/** Aynı çalışma alanındaki diğer makaleler (kendisi hariç). */
export async function relatedArticles(
  slug: string,
  locale: Locale,
  limit = 3,
): Promise<LocalizedArticle[]> {
  const articles = await getArticlesRaw();
  const current = articles.find((a) => a.slug === slug);
  if (!current) return [];
  return articles
    .filter((a) => a.slug !== slug && a.practiceAreaSlug === current.practiceAreaSlug)
    .slice(0, limit)
    .map((a) => localizeArticle(a, locale));
}
