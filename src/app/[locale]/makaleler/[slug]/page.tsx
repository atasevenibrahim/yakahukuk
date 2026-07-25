import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { DarkCTA } from "@/components/site/DarkCTA";
import { ReadingProgress } from "@/components/site/ReadingProgress";
import { CopyLinkButton } from "@/components/site/CopyLinkButton";
import { ArticleBody } from "@/components/site/ArticleBody";
import { ArticleCover } from "@/components/site/ArticleCover";
import { JsonLd } from "@/components/site/JsonLd";
import {
  articleBySlug,
  articleSlugs,
  relatedArticles,
} from "@/content/articles";
import { getTeamRaw, teamMemberBySlug } from "@/content/team";
import type { Locale } from "@/i18n/routing";
import { alternates, absoluteUrl } from "@/lib/metadata";
import { articleSchema, breadcrumbSchema } from "@/lib/seo/jsonld";

// Zamanlanmış (SCHEDULED) makaleler publishAt geldiğinde yayına girer; statik sayfanın bunu
// görmesi için saatlik yeniden doğrulama. Cron'a gerek yok.
export const revalidate = 3600;

export async function generateStaticParams() {
  const slugs = await articleSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const article = await articleBySlug(slug, locale as Locale);
  if (!article) return {};
  const title = article.metaTitle || article.title;
  const description = article.metaDescription || article.excerpt;
  return {
    title,
    description,
    alternates: alternates({ pathname: "/makaleler/[slug]", params: { slug } }, locale as Locale),
    openGraph: {
      type: "article",
      title,
      description,
      url: absoluteUrl({ pathname: "/makaleler/[slug]", params: { slug } }, locale as Locale),
      publishedTime: article.isoDate,
      tags: article.tags,
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const article = await articleBySlug(slug, locale as Locale);
  if (!article) notFound();

  const tActions = await getTranslations("actions");
  const tNav = await getTranslations("nav");
  const tArticles = await getTranslations("articlesPage");

  const [team, related] = await Promise.all([
    getTeamRaw(),
    relatedArticles(slug, locale as Locale, 3),
  ]);
  const authorEntry = team.find((m) => m.articleSlugs.includes(slug));
  const author = authorEntry
    ? await teamMemberBySlug(authorEntry.slug, locale as Locale)
    : undefined;

  const breadcrumbs = [
    { name: tNav("home"), url: absoluteUrl("/", locale as Locale) },
    { name: tNav("articles"), url: absoluteUrl("/makaleler", locale as Locale) },
    {
      name: article.title,
      url: absoluteUrl({ pathname: "/makaleler/[slug]", params: { slug } }, locale as Locale),
    },
  ];

  return (
    <>
      <JsonLd
        data={articleSchema({
          title: article.metaTitle || article.title,
          description: article.metaDescription || article.excerpt,
          slug,
          isoDate: article.isoDate,
          locale: locale as Locale,
          imageUrl: `${breadcrumbs[2].url}/opengraph-image`,
          authorName: author?.name ?? "YAKA Hukuk & Danışmanlık",
          keywords: article.tags,
        })}
      />
      <JsonLd data={breadcrumbSchema(breadcrumbs)} />
      <ReadingProgress />

      {/* Breadcrumb */}
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
          <span className="font-medium text-ink">{article.title}</span>
        </div>
      </Container>

      <Container className="pt-10">
        <ArticleCover
          category={article.category}
          title={article.title}
          readMinutes={article.readMinutes}
        />
      </Container>

      <Container className="max-w-[784px] pt-14">
        <span className="font-mono text-xs tracking-[2.5px] text-gold">
          {article.category}
        </span>
        <h1 className="mt-4 font-serif text-[36px] font-medium leading-[1.12] text-balance sm:text-[48px]">
          {article.title}
        </h1>

        <div className="mt-6 flex flex-wrap items-center gap-3.5 border-b border-line pb-7">
          <span className="placeholder-pattern h-11 w-11 flex-none rounded-full border border-line" />
          <div className="flex flex-col gap-0.5">
            {author ? (
              <Link
                href={{ pathname: "/ekip/[slug]", params: { slug: author.slug } }}
                className="text-[14.5px] font-semibold text-ink hover:text-gold"
              >
                {author.name}
              </Link>
            ) : (
              <span className="text-[14.5px] font-semibold text-ink">YAKA Hukuk</span>
            )}
            <span className="font-mono text-[11.5px] text-muted">
              {article.date} · {article.readMinutes} DK OKUMA
            </span>
          </div>
        </div>

        <div className="mt-8">
          <ArticleBody markdown={article.body} />
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-5 border-t border-line pt-7">
          <div className="flex flex-wrap gap-2">
            {article.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-line px-3 py-1.5 font-mono text-[10.5px] tracking-[1px] text-muted"
              >
                {tag}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-[11.5px] tracking-[2px] text-muted">
              {tArticles("share")}
            </span>
            <CopyLinkButton
              label={tArticles("copyLink")}
              copiedLabel={tArticles("linkCopied")}
            />
          </div>
        </div>
      </Container>

      {related.length > 0 && (
        <Container className="pt-24">
          <div className="mb-8 flex items-end justify-between gap-6">
            <h2 className="m-0 font-serif text-[36px] font-medium">
              {tArticles("relatedArticles")}
            </h2>
            <Link
              href="/makaleler"
              className="flex-none border-b border-gold pb-0.5 text-[15px] font-semibold text-gold"
            >
              {tArticles("allArticles")} →
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <a key={item.slug} href={item.href} className="block text-ink">
                <Card hover className="h-full p-6">
                  <span className="font-mono text-[11px] tracking-[2px] text-gold">
                    {item.category}
                  </span>
                  <h3 className="mt-2.5 text-[17px] font-semibold leading-[1.4] text-balance">
                    {item.title}
                  </h3>
                  <p className="mt-3 font-mono text-[11.5px] text-muted">
                    {item.date} · {item.readMinutes} DK
                  </p>
                </Card>
              </a>
            ))}
          </div>
        </Container>
      )}

      <DarkCTA
        title="Bu konuda danışın."
        text="Yazılar genel bilgi verir; dosyanız size özeldir. Ön görüşme için randevu oluşturun."
        buttonLabel={tActions("book")}
      />
    </>
  );
}
