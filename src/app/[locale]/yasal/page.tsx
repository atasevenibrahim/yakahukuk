import type { Metadata } from "next";
import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { LegalBrowser } from "@/components/site/LegalBrowser";
import { localizedLegal } from "@/content/legal";
import type { Locale } from "@/i18n/routing";
import { alternates } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  await params;
  return { title: "Yasal Metinler", alternates: alternates("/yasal") };
}

export default async function LegalPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const documents = localizedLegal(locale as Locale);

  return (
    <Container className="pb-20 pt-20">
      <div className="max-w-[720px]">
        <Eyebrow label="YASAL METİNLER" draw className="animate-rise" />
        <h1 className="mt-[22px] font-serif text-[36px] font-medium leading-[1.08] text-balance sm:text-[44px] md:text-[56px]">
          Şeffaflık, bizde yazılı kuraldır.
        </h1>
      </div>

      <div className="mt-14">
        <Suspense fallback={null}>
          <LegalBrowser documents={documents} />
        </Suspense>
      </div>
    </Container>
  );
}
