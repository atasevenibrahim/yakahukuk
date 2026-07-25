import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Card } from "@/components/ui/Card";
import { AppIcon } from "@/components/ui/AppIcon";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import { Reveal } from "@/components/site/Reveal";
import { DarkCTA } from "@/components/site/DarkCTA";
import { localizedTeam } from "@/content/team";
import type { Locale } from "@/i18n/routing";
import { alternates } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("nav");
  return { title: t("team"), alternates: alternates("/ekip", locale as Locale) };
}

export default async function TeamPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("actions");
  const team = await localizedTeam(locale as Locale);

  return (
    <>
      {/* Hero */}
      <Container className="pt-20">
        <div className="max-w-[720px]">
          <Eyebrow label="EKİBİMİZ" draw className="animate-rise" />
          <h1 className="mt-[22px] font-serif text-[40px] font-medium leading-[1.08] text-balance sm:text-[52px] md:text-[60px]">
            Dosyanızın arkasındaki isimler.
          </h1>
          <p className="mt-[22px] text-lg leading-relaxed text-pretty text-muted">
            Her biri kendi alanında uzman avukat ve danışmanlardan oluşan
            ekibimiz, dosyanızı ortak bir titizlik anlayışıyla yürütür.
          </p>
        </div>
      </Container>

      {/* Ekip listesi */}
      <Reveal className="pt-16">
        <Container>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {team.map((member) => (
              <Link
                key={member.slug}
                href={{ pathname: "/ekip/[slug]", params: { slug: member.slug } }}
                className="block text-ink"
              >
                <Card hover accent className="h-full overflow-hidden">
                  <PlaceholderImage
                    label="portre — fotoğraf gelecek"
                    className="h-[280px] rounded-none border-0 border-b border-line"
                  />
                  <div className="p-6">
                    <h3 className="font-serif text-[25px] font-semibold">
                      {member.name}
                    </h3>
                    <p className="mb-3.5 mt-1 text-[13.5px] text-muted">
                      {member.roleShort}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {member.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-line px-2.5 py-1 font-mono text-[10.5px] tracking-[1px] text-muted"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <p className="mt-[18px] inline-flex items-center gap-1 text-sm font-semibold text-gold">
                      {t("viewProfile")}
                      <AppIcon name="arrowRight" size={14} />
                    </p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </Container>
      </Reveal>

      <DarkCTA
        title="Ekibimizle tanışın."
        text="Ön görüşme için randevu oluşturun; ekibimiz aynı gün içinde dönüş yapar."
        buttonLabel={t("book")}
      />
    </>
  );
}
