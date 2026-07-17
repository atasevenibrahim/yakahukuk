"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import logo from "../../../public/yaka-logo.png";

/** Logo + kelime markası. `onDark` footer gibi koyu zeminlerde kullanılır. */
export function BrandMark({
  onDark,
  size = 42,
}: {
  onDark?: boolean;
  size?: number;
}) {
  const t = useTranslations("brand");
  return (
    <span className="flex items-center gap-3">
      <Image
        src={logo}
        alt="YAKA logo"
        width={size}
        height={size}
        className={cn("object-contain", onDark && "brightness-0 invert-[0.95]")}
        priority
      />
      <span className="flex flex-col gap-px">
        <span
          className={cn(
            "font-serif text-[21px] font-semibold leading-none tracking-[2px]",
            onDark ? "text-cream" : "text-ink",
          )}
        >
          {t("name")}
        </span>
        <span
          className={cn(
            "font-mono text-[8.5px] tracking-[2.6px]",
            onDark ? "text-on-dark-muted" : "text-muted",
          )}
        >
          {t("sub")}
        </span>
      </span>
    </span>
  );
}
