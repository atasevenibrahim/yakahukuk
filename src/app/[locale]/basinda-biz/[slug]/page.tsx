import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/Container";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import { AppIcon } from "@/components/ui/AppIcon";
import { DarkCTA } from "@/components/site/DarkCTA";
import { pressItemBySlug, pressSlugs } from "@/content/press";
import type { Locale } from "@/i18n/routing";
import { alternates } from "@/lib/metadata";

export async function generateStaticParams() {
  const slugs = await pressSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const item = await pressItemBySlug(slug, locale as Locale);
  if (!item) return {};
  return {
    title: item.title,
    description: item.excerpt,
    alternates: alternates({ pathname: "/basinda-biz/[slug]", params: { slug } }),
  };
}

export default async function PressDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const item = await pressItemBySlug(slug, locale as Locale);
  if (!item) notFound();

  const tActions = await getTranslations("actions");

  return (
    <>
      <Container className="max-w-[784px] pt-16">
        <Link
          href="/basinda-biz"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted transition-colors hover:text-gold"
        >
          <AppIcon name="arrowLeft" size={15} />
          Tüm haberler
        </Link>

        <div className="mt-7 flex flex-wrap items-center gap-3.5">
          <span className="font-mono text-xs tracking-[1px] text-gold">
            {item.date}
          </span>
          <span className="rounded-full border border-line px-2.5 py-1 font-mono text-[10px] tracking-[1.5px] text-muted">
            {item.tag}
          </span>
        </div>
        <h1 className="mt-4 font-serif text-[36px] font-medium leading-[1.12] text-balance sm:text-[44px]">
          {item.title}
        </h1>
        <p className="mt-7 text-[17px] leading-[1.75] text-pretty text-muted">
          {item.content}
        </p>
        <p className="mt-3.5 text-[17px] leading-[1.75] text-pretty text-muted">
          Detaylı içerik admin panelindeki zengin metin editöründen girilecektir.
          [Yer tutucu paragraf.]
        </p>

        {item.tag === "BASIN" && item.source && (
          <a
            href="#"
            className="mt-6 inline-flex items-center gap-2 border-b border-gold pb-0.5 text-[14.5px] font-semibold text-gold"
          >
            Kaynağa git ({item.source})
            <AppIcon name="externalLink" size={15} />
          </a>
        )}

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <PlaceholderImage label="galeri görseli 1" className="h-[200px]" />
          <PlaceholderImage label="galeri görseli 2" className="h-[200px]" />
        </div>
      </Container>

      <DarkCTA
        title="Hakkınız için ilk adımı atın."
        text="Ön görüşme için randevu oluşturun; ekibimiz aynı gün içinde dönüş yapar."
        buttonLabel={tActions("book")}
      />
    </>
  );
}
