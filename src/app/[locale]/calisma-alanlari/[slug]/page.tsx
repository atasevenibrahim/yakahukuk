import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { AppIcon } from "@/components/ui/AppIcon";
import { DarkCTA } from "@/components/site/DarkCTA";
import {
  practiceAreaBySlug,
  practiceAreaSlugs,
  relatedTeamSlugsForArea,
} from "@/content/practice-areas";
import { articlesByPracticeArea } from "@/content/articles";
import { teamMemberBySlug } from "@/content/team";
import { getSiteSettings, phoneHref, emailHref } from "@/lib/site-settings";
import type { Locale } from "@/i18n/routing";
import { alternates } from "@/lib/metadata";

// Tüm alanlarda ortak süreç adımları (mockup'ta da jenerik).
const steps = [
  { no: "01", title: "Görüşme", text: "Dosyanızı ve beklentinizi gizlilik içinde dinleriz." },
  { no: "02", title: "Değerlendirme", text: "Hukuki durumu ve olasılıkları açıkça ortaya koyarız." },
  { no: "03", title: "Strateji", text: "Uzlaşma mı, dava mı? Yol haritasını birlikte çizeriz." },
  { no: "04", title: "Takip", text: "Her duruşma ve gelişmede sizi bilgilendiririz." },
];

export async function generateStaticParams() {
  const slugs = await practiceAreaSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const area = await practiceAreaBySlug(slug, locale as Locale);
  if (!area) return {};
  return {
    title: area.title,
    description: area.excerpt,
    alternates: alternates({ pathname: "/calisma-alanlari/[slug]", params: { slug } }),
  };
}

export default async function PracticeAreaDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const area = await practiceAreaBySlug(slug, locale as Locale);
  if (!area) notFound();

  const tActions = await getTranslations("actions");
  const tNav = await getTranslations("nav");
  const [settings, relatedTeamSlugs, relatedArticleItems] = await Promise.all([
    getSiteSettings(),
    relatedTeamSlugsForArea(slug),
    articlesByPracticeArea(slug, locale as Locale, 2),
  ]);

  const relatedTeam = (
    await Promise.all(
      relatedTeamSlugs.map((memberSlug) => teamMemberBySlug(memberSlug, locale as Locale)),
    )
  )
    .filter((m): m is NonNullable<typeof m> => Boolean(m))
    .slice(0, 2);

  return (
    <>
      {/* Breadcrumb */}
      <Container className="pt-10">
        <div className="flex flex-wrap items-center gap-2 text-[13px] text-muted">
          <Link href="/" className="hover:text-gold">
            {tNav("home")}
          </Link>
          <span className="text-line">/</span>
          <Link href="/calisma-alanlari" className="hover:text-gold">
            {tNav("practiceAreas")}
          </Link>
          <span className="text-line">/</span>
          <span className="font-medium text-ink">{area.title}</span>
        </div>
      </Container>

      {/* Hero */}
      <Container className="pt-12">
        <div className="max-w-[720px]">
          <Eyebrow label="ÇALIŞMA ALANI" draw className="animate-rise" />
          <h1 className="mt-[22px] font-serif text-[40px] font-medium leading-[1.08] sm:text-[52px] md:text-[60px]">
            {area.title}
          </h1>
          <p className="mt-[22px] text-lg leading-relaxed text-pretty text-muted">
            {area.excerpt}
          </p>
        </div>
      </Container>

      <Container className="grid grid-cols-1 items-start gap-12 pt-16 lg:grid-cols-[1fr_380px] lg:gap-[72px]">
        {/* Sol: içerik */}
        <div className="max-w-[720px]">
          <h2 className="mb-4 font-serif text-[32px] font-medium">
            Bu alanda ne yapıyoruz?
          </h2>
          {area.whatWeDo.map((paragraph, index) => (
            <p
              key={index}
              className={`text-base leading-[1.7] text-pretty text-muted ${index > 0 ? "mt-3.5" : ""}`}
            >
              {paragraph}
            </p>
          ))}

          <h2 className="mb-5 mt-12 font-serif text-[32px] font-medium">
            Tipik dava ve işler
          </h2>
          <div className="flex flex-col">
            {area.typicalCases.map((item, index) => (
              <div
                key={item}
                className={`flex items-baseline gap-4 border-t border-line py-3.5 ${index === area.typicalCases.length - 1 ? "border-b" : ""}`}
              >
                <span className="mt-0.5 h-[9px] w-[9px] flex-none rotate-45 border-[1.5px] border-gold" />
                <span className="text-[15.5px] leading-relaxed text-ink">{item}</span>
              </div>
            ))}
          </div>

          <h2 className="mb-6 mt-12 font-serif text-[32px] font-medium">
            Süreç nasıl ilerler?
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {steps.map((step) => (
              <div key={step.no} className="border-t border-line pt-[18px]">
                <span className="font-mono text-[12.5px] tracking-[2px] text-gold">
                  {step.no}
                </span>
                <h3 className="mt-2.5 text-[16.5px] font-semibold">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{step.text}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-between gap-5 rounded-md border border-line bg-surface px-7 py-6">
            <p className="m-0 text-[15px] leading-relaxed text-muted">
              Aklınıza takılanlar mı var? {area.title.toLocaleLowerCase("tr")} ile
              ilgili sık sorulan soruları derledik.
            </p>
            <Link
              href="/sss"
              className="inline-flex flex-none items-center gap-1 border-b border-gold pb-0.5 text-[14.5px] font-semibold text-gold"
            >
              {tNav("faq")}&apos;ye git
              <AppIcon name="arrowRight" size={14} />
            </Link>
          </div>
        </div>

        {/* Sağ: yapışkan sidebar */}
        <div className="flex flex-col gap-5 lg:sticky lg:top-24">
          <Card accent className="p-7">
            <h3 className="m-0 font-serif text-2xl font-semibold">
              Bu konuda randevu alın
            </h3>
            <p className="mt-2.5 text-sm leading-relaxed text-muted">
              Ön görüşmede dosyanızı birlikte değerlendirelim.
            </p>
            <Button href="/randevu-al" block size="sm" className="mt-5">
              {tActions("book")}
            </Button>
            <div className="mt-5 flex flex-col gap-2.5 border-t border-line pt-5 text-sm">
              <a href={phoneHref(settings.phone)} className="hover:text-gold">
                {settings.phone}
              </a>
              <a href={emailHref(settings.email)} className="hover:text-gold">
                {settings.email}
              </a>
              <span className="font-mono text-[11.5px] tracking-[1.5px] text-gold">
                {settings.hoursLabel}
              </span>
            </div>
          </Card>

          {relatedTeam.length > 0 && (
            <Card className="p-7">
              <h3 className="mb-3.5 font-mono text-[11.5px] font-medium tracking-[2.5px] text-muted">
                İLGİLİ AVUKATLAR
              </h3>
              <div className="flex flex-col gap-3.5">
                {relatedTeam.map((member) => (
                  <Link
                    key={member.slug}
                    href={{ pathname: "/ekip/[slug]", params: { slug: member.slug } }}
                    className="flex items-center gap-3 text-ink hover:text-gold"
                  >
                    <span className="placeholder-pattern h-10 w-10 flex-none rounded-full border border-line" />
                    <span className="flex flex-col gap-px">
                      <span className="text-[14.5px] font-semibold">{member.name}</span>
                      <span className="text-xs text-muted">{member.roleShort}</span>
                    </span>
                  </Link>
                ))}
              </div>
            </Card>
          )}

          {relatedArticleItems.length > 0 && (
            <Card className="p-7">
              <h3 className="mb-3.5 font-mono text-[11.5px] font-medium tracking-[2.5px] text-muted">
                İLGİLİ MAKALELER
              </h3>
              <div className="flex flex-col gap-3.5">
                {relatedArticleItems.map((article) => (
                  <a
                    key={article.slug}
                    href={article.href}
                    className="flex flex-col gap-0.5 text-ink hover:text-gold"
                  >
                    <span className="text-sm font-semibold leading-snug">
                      {article.title}
                    </span>
                    <span className="font-mono text-[11px] text-muted">
                      {article.date}
                    </span>
                  </a>
                ))}
              </div>
            </Card>
          )}
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
