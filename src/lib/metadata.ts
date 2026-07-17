import type { Metadata } from "next";
import { getPathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

export const BASE_URL = "https://yakahukuk.com";

type Href = Parameters<typeof getPathname>[0]["href"];

/** hreflang alternatifleri + canonical (varsayılan dil). */
export function alternates(href: Href): Metadata["alternates"] {
  const languages: Record<string, string> = {};
  for (const locale of routing.locales) {
    languages[locale] = BASE_URL + getPathname({ href, locale });
  }
  return {
    canonical: languages[routing.defaultLocale],
    languages,
  };
}
