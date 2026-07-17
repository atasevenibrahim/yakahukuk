import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";

type Messages = Record<string, unknown>;

/** EN'de eksik anahtarlar TR'ye düşsün diye derin birleştirme. */
function deepMerge(base: Messages, overlay: Messages): Messages {
  const out: Messages = { ...base };
  for (const key of Object.keys(overlay)) {
    const b = base[key];
    const o = overlay[key];
    if (
      b && o &&
      typeof b === "object" && typeof o === "object" &&
      !Array.isArray(b) && !Array.isArray(o)
    ) {
      out[key] = deepMerge(b as Messages, o as Messages);
    } else {
      out[key] = o;
    }
  }
  return out;
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  const base = (await import("../../messages/tr.json")).default as Messages;
  const messages =
    locale === routing.defaultLocale
      ? base
      : deepMerge(base, (await import(`../../messages/${locale}.json`)).default as Messages);

  return { locale, messages };
});
