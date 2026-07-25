import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { DarkCTA } from "@/components/site/DarkCTA";
import { TestimonialsBrowser } from "@/components/site/TestimonialsBrowser";
import { localizedTestimonials } from "@/content/testimonials";
import type { Locale } from "@/i18n/routing";
import { alternates } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return { title: "Müvekkil Yorumları", alternates: alternates("/yorumlar", locale as Locale) };
}

export default async function TestimonialsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tActions = await getTranslations("actions");
  const items = await localizedTestimonials(locale as Locale);

  return (
    <>
      <Container className="pt-20">
        <TestimonialsBrowser items={items} />
      </Container>

      <DarkCTA
        title="Bir sonraki iyi deneyim sizinki olsun."
        text="Ön görüşme için randevu oluşturun; ekibimiz aynı gün içinde dönüş yapar."
        buttonLabel={tActions("book")}
      />
    </>
  );
}
