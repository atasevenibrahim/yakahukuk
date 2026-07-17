import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { localizedPracticeAreas } from "@/content/practice-areas";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { SiteOverlays } from "@/components/site/SiteOverlays";
import { BASE_URL } from "@/lib/metadata";
import { cormorant, manrope, plexMono } from "../fonts";
import "../globals.css";

const RTL_LOCALES = new Set<string>(["ar", "fa", "he", "ur"]);

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const description =
    locale === "en"
      ? "Meticulous, accessible legal counsel across twelve practice areas in Ankara Beştepe. An upright stance, honest law."
      : "Ankara Beştepe'de on iki çalışma alanında titiz ve ulaşılabilir hukuki danışmanlık. Dik duruş, dürüst hukuk.";

  return {
    metadataBase: new URL(BASE_URL),
    title: {
      default: "YAKA Hukuk & Danışmanlık",
      template: "%s · YAKA Hukuk & Danışmanlık",
    },
    description,
    icons: { icon: "/yaka-logo.png" },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  const messages = await getMessages();
  const dir = RTL_LOCALES.has(locale) ? "rtl" : "ltr";
  const areas = localizedPracticeAreas(locale).map((a) => ({
    title: a.title,
    href: a.href,
    slug: a.slug,
  }));

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${manrope.variable} ${cormorant.variable} ${plexMono.variable}`}
    >
      <body>
        {/* JS varlığını işaretle → scroll-reveal yalnızca JS'te gizler (no-JS güvenli). */}
        <script
          dangerouslySetInnerHTML={{
            __html: "document.documentElement.classList.add('js')",
          }}
        />
        <NextIntlClientProvider locale={locale} messages={messages}>
          <div className="flex min-h-screen flex-col">
            <Header practiceAreas={areas} />
            <main className="flex-1">{children}</main>
            <Footer practiceAreas={areas} />
          </div>
          <SiteOverlays />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
