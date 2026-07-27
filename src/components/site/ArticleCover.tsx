import Image from "next/image";
import logo from "../../../public/yaka-logo.png";

/**
 * Makale kapağı — OG görseliyle aynı tasarım dilinde, ama görsel isteği yerine doğrudan CSS.
 *
 * Böylece ek bir ağ isteği, en-boy oranı uyuşmazlığı ve `remotePatterns` ihtiyacı doğmaz;
 * tam responsive kalır. Sosyal paylaşımdaki PNG karşılığı `opengraph-image.tsx`'te üretilir.
 */
export function ArticleCover({
  category,
  title,
  readMinutes,
  size = "hero",
  imageUrl,
}: {
  category: string;
  title: string;
  readMinutes?: number;
  /** hero: detay sayfası üstü · card: liste/ilgili makale kartı */
  size?: "hero" | "card";
  /** Admin'den yüklenmiş kapak görseli. Verilirse tipografik kapağın yerine geçer. */
  imageUrl?: string;
}) {
  const hero = size === "hero";

  if (imageUrl) {
    return (
      <div
        className={`relative overflow-hidden bg-cream ${
          hero ? "h-[240px] rounded-md border border-line sm:h-[300px]" : "h-[170px] border-b border-line"
        }`}
      >
        {/* `sizes` olmadan Next tam genişlik varsayıp mobilde gereksiz büyük dosya indiriyor;
            kart 3'lü ızgarada, hero ise Container genişliğinde duruyor. */}
        <Image
          src={imageUrl}
          alt={title}
          fill
          sizes={
            hero
              ? "(max-width: 768px) 100vw, 1200px"
              : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          }
          className="object-cover"
          priority={hero}
        />
        {/* Metnin görsel üzerinde her koşulda okunması için koyulaştırma. */}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-[rgba(28,34,48,0.85)] via-[rgba(28,34,48,0.35)] to-[rgba(28,34,48,0.15)]"
        />
        <div
          className={`relative flex h-full flex-col justify-end ${
            hero ? "px-8 py-7 sm:px-11 sm:py-9" : "px-6 py-5"
          }`}
        >
          <span
            className={`font-mono tracking-[2px] text-gold ${hero ? "text-[11.5px]" : "text-[9.5px]"}`}
          >
            {category}
          </span>
          <p
            className={`m-0 mt-2 font-serif font-medium leading-[1.15] text-balance text-white ${
              hero ? "text-[26px] sm:text-[34px]" : "text-[17px]"
            }`}
          >
            {title}
          </p>
          {readMinutes !== undefined && (
            <span
              className={`mt-2 font-mono tracking-[1.5px] text-white/75 ${
                hero ? "text-[11px]" : "text-[9.5px]"
              }`}
            >
              {readMinutes} DK OKUMA
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col justify-between overflow-hidden bg-cream ${
        hero
          ? "h-[240px] rounded-md border border-line px-8 py-7 sm:h-[300px] sm:px-11 sm:py-9"
          : "h-[170px] border-b border-line px-6 py-5"
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <Image
          src={logo}
          alt=""
          width={hero ? 32 : 24}
          height={hero ? 32 : 24}
          className="flex-none object-contain"
        />
        <span
          className={`font-mono tracking-[2px] text-gold ${hero ? "text-[11.5px]" : "text-[9.5px]"}`}
        >
          {category}
        </span>
      </div>

      <p
        className={`m-0 font-serif font-medium leading-[1.15] text-balance text-ink ${
          hero ? "text-[26px] sm:text-[34px]" : "text-[17px]"
        }`}
      >
        {title}
      </p>

      <div className="flex items-center gap-3">
        <span className={`block flex-none bg-gold ${hero ? "h-[3px] w-12" : "h-0.5 w-8"}`} />
        {readMinutes !== undefined && (
          <span
            className={`font-mono tracking-[1.5px] text-muted ${hero ? "text-[11px]" : "text-[9.5px]"}`}
          >
            {readMinutes} DK OKUMA
          </span>
        )}
      </div>
    </div>
  );
}
