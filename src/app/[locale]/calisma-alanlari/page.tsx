import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Card } from "@/components/ui/Card";
import { AppIcon } from "@/components/ui/AppIcon";
import { Reveal } from "@/components/site/Reveal";
import { DarkCTA } from "@/components/site/DarkCTA";
import { localizedPracticeAreas } from "@/content/practice-areas";
import type { Locale } from "@/i18n/routing";
import { alternates } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  await params;
  const t = await getTranslations("nav");
  return { title: t("practiceAreas"), alternates: alternates("/calisma-alanlari") };
}

export default async function PracticeAreasPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("actions");
  const areas = localizedPracticeAreas(locale as Locale);

  return (
    <>
      <Container className="pt-20">
        <div className="max-w-[720px]">
          <Eyebrow label="ÇALIŞMA ALANLARI" draw className="animate-rise" />
          <h1 className="mt-[22px] font-serif text-[40px] font-medium leading-[1.08] text-balance sm:text-[52px] md:text-[60px]">
            On iki alanda, tek titizlik.
          </h1>
          <p className="mt-[22px] text-lg leading-relaxed text-pretty text-muted">
            Aile hukukundan vergiye, her alanda aynı yaklaşım: süreci açıkça
            anlatır, hakkınızı sonuna kadar savunuruz.
          </p>
        </div>
      </Container>

      <Reveal className="pt-16">
        <Container>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {areas.map((area) => (
              <a key={area.slug} href={area.href} className="block text-ink">
                <Card hover accent className="h-full p-7">
                  <AppIcon
                    name={area.icon}
                    size={20}
                    strokeWidth={1.75}
                    className="mb-5 ml-0.5 mt-0.5 text-gold"
                  />
                  <h3 className="m-0 text-[19px] font-semibold leading-snug">
                    {area.title}
                  </h3>
                  <p className="mb-4 mt-2 text-[14.5px] leading-relaxed text-muted">
                    {area.excerpt}
                  </p>
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-gold">
                    {t("details")}
                    <AppIcon name="arrowRight" size={14} />
                  </span>
                </Card>
              </a>
            ))}
          </div>
        </Container>
      </Reveal>

      <DarkCTA
        title="Hangi alanda desteğe ihtiyacınız var?"
        text="Emin değilseniz sorun yok — ön görüşmede dosyanızı birlikte değerlendirir, doğru alana yönlendiririz."
        buttonLabel={t("book")}
      />
    </>
  );
}
