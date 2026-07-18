import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { DarkCTA } from "@/components/site/DarkCTA";
import { ArticlesBrowser } from "@/components/site/ArticlesBrowser";
import { localizedArticles } from "@/content/articles";
import type { Locale } from "@/i18n/routing";
import { alternates } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  await params;
  const t = await getTranslations("nav");
  return { title: t("articles"), alternates: alternates("/makaleler") };
}

export default async function ArticlesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("actions");
  const articles = localizedArticles(locale as Locale);

  return (
    <>
      <Container className="pt-20">
        <ArticlesBrowser articles={articles} />
      </Container>

      <DarkCTA
        title="Sorunuz mu var? Danışın."
        text="Yazılar genel bilgi verir; dosyanız size özeldir. Ön görüşme için randevu oluşturun."
        buttonLabel={t("book")}
      />
    </>
  );
}
