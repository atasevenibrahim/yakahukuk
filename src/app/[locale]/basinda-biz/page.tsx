import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { AppIcon } from "@/components/ui/AppIcon";
import { Reveal } from "@/components/site/Reveal";
import { DarkCTA } from "@/components/site/DarkCTA";
import { localizedPress } from "@/content/press";
import type { Locale } from "@/i18n/routing";
import { alternates } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  await params;
  const t = await getTranslations("nav");
  return { title: t("press"), alternates: alternates("/basinda-biz") };
}

export default async function PressPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("actions");
  const items = await localizedPress(locale as Locale);

  return (
    <>
      <Container className="pt-20">
        <div className="max-w-[720px]">
          <Eyebrow label="BASINDA BİZ · DUYURULAR" draw className="animate-rise" />
          <h1 className="mt-[22px] font-serif text-[40px] font-medium leading-[1.08] text-balance sm:text-[52px] md:text-[60px]">
            Bizden ve basından haberler.
          </h1>
        </div>
      </Container>

      <Reveal className="pt-16">
        <Container>
          <div className="flex max-w-[856px] flex-col">
            {items.map((item) => (
              <a
                key={item.slug}
                href={item.href}
                className="grid grid-cols-1 items-baseline gap-2 border-t border-line py-6 text-ink transition-colors hover:bg-surface sm:grid-cols-[130px_1fr_auto] sm:gap-6 sm:rounded sm:px-3"
              >
                <span className="font-mono text-xs tracking-[1px] text-gold">
                  {item.date}
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="m-0 text-[18.5px] font-semibold leading-[1.4]">
                      {item.title}
                    </h3>
                    <span className="flex-none rounded-full border border-line px-2.5 py-1 font-mono text-[10px] tracking-[1.5px] text-muted">
                      {item.tag}
                    </span>
                  </div>
                  <p className="mt-2 text-[14.5px] leading-relaxed text-pretty text-muted">
                    {item.excerpt}
                  </p>
                </div>
                <span className="inline-flex flex-none items-center gap-1 text-sm font-semibold text-gold">
                  Oku
                  <AppIcon name="arrowRight" size={14} />
                </span>
              </a>
            ))}
            <div className="border-t border-line" />
          </div>
        </Container>
      </Reveal>

      <DarkCTA
        title="Hakkınız için ilk adımı atın."
        text="Ön görüşme için randevu oluşturun; ekibimiz aynı gün içinde dönüş yapar."
        buttonLabel={t("book")}
      />
    </>
  );
}
