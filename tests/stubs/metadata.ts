/**
 * `@/lib/metadata` için test sahtesi — bkz. tests/alias-hooks.mjs.
 * Gerçek modül next-intl üzerinden `next/navigation`a bağlı ve düz Node altında yüklenmiyor.
 */
export const BASE_URL = "https://yakahukuk.com";

export function absoluteUrl(): string {
  throw new Error("test sahtesi: absoluteUrl bu testte kullanılmamalı");
}
