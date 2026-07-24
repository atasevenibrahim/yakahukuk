import { cache } from "react";
import { prisma } from "./prisma";
import { site as staticSiteDefaults } from "@/content/site";

export type SiteSettingsData = {
  phone: string;
  email: string;
  address: string;
  hoursLabel: string;
  notificationEmails: string[];
  notifySound: boolean;
  seoTitle: string;
  seoDescription: string;
};

const FALLBACK: SiteSettingsData = {
  phone: staticSiteDefaults.phone,
  email: staticSiteDefaults.email,
  address: `${staticSiteDefaults.address.line1}\n${staticSiteDefaults.address.line2}`,
  hoursLabel: "7/24 ULAŞILABİLİR",
  notificationEmails: [staticSiteDefaults.email],
  notifySound: true,
  seoTitle: "YAKA Hukuk & Danışmanlık",
  seoDescription:
    "Ankara Beştepe'de on iki çalışma alanında titiz ve ulaşılabilir hukuki danışmanlık. Dik duruş, dürüst hukuk.",
};

/**
 * Build anında (statik sayfa üretimi) DB'ye geçici olarak ulaşılamazsa (ör. ortam değişkeni
 * henüz yayılmamışsa) build'i çökertmek yerine bilinen-iyi statik değerlere düşer — randevu-al
 * sayfasında yaşanan "build DB'ye bağımlı kalıyor" hatasının aynısını burada tekrarlamamak için.
 * `cache()` ile aynı istek içindeki tekrar çağrılar tek sorguya iner.
 */
export const getSiteSettings = cache(async (): Promise<SiteSettingsData> => {
  try {
    const row = await prisma.siteSettings.findFirst();
    if (!row) return FALLBACK;
    return row;
  } catch {
    return FALLBACK;
  }
});

export function phoneHref(phone: string): string {
  return `tel:${phone.replace(/\s+/g, "").replace(/^0/, "+90")}`;
}

export function emailHref(email: string): string {
  return `mailto:${email}`;
}

/** Adres textarea'sındaki tek bloktan Footer/İletişim'in beklediği iki satırı çıkarır. */
export function splitAddress(address: string): [string, string] {
  const [line1 = "", line2 = ""] = address.split("\n");
  return [line1, line2];
}
