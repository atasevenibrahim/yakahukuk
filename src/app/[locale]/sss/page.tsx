import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { DarkCTA } from "@/components/site/DarkCTA";
import { FaqBrowser } from "@/components/site/FaqBrowser";
import { JsonLd } from "@/components/site/JsonLd";
import { faqSchema } from "@/lib/seo/jsonld";
import { localizedFaq } from "@/content/faq";
import type { Locale } from "@/i18n/routing";
import { alternates } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("nav");
  return { title: t("faq"), alternates: alternates("/sss", locale as Locale) };
}

export default async function FaqPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("actions");
  const categories = await localizedFaq(locale as Locale);

  return (
    <>
      <JsonLd
        data={faqSchema(
          categories.flatMap((cat) =>
            cat.items.map((item) => ({ question: item.question, answer: item.answer })),
          ),
        )}
      />
      <Container className="pt-20">
        <div className="max-w-[640px]">
          <Eyebrow label="SIK SORULAN SORULAR" draw className="animate-rise" />
          <h1 className="mt-[22px] font-serif text-[40px] font-medium leading-[1.08] text-balance sm:text-[52px] md:text-[60px]">
            Merak ettikleriniz, net yanıtlar.
          </h1>
        </div>
      </Container>

      <Container className="pt-14">
        <FaqBrowser categories={categories} />
      </Container>

      <DarkCTA
        title="Yanıtını bulamadınız mı?"
        text="Sorunuzu doğrudan bize iletin; aynı gün içinde dönüş yaparız."
        buttonLabel={t("book")}
      />
    </>
  );
}
