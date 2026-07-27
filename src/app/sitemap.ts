import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { absoluteUrl } from "@/lib/metadata";
import { slugify } from "@/lib/admin/slugify";
import { articleCategories, articleSlugs, articleTags, getArticlesRaw } from "@/content/articles";
import { practiceAreaSlugs } from "@/content/practice-areas";
import { teamSlugs } from "@/content/team";
import { pressSlugs } from "@/content/press";
import { getLegalDocumentsRaw } from "@/content/legal";

/**
 * Dinamik site haritası — statik sayfalar + DB'deki tüm içerik.
 *
 * İçerik erişimcilerinin hepsi `safeQuery` ile sarılı olduğu için DB'ye ulaşılamazsa statik
 * yedeğe düşer; build çökmez. Google'ın önerdiği düzen izlenir: sayfa başına tek `url` girdisi,
 * diller `alternates.languages` içinde hreflang olarak verilir.
 *
 * Zamanlanmış (`SCHEDULED`) makaleler `publishAt` geldiğinde `getArticlesRaw`'a girdiği için
 * bu harita da onları kendiliğinden içerir; ISR ile en fazla bir saat gecikmeyle tazelenir.
 */
export const revalidate = 3600;

type Entry = MetadataRoute.Sitemap[number];

// getPathname'in kabul ettiği href şekli
type Href = Parameters<typeof absoluteUrl>[0];

function entry(
  href: Href,
  options: { lastModified?: Date; changeFrequency?: Entry["changeFrequency"]; priority?: number } = {},
): Entry {
  const languages: Record<string, string> = {};
  for (const locale of routing.locales) {
    languages[locale] = absoluteUrl(href, locale);
  }
  return {
    url: absoluteUrl(href, routing.defaultLocale),
    lastModified: options.lastModified ?? new Date(),
    changeFrequency: options.changeFrequency ?? "monthly",
    priority: options.priority ?? 0.5,
    alternates: { languages },
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [
    articles,
    areaSlugs,
    memberSlugs,
    pressItemSlugs,
    legalDocs,
    publishedArticleSlugs,
    categories,
    tags,
  ] = await Promise.all([
    getArticlesRaw(),
    practiceAreaSlugs(),
    teamSlugs(),
    pressSlugs(),
    getLegalDocumentsRaw(),
    articleSlugs(),
    articleCategories(),
    articleTags(),
  ]);

  const lastArticleUpdate = articles.reduce<Date | undefined>(
    (latest, a) => (!latest || a.publishedAt > latest ? a.publishedAt : latest),
    undefined,
  );

  const staticPages: Entry[] = [
    entry("/", { changeFrequency: "weekly", priority: 1 }),
    entry("/calisma-alanlari", { changeFrequency: "monthly", priority: 0.9 }),
    entry("/ekip", { changeFrequency: "monthly", priority: 0.8 }),
    entry("/hakkimizda", { changeFrequency: "yearly", priority: 0.7 }),
    entry("/makaleler", {
      changeFrequency: "weekly",
      priority: 0.8,
      lastModified: lastArticleUpdate,
    }),
    entry("/basinda-biz", { changeFrequency: "monthly", priority: 0.6 }),
    entry("/sss", { changeFrequency: "monthly", priority: 0.7 }),
    entry("/yorumlar", { changeFrequency: "monthly", priority: 0.6 }),
    entry("/iletisim", { changeFrequency: "yearly", priority: 0.8 }),
    entry("/randevu-al", { changeFrequency: "yearly", priority: 0.9 }),
    entry("/yasal", {
      changeFrequency: "yearly",
      priority: 0.3,
      lastModified: legalDocs.reduce<Date | undefined>(
        (latest, d) => (!latest || d.updatedAt > latest ? d.updatedAt : latest),
        undefined,
      ),
    }),
  ];

  const articleEntries: Entry[] = publishedArticleSlugs.map((slug) => {
    const article = articles.find((a) => a.slug === slug);
    return entry(
      { pathname: "/makaleler/[slug]", params: { slug } },
      { changeFrequency: "monthly", priority: 0.7, lastModified: article?.updatedAt },
    );
  });

  // Arşiv sayfaları: yalnızca makalesi olanlar üretiliyor (bkz. articleCategories/articleTags),
  // dolayısıyla haritada boş sayfa yer almıyor. `lastModified` arşivdeki en yeni güncelleme.
  const archiveLastModified = (predicate: (a: (typeof articles)[number]) => boolean) =>
    articles
      .filter(predicate)
      .reduce<Date | undefined>(
        (latest, a) => (!latest || a.updatedAt > latest ? a.updatedAt : latest),
        undefined,
      );

  const categoryEntries: Entry[] = categories.map((cat) =>
    entry(
      { pathname: "/makaleler/kategori/[slug]", params: { slug: cat.slug } },
      {
        changeFrequency: "weekly",
        priority: 0.7,
        lastModified: archiveLastModified((a) => a.practiceAreaSlug === cat.slug),
      },
    ),
  );

  const tagEntries: Entry[] = tags.map((tag) =>
    entry(
      { pathname: "/makaleler/etiket/[slug]", params: { slug: tag.slug } },
      {
        changeFrequency: "weekly",
        priority: 0.5,
        lastModified: archiveLastModified((a) => a.tags.some((t) => slugify(t) === tag.slug)),
      },
    ),
  );

  const areaEntries: Entry[] = areaSlugs.map((slug) =>
    entry(
      { pathname: "/calisma-alanlari/[slug]", params: { slug } },
      { changeFrequency: "monthly", priority: 0.8 },
    ),
  );

  const memberEntries: Entry[] = memberSlugs.map((slug) =>
    entry({ pathname: "/ekip/[slug]", params: { slug } }, { changeFrequency: "yearly", priority: 0.6 }),
  );

  const pressEntries: Entry[] = pressItemSlugs.map((slug) =>
    entry(
      { pathname: "/basinda-biz/[slug]", params: { slug } },
      { changeFrequency: "yearly", priority: 0.4 },
    ),
  );

  return [
    ...staticPages,
    ...areaEntries,
    ...articleEntries,
    ...categoryEntries,
    ...tagEntries,
    ...memberEntries,
    ...pressEntries,
  ];
}
