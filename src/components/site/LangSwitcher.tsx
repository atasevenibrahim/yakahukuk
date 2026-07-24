"use client";

import { Fragment } from "react";
import { useParams } from "next/navigation";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/cn";

/** TR / EN dil seçici — aynı sayfada kalarak dili değiştirir (localized pathnames dahil). */
export function LangSwitcher({
  ariaLabel,
  onDark,
}: {
  ariaLabel: string;
  onDark?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const active = useLocale();

  function switchTo(next: (typeof routing.locales)[number]) {
    if (next === active) return;
    // pathname (template) + params → dinamik segmentli localized rota korunur.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    router.replace({ pathname, params } as any, { locale: next });
  }

  return (
    <div
      className="flex items-center gap-2 font-mono text-xs"
      role="group"
      aria-label={ariaLabel}
    >
      {routing.locales.map((locale, index) => (
        <Fragment key={locale}>
          {index > 0 && <span className={onDark ? "text-on-dark-muted" : "text-line"}>/</span>}
          <button
            type="button"
            onClick={() => switchTo(locale)}
            aria-current={locale === active ? "true" : undefined}
            className={cn(
              "cursor-pointer bg-transparent pb-px transition-colors",
              locale === active
                ? "border-b border-gold font-medium text-gold"
                : onDark
                  ? "text-on-dark-muted hover:text-cream"
                  : "text-muted hover:text-gold",
            )}
          >
            {locale.toUpperCase()}
          </button>
        </Fragment>
      ))}
    </div>
  );
}
