import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import { DarkCTA } from "@/components/site/DarkCTA";
import { teamMemberBySlug, teamSlugs } from "@/content/team";
import { localizedArticles } from "@/content/articles";
import { getPracticeAreasRaw } from "@/content/practice-areas";
import { getSiteSettings, phoneHref, emailHref } from "@/lib/site-settings";
import type { Locale } from "@/i18n/routing";
import { alternates } from "@/lib/metadata";

export async function generateStaticParams() {
  const slugs = await teamSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const member = await teamMemberBySlug(slug, locale as Locale);
  if (!member) return {};
  return {
    title: member.name,
    alternates: alternates({ pathname: "/ekip/[slug]", params: { slug } }, locale as Locale),
  };
}

export default async function TeamMemberPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const member = await teamMemberBySlug(slug, locale as Locale);
  if (!member) notFound();

  const tActions = await getTranslations("actions");
  const tNav = await getTranslations("nav");
  const [settings, allArticles, practiceAreas] = await Promise.all([
    getSiteSettings(),
    localizedArticles(locale as Locale),
    getPracticeAreasRaw(),
  ]);

  const memberArticles = member.articleSlugs
    .map((articleSlug) => allArticles.find((a) => a.slug === articleSlug))
    .filter((a): a is (typeof allArticles)[number] => Boolean(a));

  return (
    <>
      {/* Breadcrumb */}
      <Container className="pt-10">
        <div className="flex items-center gap-2 text-[13px] text-muted">
          <Link href="/" className="hover:text-gold">
            {tNav("home")}
          </Link>
          <span className="text-line">/</span>
          <Link href="/ekip" className="hover:text-gold">
            {tNav("team")}
          </Link>
          <span className="text-line">/</span>
          <span className="font-medium text-ink">{member.name}</span>
        </div>
      </Container>

      {/* İçerik */}
      <Container className="grid grid-cols-1 items-start gap-12 pt-12 md:grid-cols-[400px_1fr] md:gap-[72px]">
        {/* Sol: portre + iletişim kartı (yapışkan) */}
        <div>
          <div className="flex flex-col gap-6 md:sticky md:top-24">
            <PlaceholderImage
              label="büyük portre — fotoğraf gelecek"
              className="h-[460px]"
            />
            <Card className="p-7">
              <h3 className="mb-4 font-mono text-[11.5px] font-medium tracking-[2.5px] text-muted">
                İLETİŞİM
              </h3>
              <div className="flex flex-col gap-3 text-sm">
                <a href={phoneHref(settings.phone)} className="hover:text-gold">
                  {settings.phone}
                </a>
                <a href={emailHref(settings.email)} className="hover:text-gold">
                  {settings.email}
                </a>
              </div>
              <div className="my-[18px] border-t border-line" />
              <h3 className="mb-3.5 font-mono text-[11.5px] font-medium tracking-[2.5px] text-muted">
                DİLLER
              </h3>
              <div className="flex flex-wrap gap-2">
                {member.languages.map((language) => (
                  <span
                    key={language}
                    className="rounded-full border border-line px-2.5 py-1 font-mono text-[10.5px] tracking-[1px] text-muted"
                  >
                    {language}
                  </span>
                ))}
              </div>
              <Button href="/randevu-al" block size="sm" className="mt-[22px]">
                {tActions("book")}
              </Button>
            </Card>
          </div>
        </div>

        {/* Sağ: bilgiler */}
        <div>
          <Eyebrow label={member.role} draw className="animate-rise" />
          <h1 className="mt-[18px] font-serif text-[40px] font-medium leading-[1.08] sm:text-[48px] md:text-[54px]">
            {member.name}
          </h1>
          <p className="mt-2.5 text-[15px] text-muted">
            {member.roleShort} · {member.bar}
          </p>

          {/* Biyografi */}
          <section className="mt-10">
            <h2 className="mb-3.5 font-serif text-[28px] font-medium">Biyografi</h2>
            {member.bio.map((paragraph, index) => (
              <p
                key={index}
                className={`text-base leading-[1.7] text-pretty text-muted ${index > 0 ? "mt-3.5" : ""}`}
              >
                {paragraph}
              </p>
            ))}
          </section>

          {/* Eğitim */}
          <section className="mt-10">
            <h2 className="mb-[18px] font-serif text-[28px] font-medium">Eğitim</h2>
            <div className="flex flex-col gap-3.5">
              {member.education.map((entry, index) => (
                <div key={index} className="flex items-baseline gap-4">
                  <span className="w-[88px] flex-none font-mono text-xs text-gold">
                    {entry.period}
                  </span>
                  <span className="text-[15px] leading-relaxed text-ink">
                    {entry.text}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Çalışma alanları */}
          <section className="mt-10">
            <h2 className="mb-[18px] font-serif text-[28px] font-medium">
              Çalışma alanları
            </h2>
            <div className="flex flex-wrap gap-2.5">
              {member.areas.map((area) => {
                const areaSlug = practiceAreas.find(
                  (a) => a.t.tr.title === area,
                )?.slug;
                return (
                  <Link
                    key={area}
                    href={
                      areaSlug
                        ? { pathname: "/calisma-alanlari/[slug]", params: { slug: areaSlug } }
                        : "/calisma-alanlari"
                    }
                    className="rounded-full border border-line bg-surface px-[18px] py-[9px] text-sm font-medium text-ink transition-colors hover:border-gold hover:text-gold"
                  >
                    {area}
                  </Link>
                );
              })}
            </div>
          </section>

          {/* Makaleleri */}
          {memberArticles.length > 0 && (
            <section className="mt-10">
              <h2 className="mb-[18px] font-serif text-[28px] font-medium">
                Makaleleri
              </h2>
              <div className="flex flex-col">
                {memberArticles.map((article, index) => (
                  <a
                    key={article.slug}
                    href={article.href}
                    className={`flex items-baseline justify-between gap-6 border-t border-line py-4 text-ink transition-colors hover:text-gold ${index === memberArticles.length - 1 ? "border-b" : ""}`}
                  >
                    <span className="text-[15.5px] font-semibold">
                      {article.title}
                    </span>
                    <span className="flex-none font-mono text-[11.5px] text-muted">
                      {article.date}
                    </span>
                  </a>
                ))}
              </div>
            </section>
          )}
        </div>
      </Container>

      <DarkCTA
        title="Dosyanızı birlikte değerlendirelim."
        text="Ön görüşme için randevu oluşturun; ekibimiz aynı gün içinde dönüş yapar."
        buttonLabel={tActions("book")}
      />
    </>
  );
}
