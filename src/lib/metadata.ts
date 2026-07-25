import type { Metadata } from "next";
import { getPathname } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";

export const BASE_URL = "https://yakahukuk.com";

type Href = Parameters<typeof getPathname>[0]["href"];

/** Bir sayfanın belirli bir dildeki tam (absolute) adresi. */
export function absoluteUrl(href: Href, locale: Locale): string {
  return BASE_URL + getPathname({ href, locale });
}

/**
 * hreflang alternatifleri + canonical.
 *
 * `canonical` **render edilen dilin kendi adresidir**. Daha önce her zaman
 * `routing.defaultLocale` döndürülüyordu; bu, her /en/... sayfasının kendisini TR sayfasının
 * kopyası ilan etmesi anlamına geliyordu ve İngilizce sayfaların hiç indekslenmemesine yol
 * açıyordu. Her dil kendi canonical'ına sahip olmalı, diller arası ilişki `languages`
 * (hreflang) ile kurulur.
 */
export function alternates(href: Href, locale: Locale): Metadata["alternates"] {
  const languages: Record<string, string> = {};
  for (const l of routing.locales) {
    languages[l] = absoluteUrl(href, l);
  }
  return {
    canonical: absoluteUrl(href, locale),
    languages: { ...languages, "x-default": languages[routing.defaultLocale] },
  };
}
