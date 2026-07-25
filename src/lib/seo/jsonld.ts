import { BASE_URL, absoluteUrl } from "@/lib/metadata";
import type { Locale } from "@/i18n/routing";
import type { SiteSettingsData } from "@/lib/site-settings";
import { splitAddress } from "@/lib/site-settings";

/**
 * schema.org yapılandırılmış veri üreticileri.
 *
 * Hepsi düz nesne döner; sayfalarda `<JsonLd data={…} />` ile basılır. Değerler DB'den
 * (`SiteSettings`, içerik tabloları) geldiği için admin panelinden yapılan değişiklikler
 * yapılandırılmış veriye de yansır.
 */

const ORG_ID = `${BASE_URL}/#organization`;

export function organizationSchema(settings: SiteSettingsData, locale: Locale) {
  const [street, cityLine] = splitAddress(settings.address);
  return {
    "@context": "https://schema.org",
    "@type": "LegalService",
    "@id": ORG_ID,
    name: settings.seoTitle,
    url: absoluteUrl("/", locale),
    telephone: settings.phone,
    email: settings.email,
    description: settings.seoDescription,
    priceRange: "$$",
    areaServed: { "@type": "Country", name: "Türkiye" },
    address: {
      "@type": "PostalAddress",
      streetAddress: street,
      addressLocality: cityLine,
      addressCountry: "TR",
    },
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      description: settings.hoursLabel,
    },
  };
}

export function articleSchema(input: {
  title: string;
  description: string;
  slug: string;
  isoDate: string;
  locale: Locale;
  imageUrl: string;
  authorName: string;
  keywords: string[];
}) {
  const url = absoluteUrl(
    { pathname: "/makaleler/[slug]", params: { slug: input.slug } },
    input.locale,
  );
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.title,
    description: input.description,
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    datePublished: input.isoDate,
    dateModified: input.isoDate,
    inLanguage: input.locale,
    image: input.imageUrl,
    keywords: input.keywords.join(", "),
    author: { "@type": "Person", name: input.authorName },
    publisher: { "@id": ORG_ID },
  };
}

export function personSchema(input: {
  name: string;
  role: string;
  slug: string;
  locale: Locale;
  languages: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: input.name,
    jobTitle: input.role,
    url: absoluteUrl({ pathname: "/ekip/[slug]", params: { slug: input.slug } }, input.locale),
    knowsLanguage: input.languages,
    worksFor: { "@id": ORG_ID },
  };
}

export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function faqSchema(entries: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: entries.map((e) => ({
      "@type": "Question",
      name: e.question,
      acceptedAnswer: { "@type": "Answer", text: e.answer },
    })),
  };
}
