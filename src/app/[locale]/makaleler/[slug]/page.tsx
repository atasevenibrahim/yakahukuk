import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import { DarkCTA } from "@/components/site/DarkCTA";
import { ReadingProgress } from "@/components/site/ReadingProgress";
import { CopyLinkButton } from "@/components/site/CopyLinkButton";
import {
  articleBySlug,
  articleSlugs,
  relatedArticles,
} from "@/content/articles";
import { team, teamMemberBySlug } from "@/content/team";
import type { Locale } from "@/i18n/routing";
import { alternates } from "@/lib/metadata";

export function generateStaticParams() {
  return articleSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const article = articleBySlug(slug, locale as Locale);
  if (!article) return {};
  return {
    title: article.title,
    description: article.excerpt,
    alternates: alternates({ pathname: "/makaleler/[slug]", params: { slug } }),
  };
}

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const article = articleBySlug(slug, locale as Locale);
  if (!article) notFound();

  const tActions = await getTranslations("actions");
  const tNav = await getTranslations("nav");
  const tArticles = await getTranslations("articlesPage");

  const authorEntry = team.find((m) => m.articleSlugs.includes(slug));
  const author = authorEntry ? teamMemberBySlug(authorEntry.slug, locale as Locale) : undefined;
  const related = relatedArticles(slug, locale as Locale, 3);

  return (
    <>
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
        <PlaceholderImage
          label="geniş kapak görseli — fotoğraf gelecek"
          className="h-[380px]"
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
          {article.body.map((block, index) => {
            if (block.type === "paragraph") {
              return (
                <p
                  key={index}
                  className="mt-4 text-[17px] leading-[1.7] text-pretty text-ink first:mt-0"
                >
                  {block.text}
                </p>
              );
            }
            if (block.type === "heading") {
              return (
                <h2
                  key={index}
                  className="mt-10 font-serif text-[28px] font-medium sm:text-[30px]"
                >
                  {block.text}
                </h2>
              );
            }
            if (block.type === "list") {
              return (
                <ul key={index} className="mt-5 flex flex-col gap-2.5 pl-[22px]">
                  {block.items.map((item) => (
                    <li key={item} className="text-[16.5px] leading-relaxed text-muted">
                      {item}
                    </li>
                  ))}
                </ul>
              );
            }
            return (
              <div
                key={index}
                className="mt-10 rounded-md border border-line border-l-2 border-l-gold bg-surface px-8 py-7"
              >
                <p className="m-0 font-serif text-[22px] italic leading-[1.5] text-pretty text-ink">
                  &ldquo;{block.text}&rdquo;
                </p>
              </div>
            );
          })}
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
