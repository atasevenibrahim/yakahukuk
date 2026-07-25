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
}: {
  category: string;
  title: string;
  readMinutes?: number;
  /** hero: detay sayfası üstü · card: liste/ilgili makale kartı */
  size?: "hero" | "card";
}) {
  const hero = size === "hero";

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
