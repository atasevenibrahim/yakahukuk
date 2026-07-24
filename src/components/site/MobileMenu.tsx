"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { AppIcon } from "@/components/ui/AppIcon";
import { cn } from "@/lib/cn";
import { LangSwitcher } from "./LangSwitcher";
import type { MegaMenuArea } from "./MegaMenu";

/** Sağdan kayan mobil navigasyon çekmecesi — Header'ın hamburger düğmesiyle açılır. */
export function MobileMenu({
  open,
  onClose,
  practiceAreas,
  phone,
  phoneHref,
}: {
  open: boolean;
  onClose: () => void;
  practiceAreas: MegaMenuArea[];
  phone: string;
  phoneHref: string;
}) {
  const t = useTranslations("nav");
  const tActions = useTranslations("actions");
  const tAria = useTranslations("aria");
  const pathname = usePathname();
  const [areasOpen, setAreasOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  const isActive = {
    home: pathname === "/",
    about: pathname === "/hakkimizda",
    team: pathname === "/ekip" || pathname.startsWith("/ekip/"),
    areas: pathname === "/calisma-alanlari" || pathname.startsWith("/calisma-alanlari/"),
    articles: pathname === "/makaleler" || pathname.startsWith("/makaleler/"),
    press: pathname === "/basinda-biz" || pathname.startsWith("/basinda-biz/"),
    faq: pathname === "/sss",
    contact: pathname === "/iletisim",
  };

  const trailingNav = [
    { href: "/ekip" as const, label: t("team"), active: isActive.team },
    { href: "/makaleler" as const, label: t("articles"), active: isActive.articles },
    { href: "/basinda-biz" as const, label: t("press"), active: isActive.press },
    { href: "/sss" as const, label: t("faq"), active: isActive.faq },
    { href: "/iletisim" as const, label: t("contact"), active: isActive.contact },
  ];

  function rowClass(active: boolean) {
    return cn(
      "flex min-h-[44px] items-center gap-3 rounded px-3 py-2.5 text-[15px] font-semibold transition-colors border-l-2",
      active
        ? "border-gold bg-cream/[0.08] text-cream"
        : "border-transparent text-on-dark-muted hover:bg-cream/[0.06] hover:text-cream",
    );
  }

  return (
    <>
      {open && (
        <div
          onClick={onClose}
          aria-hidden
          className="fixed inset-0 z-[100] bg-ink/45 lg:hidden"
        />
      )}
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-[101] flex w-[310px] max-w-[85vw] flex-col bg-ink-deep transition-transform duration-300 lg:hidden",
          open ? "translate-x-0" : "translate-x-full",
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Menü"
      >
        <div className="flex items-center justify-between border-b border-cream/10 px-5 py-4">
          <span className="font-mono text-[10px] tracking-[2.5px] text-on-dark-muted">MENÜ</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Menüyü kapat"
            className="flex h-11 w-11 items-center justify-center rounded border border-cream/15 text-cream transition-colors hover:border-gold hover:text-gold"
          >
            <AppIcon name="close" size={18} />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-2.5">
          <Link href="/" className={rowClass(isActive.home)} onClick={onClose}>
            {t("home")}
          </Link>
          <Link href="/hakkimizda" className={rowClass(isActive.about)} onClick={onClose}>
            {t("about")}
          </Link>

          <button
            type="button"
            onClick={() => setAreasOpen((v) => !v)}
            className="flex min-h-[44px] items-center gap-3 rounded border-l-2 border-transparent px-3 py-2.5 text-left text-[15px] font-semibold text-on-dark-muted transition-colors hover:bg-cream/[0.06]"
          >
            {t("practiceAreas")}
            <AppIcon
              name="chevronDown"
              size={14}
              className={cn("ml-auto text-gold transition-transform", areasOpen && "rotate-180")}
            />
          </button>
          {areasOpen && (
            <div className="flex flex-col gap-px py-0.5 pl-6">
              {practiceAreas.map((area) => (
                <a
                  key={area.slug}
                  href={area.href}
                  onClick={onClose}
                  className="flex min-h-[44px] items-center rounded px-2.5 text-[13.5px] text-on-dark-muted transition-colors hover:bg-cream/[0.04] hover:text-gold"
                >
                  {area.title}
                </a>
              ))}
              <Link
                href="/calisma-alanlari"
                onClick={onClose}
                className="flex min-h-[44px] items-center px-2.5 font-mono text-[10.5px] tracking-[1px] text-gold"
              >
                {t("viewAllAreas")} →
              </Link>
            </div>
          )}

          {trailingNav.map((item) => (
            <Link key={item.href} href={item.href} className={rowClass(item.active)} onClick={onClose}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex flex-col gap-3 border-t border-cream/10 px-5 py-4">
          <div className="flex items-center justify-between">
            <LangSwitcher ariaLabel={tAria("language")} onDark />
            <a href={phoneHref} className="font-mono text-[11px] tracking-[1px] text-gold">
              {phone}
            </a>
          </div>
          <Button href="/randevu-al" block onClick={onClose}>
            {tActions("book")}
          </Button>
        </div>
      </div>
    </>
  );
}
