import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Card } from "@/components/ui/Card";
import { AppIcon } from "@/components/ui/AppIcon";
import { DarkCTA } from "@/components/site/DarkCTA";
import { ContactForm } from "@/components/site/ContactForm";
import { localizedPracticeAreas } from "@/content/practice-areas";
import { site } from "@/content/site";
import type { Locale } from "@/i18n/routing";
import { alternates } from "@/lib/metadata";

const MAP_QUERY = encodeURIComponent(
  `${site.address.line1}, ${site.address.line2}`,
);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  await params;
  const t = await getTranslations("nav");
  return { title: t("contact"), alternates: alternates("/iletisim") };
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("contactPage");
  const tActions = await getTranslations("actions");
  const subjectOptions = localizedPracticeAreas(locale as Locale).map((a) => a.title);

  return (
    <>
      <Container className="pt-20">
        <div className="max-w-[720px]">
          <Eyebrow label="İLETİŞİM" draw className="animate-rise" />
          <h1 className="mt-[22px] font-serif text-[40px] font-medium leading-[1.08] text-balance sm:text-[52px] md:text-[60px]">
            Size nasıl yardımcı olabiliriz?
          </h1>
          <p className="mt-[22px] text-lg leading-relaxed text-pretty text-muted">
            Formu doldurun ya da doğrudan arayın — mesai saati gözetmeksizin,
            aynı gün dönüş yaparız.
          </p>
        </div>
      </Container>

      <Container className="grid grid-cols-1 items-start gap-10 pt-16 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
        <Card className="p-8 sm:p-10">
          <ContactForm subjectOptions={subjectOptions} />
        </Card>

        <div className="flex flex-col gap-5">
          <Card accent className="p-8">
            <h3 className="mb-5 font-mono text-[11.5px] font-medium tracking-[2.5px] text-muted">
              {t("officeTitle")}
            </h3>
            <div className="flex flex-col gap-4 text-[15px] leading-relaxed">
              <div>
                <span className="mb-0.5 block text-xs font-semibold text-muted">
                  {t("addressLabel")}
                </span>
                <span>
                  {site.address.line1}
                  <br />
                  {site.address.line2}
                </span>
              </div>
              <div>
                <span className="mb-0.5 block text-xs font-semibold text-muted">
                  {t("phoneLabel")}
                </span>
                <a href={site.phoneHref} className="font-semibold text-ink hover:text-gold">
                  {site.phone}
                </a>
              </div>
              <div>
                <span className="mb-0.5 block text-xs font-semibold text-muted">
                  {t("emailLabel")}
                </span>
                <a href={site.emailHref} className="font-semibold text-ink hover:text-gold">
                  {site.email}
                </a>
              </div>
              <div>
                <span className="mb-0.5 block text-xs font-semibold text-muted">
                  {t("hoursLabel")}
                </span>
                <span className="font-mono text-[13px] tracking-[1.5px] text-gold">
                  7/24 ULAŞILABİLİR
                </span>
              </div>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <iframe
              title={t("mapFallback")}
              src={`https://www.google.com/maps?q=${MAP_QUERY}&output=embed`}
              className="h-[300px] w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </Card>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <a
              href={site.whatsappHref}
              className="flex items-center justify-center gap-2.5 rounded bg-ink px-4 py-3.5 text-[14.5px] font-semibold text-cream transition-colors hover:bg-gold hover:text-white"
            >
              <AppIcon name="message" size={18} />
              {t("whatsappButton")}
            </a>
            <a
              href={site.phoneHref}
              className="flex items-center justify-center gap-2.5 rounded border border-gold px-4 py-3.5 text-[14.5px] font-semibold text-ink transition-colors hover:bg-gold hover:text-white"
            >
              <AppIcon name="phone" size={18} />
              {t("callButton")}
            </a>
          </div>
        </div>
      </Container>

      <DarkCTA
        title="Görüşmeyi planlayalım."
        text="Takvimden size uygun gün ve saati seçin; gerisini biz halledelim."
        buttonLabel={tActions("book")}
      />
    </>
  );
}
