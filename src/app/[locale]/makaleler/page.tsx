import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/Container";
import { DarkCTA } from "@/components/site/DarkCTA";
import { ArticlesBrowser } from "@/components/site/ArticlesBrowser";
import { NewsletterForm } from "@/components/site/NewsletterForm";
import { articleTags, localizedArticles } from "@/content/articles";
import type { Locale } from "@/i18n/routing";
import { alternates } from "@/lib/metadata";

// Zamanlanmış makaleler publishAt geldiğinde listeye girsin (bkz. getArticlesRaw).
export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("nav");
  return { title: t("articles"), alternates: alternates("/makaleler", locale as Locale) };
}

export default async function ArticlesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("actions");
  const tArticles = await getTranslations("articlesPage");
  const [articles, tags] = await Promise.all([
    localizedArticles(locale as Locale),
    articleTags(),
  ]);

  return (
    <>
      <Container className="pt-20">
        <ArticlesBrowser articles={articles} />

        <div className="mt-16">
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

        {/* Etiket bulutu: arşiv sayfalarına taranabilir tek giriş noktası. */}
        {tags.length > 0 && (
          <div className="mt-16 border-t border-line pt-9">
            <span className="font-mono text-[12.5px] tracking-[3px] text-muted">
              {tArticles("browseTags")}
            </span>
            <div className="mt-5 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Link
                  key={tag.slug}
                  href={{ pathname: "/makaleler/etiket/[slug]", params: { slug: tag.slug } }}
                  className="rounded-full border border-line px-3.5 py-2 font-mono text-[10.5px] tracking-[1px] text-muted transition-colors hover:border-gold hover:text-gold"
                >
                  {tag.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </Container>

      <DarkCTA
        title="Sorunuz mu var? Danışın."
        text="Yazılar genel bilgi verir; dosyanız size özeldir. Ön görüşme için randevu oluşturun."
        buttonLabel={t("book")}
      />
    </>
  );
}
