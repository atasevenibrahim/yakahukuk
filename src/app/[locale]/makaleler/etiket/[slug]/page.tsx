import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/Container";
import { DarkCTA } from "@/components/site/DarkCTA";
import { ArticleGrid } from "@/components/site/ArticleGrid";
import { JsonLd } from "@/components/site/JsonLd";
import { articleTags, articlesByTag } from "@/content/articles";
import type { Locale } from "@/i18n/routing";
import { alternates, absoluteUrl } from "@/lib/metadata";
import { breadcrumbSchema, collectionSchema } from "@/lib/seo/jsonld";

/**
 * Etiket arşivi — kategoriden daha dar, uzun kuyruk aramalara ("velayet", "ayıplı mal")
 * karşılık gelen açılış sayfaları. Etiketler `Article.tags`'ten türetiliyor.
 */
export const revalidate = 3600;

export async function generateStaticParams() {
  const tags = await articleTags();
  return tags.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const { label, articles } = await articlesByTag(slug, locale as Locale);
  if (articles.length === 0) return {};
  const t = await getTranslations("articlesPage");
  return {
    title: t("tagArchiveTitle", { tag: label }),
    description: t("tagArchiveDescription", { tag: label }),
    alternates: alternates(
      { pathname: "/makaleler/etiket/[slug]", params: { slug } },
      locale as Locale,
    ),
  };
}

export default async function TagArchivePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const { label, articles } = await articlesByTag(slug, locale as Locale);
  if (articles.length === 0) notFound();

  const tNav = await getTranslations("nav");
  const tArticles = await getTranslations("articlesPage");
  const tActions = await getTranslations("actions");
  const tags = await articleTags();

  const url = absoluteUrl(
    { pathname: "/makaleler/etiket/[slug]", params: { slug } },
    locale as Locale,
  );
  const title = tArticles("tagArchiveTitle", { tag: label });
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
          description: tArticles("tagArchiveDescription", { tag: label }),
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
              {tArticles("browseTags")}
            </span>
          </div>
          <h1 className="mt-[22px] font-serif text-[38px] font-medium leading-[1.08] text-balance sm:text-[48px]">
            {title}
          </h1>
          <p className="mt-4 text-[15.5px] leading-relaxed text-muted">
            {tArticles("tagArchiveDescription", { tag: label })} ·{" "}
            {tArticles("archiveCount", { count: articles.length })}
          </p>
        </div>

        {/* Komşu etiketler: uzun kuyruk sayfaları birbirine bağlar. */}
        <div className="mt-9 flex flex-wrap gap-2">
          {tags.map((tag) => {
            const active = tag.slug === slug;
            return (
              <Link
                key={tag.slug}
                href={{ pathname: "/makaleler/etiket/[slug]", params: { slug: tag.slug } }}
                aria-current={active ? "page" : undefined}
                className={
                  active
                    ? "rounded-full border border-ink bg-ink px-3.5 py-2 font-mono text-[10.5px] tracking-[1px] text-cream"
                    : "rounded-full border border-line px-3.5 py-2 font-mono text-[10.5px] tracking-[1px] text-muted transition-colors hover:border-gold hover:text-gold"
                }
              >
                {tag.label}
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
