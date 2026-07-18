"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { AppIcon } from "@/components/ui/AppIcon";
import { cn } from "@/lib/cn";
import { BrandMark } from "./BrandMark";
import { LangSwitcher } from "./LangSwitcher";
import { MegaMenu, type MegaMenuArea } from "./MegaMenu";

type ExistingHref =
  | "/"
  | "/hakkimizda"
  | "/ekip"
  | "/makaleler"
  | "/basinda-biz"
  | "/sss"
  | "/iletisim";

function navClass(active: boolean) {
  return cn(
    "border-b-2 py-1.5 text-sm font-medium transition-colors",
    active
      ? "border-gold text-ink"
      : "border-transparent text-ink hover:text-gold",
  );
}

export function Header({ practiceAreas }: { practiceAreas: MegaMenuArea[] }) {
  const t = useTranslations("nav");
  const tActions = useTranslations("actions");
  const tAria = useTranslations("aria");
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const closeMobile = () => setMobileOpen(false);

  const isActive = {
    home: pathname === "/",
    about: pathname === "/hakkimizda",
    team: pathname === "/ekip" || pathname.startsWith("/ekip/"),
    areas:
      pathname === "/calisma-alanlari" ||
      pathname.startsWith("/calisma-alanlari/"),
    articles: pathname === "/makaleler" || pathname.startsWith("/makaleler/"),
    press: pathname === "/basinda-biz" || pathname.startsWith("/basinda-biz/"),
    faq: pathname === "/sss",
    contact: pathname === "/iletisim",
  };

  const existing: { href: ExistingHref; label: string; active: boolean }[] = [
    { href: "/", label: t("home"), active: isActive.home },
    { href: "/hakkimizda", label: t("about"), active: isActive.about },
  ];
  const teamItem = { href: "/ekip" as const, label: t("team"), active: isActive.team };
  const trailingNav: { href: ExistingHref; label: string; active: boolean }[] = [
    { href: "/makaleler", label: t("articles"), active: isActive.articles },
    { href: "/basinda-biz", label: t("press"), active: isActive.press },
    { href: "/sss", label: t("faq"), active: isActive.faq },
    { href: "/iletisim", label: t("contact"), active: isActive.contact },
  ];

  return (
    <header
      className={cn(
        "sticky top-0 z-[90] border-b border-line backdrop-blur-[10px] transition-shadow duration-300",
        scrolled && "shadow-header",
      )}
      style={{ background: "rgba(246,243,236,0.94)" }}
    >
      <Container className="flex items-center gap-9 py-3.5">
        <Link href="/" className="flex-none" aria-label="YAKA Hukuk & Danışmanlık">
          <BrandMark />
        </Link>

        {/* Masaüstü navigasyon */}
        <nav className="ml-auto hidden items-center gap-6 lg:flex">
          {existing.slice(0, 2).map((item) => (
            <Link key={item.href} href={item.href} className={navClass(item.active)}>
              {item.label}
            </Link>
          ))}
          <MegaMenu
            label={t("practiceAreas")}
            areas={practiceAreas}
            viewAllLabel={t("viewAllAreas")}
            active={isActive.areas}
          />
          <Link href={teamItem.href} className={navClass(teamItem.active)}>
            {teamItem.label}
          </Link>
          {trailingNav.map((item) => (
            <Link key={item.href} href={item.href} className={navClass(item.active)}>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Masaüstü sağ küme */}
        <div className="hidden flex-none items-center gap-5 lg:flex">
          <LangSwitcher ariaLabel={tAria("language")} />
          <Button href="/randevu-al" size="sm">{tActions("book")}</Button>
        </div>

        {/* Mobil hamburger */}
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          aria-expanded={mobileOpen}
          aria-label="Menü"
          className="ml-auto flex h-10 w-10 cursor-pointer items-center justify-center rounded border border-line bg-surface text-xl text-ink lg:hidden"
        >
          <AppIcon name={mobileOpen ? "close" : "menu"} size={20} />
        </button>
      </Container>

      {/* Mobil panel */}
      {mobileOpen && (
        <div className="border-t border-line bg-cream lg:hidden">
          <Container className="flex flex-col gap-1 py-4">
            <Link href="/" className={navClass(isActive.home)} onClick={closeMobile}>
              {t("home")}
            </Link>
            <Link
              href="/hakkimizda"
              className={navClass(isActive.about)}
              onClick={closeMobile}
            >
              {t("about")}
            </Link>
            <Link
              href="/calisma-alanlari"
              className={navClass(isActive.areas)}
              onClick={closeMobile}
            >
              {t("practiceAreas")}
            </Link>
            <Link href="/ekip" className={navClass(isActive.team)} onClick={closeMobile}>
              {t("team")}
            </Link>
            {trailingNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={navClass(item.active)}
                onClick={closeMobile}
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-3 flex items-center justify-between gap-4 border-t border-line pt-4">
              <LangSwitcher ariaLabel={tAria("language")} />
              <Button href="/randevu-al" size="sm">{tActions("book")}</Button>
            </div>
          </Container>
        </div>
      )}
    </header>
  );
}
