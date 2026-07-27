import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/Container";
import { DarkCTA } from "@/components/site/DarkCTA";
import { ArticleGrid } from "@/components/site/ArticleGrid";
import { JsonLd } from "@/components/site/JsonLd";
import { articleCategories, articlesByCategory } from "@/content/articles";
import type { Locale } from "@/i18n/routing";
import { alternates, absoluteUrl } from "@/lib/metadata";
import { breadcrumbSchema, collectionSchema } from "@/lib/seo/jsonld";

/**
 * Kategori arşivi — "aile hukuku makaleleri" tipi aramaların açılış sayfası.
 *
 * Kendi canonical/hreflang'i ve `CollectionPage` yapılandırılmış verisi var; makale listesinin
 * istemci tarafı filtresi Google için bir sayfa sayıldığından bu arşivler indekslenebilir
 * yüzeyi çalışma alanı sayısı kadar çoğaltıyor.
 */
export const revalidate = 3600;

export async function generateStaticParams() {
  const categories = await articleCategories();
  return categories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const { label, articles } = await articlesByCategory(slug, locale as Locale);
  if (articles.length === 0) return {};
  const t = await getTranslations("articlesPage");
  return {
    title: t("categoryArchiveTitle", { category: label }),
    description: t("categoryArchiveDescription", { category: label }),
    alternates: alternates(
      { pathname: "/makaleler/kategori/[slug]", params: { slug } },
      locale as Locale,
    ),
  };
}

export default async function CategoryArchivePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const { label, articles } = await articlesByCategory(slug, locale as Locale);
  // Makalesi olmayan kategori için sayfa yok — boş arşiv indekslenmemeli.
  if (articles.length === 0) notFound();

  const tNav = await getTranslations("nav");
  const tArticles = await getTranslations("articlesPage");
  const tActions = await getTranslations("actions");
  const categories = await articleCategories();

  const url = absoluteUrl(
    { pathname: "/makaleler/kategori/[slug]", params: { slug } },
    locale as Locale,
  );
  const title = tArticles("categoryArchiveTitle", { category: label });
  const breadcrumbs = [
    { name: tNav("home"), url: absoluteUrl("/", locale as Locale) },
    { name: tNav("articles"), url: absoluteUrl("/makaleler", locale as Locale) },
    { name: title, url },
  ];

  return (
    <>
      <JsonLd
        data={collectionSchema({
          name: title,
          description: tArticles("categoryArchiveDescription", { category: label }),
          url,
          locale: locale as Locale,
          items: articles.map((a) => ({
            title: a.title,
            url: absoluteUrl(
              { pathname: "/makaleler/[slug]", params: { slug: a.slug } },
              locale as Locale,
            ),
          })),
        })}
      />
      <JsonLd data={breadcrumbSchema(breadcrumbs)} />

      <Container className="pt-10">
        <div className="flex flex-wrap items-center gap-2 text-[13px] text-muted">
          <Link href="/" className="hover:text-gold">
            {tNav("home")}
          </Link>
          <span className="text-line">/</span>
          <Link href="/makaleler" className="hover:text-gold">
            {tNav("articles")}
          </Link>
          <span className="text-line">/</span>
          <span className="font-medium text-ink">{label}</span>
        </div>
      </Container>

      <Container className="pt-10">
        <div className="max-w-[720px]">
          <div className="flex items-center gap-3.5">
            <span className="relative block h-px w-[34px] bg-gold">
              <span
                aria-hidden
                className="absolute -top-[3px] right-[9px] block h-px w-2 rotate-[-45deg] bg-gold"
              />
            </span>
            <span className="font-mono text-[12.5px] tracking-[3px] text-muted">
              {tArticles("browseCategories")}
            </span>
          </div>
          <h1 className="mt-[22px] font-serif text-[38px] font-medium leading-[1.08] text-balance sm:text-[48px]">
            {title}
          </h1>
          <p className="mt-4 text-[15.5px] leading-relaxed text-muted">
            {tArticles("categoryArchiveDescription", { category: label })} ·{" "}
            {tArticles("archiveCount", { count: articles.length })}
          </p>
        </div>

        {/* Diğer kategoriler: konu kümesi içinde iç bağlantı. */}
        <div className="mt-9 flex flex-wrap gap-2.5">
          <Link
            href="/makaleler"
            className="rounded-full border border-line bg-surface px-[18px] py-2.5 font-sans text-[13.5px] font-semibold text-ink transition-colors hover:border-gold hover:text-gold"
          >
            {tArticles("allArticles")}
          </Link>
          {categories.map((cat) => {
            const active = cat.slug === slug;
            return (
              <Link
                key={cat.slug}
                href={{ pathname: "/makaleler/kategori/[slug]", params: { slug: cat.slug } }}
                aria-current={active ? "page" : undefined}
                className={
                  active
                    ? "rounded-full border border-ink bg-ink px-[18px] py-2.5 font-sans text-[13.5px] font-semibold text-cream"
                    : "rounded-full border border-line bg-surface px-[18px] py-2.5 font-sans text-[13.5px] font-semibold text-ink transition-colors hover:border-gold hover:text-gold"
                }
              >
                {cat.label.charAt(0) + cat.label.slice(1).toLocaleLowerCase("tr")}
              </Link>
            );
          })}
        </div>

        <div className="mt-12">
          <ArticleGrid articles={articles} />
        </div>
      </Container>

      <DarkCTA
        title="Bu konuda danışın."
        text="Yazılar genel bilgi verir; dosyanız size özeldir. Ön görüşme için randevu oluşturun."
        buttonLabel={tActions("book")}
      />
    </>
  );
}
