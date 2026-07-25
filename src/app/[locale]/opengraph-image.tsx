import { getSiteSettings } from "@/lib/site-settings";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/seo/og-image";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "YAKA Hukuk & Danışmanlık";

/** Site geneli varsayılan paylaşım görseli — kendi opengraph-image'ı olmayan tüm sayfalar için. */
export default async function Image() {
  const settings = await getSiteSettings();
  return renderOgImage({
    eyebrow: "Ankara Beştepe",
    title: "Dik duruş, dürüst hukuk.",
    footerLeft: "yakahukuk.com",
    footerRight: settings.phone,
  });
}
