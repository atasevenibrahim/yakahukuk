import type { Locale } from "@/i18n/routing";

export type { Locale };

/**
 * Çevrilebilir içerik. TR zorunlu (varsayılan/fallback), diğer diller opsiyonel.
 * Bir dil eksikse `pick` TR'ye düşer. Bu tipler ileride Prisma `*Translation`
 * modellerine geçerken sözleşme görevi görür.
 */
export type Localized<T> = { tr: T } & Partial<Record<Locale, T>>;

export function pick<T>(value: Localized<T>, locale: Locale): T {
  return (value[locale] ?? value.tr) as T;
}
