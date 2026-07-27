import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { DarkCTA } from "@/components/site/DarkCTA";
import { ReadingProgress } from "@/components/site/ReadingProgress";
import { ShareButtons } from "@/components/site/ShareButtons";
import { NewsletterForm } from "@/components/site/NewsletterForm";
import { ViewCounter } from "@/components/site/ViewCounter";
import { ArticleBody } from "@/components/site/ArticleBody";
import { ArticleCover } from "@/components/site/ArticleCover";
import { TableOfContents } from "@/components/site/TableOfContents";
import { JsonLd } from "@/components/site/JsonLd";
import {
  articleBySlug,
  articleSlugs,
  relatedArticles,
} from "@/content/articles";
import { getTeamRaw, teamMemberBySlug } from "@/content/team";
import type { Locale } from "@/i18n/routing";
import { alternates, absoluteUrl } from "@/lib/metadata";
import { slugify } from "@/lib/admin/slugify";
import { articleSchema, breadcrumbSchema, faqSchema, personSchema } from "@/lib/seo/jsonld";

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
      modifiedTime: article.updatedIso,
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
  // Yazar önce makaleye atanmış slug'tan çözülür; yoksa ekip üyesinin articleSlugs dizisinden
  // ters arama yedeği devreye girer (eski davranış korunuyor).
  const authorSlug = article.authorSlug ?? team.find((m) => m.articleSlugs.includes(slug))?.slug;
  const author = authorSlug ? await teamMemberBySlug(authorSlug, locale as Locale) : undefined;

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
          modifiedIso: article.updatedIso,
          locale: locale as Locale,
          imageUrl: `${breadcrumbs[2].url}/opengraph-image`,
          authorName: author?.name ?? "YAKA Hukuk & Danışmanlık",
          keywords: article.tags,
        })}
      />
      <JsonLd data={breadcrumbSchema(breadcrumbs)} />
      {/* Yazar kimliği: hukuk içeriği Google'ın YMYL sınıfında, yazar otoritesi sıralama etkeni. */}
      {author && (
        <JsonLd
          data={personSchema({
            name: author.name,
            role: author.roleShort || author.role,
            slug: author.slug,
            locale: locale as Locale,
            languages: author.languages,
          })}
        />
      )}
      {/* Makaleye özel SSS varsa zengin sonuç için FAQPage. */}
      {article.faq.length > 0 && <JsonLd data={faqSchema(article.faq)} />}
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
          <Link
            href={{
              pathname: "/makaleler/kategori/[slug]",
              params: { slug: article.practiceAreaSlug },
            }}
            className="hover:text-gold"
          >
            {article.category}
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
          imageUrl={article.coverImageUrl}
        />
      </Container>

      <Container className="max-w-[784px] pt-14">
        <Link
          href={{
            pathname: "/makaleler/kategori/[slug]",
            params: { slug: article.practiceAreaSlug },
          }}
          className="font-mono text-xs tracking-[2.5px] text-gold hover:underline"
        >
          {article.category}
        </Link>
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
            {author?.bar && (
              <span className="font-mono text-[11px] text-muted">{author.bar}</span>
            )}
            <span className="flex flex-wrap items-center gap-x-1.5 font-mono text-[11.5px] text-muted">
              <span>
                {article.date} · {article.readMinutes} DK OKUMA
                {/* Google tazeliği dateModified'dan okuyor; okuyucuya da görünür olmalı. */}
                {article.wasUpdated && <> · SON GÜNCELLEME {article.updatedLabel}</>}
              </span>
              <span>·</span>
              <ViewCounter
                slug={slug}
                initialViews={article.views}
                label={tArticles("views")}
              />
            </span>
          </div>
        </div>

        {/* Google uzun makalelerde bu başlıklara doğrudan atlama bağlantısı basabiliyor. */}
        <div className="mt-8">
          <TableOfContents markdown={article.body} title={tArticles("tableOfContents")} />
        </div>

        <div className="mt-8">
          <ArticleBody markdown={article.body} />
        </div>

        {article.faq.length > 0 && (
          <section className="mt-12 border-t border-line pt-9">
            <h2 className="m-0 font-serif text-[28px] font-medium sm:text-[30px]">
              {tArticles("faqTitle")}
            </h2>
            <div className="mt-6 flex flex-col gap-3">
              {article.faq.map((item) => (
                <details
                  key={item.question}
                  className="rounded-md border border-line bg-surface px-6 py-4"
                >
                  <summary className="cursor-pointer text-[16px] font-semibold text-ink">
                    {item.question}
                  </summary>
                  <p className="m-0 mt-3 text-[15.5px] leading-[1.7] text-muted">{item.answer}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        <div className="mt-12 flex flex-wrap items-center justify-between gap-5 border-t border-line pt-7">
          {/* Etiketler arşivlerine bağlanır: konu kümesi içinde iç bağlantı yoğunluğu. */}
          <div className="flex flex-wrap gap-2">
            {article.tags.map((tag) => (
              <Link
                key={tag}
                href={{ pathname: "/makaleler/etiket/[slug]", params: { slug: slugify(tag) } }}
                className="rounded-full border border-line px-3 py-1.5 font-mono text-[10.5px] tracking-[1px] text-muted transition-colors hover:border-gold hover:text-gold"
              >
                {tag}
              </Link>
            ))}
          </div>
          <ShareButtons
            title={article.title}
            label={tArticles("share")}
            copyLabel={tArticles("copyLink")}
            copiedLabel={tArticles("linkCopied")}
          />
        </div>

        <div className="mt-10">
          <NewsletterForm
            title={tArticles("newsletterTitle")}
            text={tArticles("newsletterText")}
            placeholder={tArticles("newsletterPlaceholder")}
            buttonLabel={tArticles("newsletterButton")}
            successText={tArticles("newsletterSuccess")}
            alreadyText={tArticles("newsletterAlready")}
            privacyLabel={tArticles("newsletterPrivacy")}
          />
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
