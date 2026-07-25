import { articleBySlug, articleSlugs } from "@/content/articles";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/seo/og-image";
import type { Locale } from "@/i18n/routing";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "YAKA Hukuk & Danışmanlık makalesi";

export async function generateStaticParams() {
  const slugs = await articleSlugs();
  return slugs.map((slug) => ({ slug }));
}

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const article = await articleBySlug(slug, locale as Locale);

  return renderOgImage({
    eyebrow: article?.category ?? "MAKALE",
    title: article?.title ?? "YAKA Hukuk & Danışmanlık",
    footerLeft: "yakahukuk.com",
    footerRight: article ? `${article.readMinutes} DK OKUMA` : undefined,
  });
}
