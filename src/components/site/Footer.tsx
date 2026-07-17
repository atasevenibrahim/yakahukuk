import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/Container";
import { site } from "@/content/site";
import { cn } from "@/lib/cn";
import { BrandMark } from "./BrandMark";

type FooterArea = { title: string; href: string; slug: string };

const colLink = "text-sm text-on-dark transition-colors hover:text-gold";
const colHeading =
  "mb-[18px] font-mono text-[11.5px] font-medium tracking-[2.5px] text-on-dark-muted";

export async function Footer({
  practiceAreas,
}: {
  practiceAreas: FooterArea[];
}) {
  const t = await getTranslations("footer");
  const tNav = await getTranslations("nav");
  const tActions = await getTranslations("actions");

  return (
    <footer className="border-t border-white/[0.08] bg-ink-deep">
      <Container className="grid grid-cols-1 gap-12 pt-[72px] sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        {/* Marka */}
        <div>
          <BrandMark onDark size={40} />
          <p className="mt-5 max-w-[300px] text-sm leading-relaxed text-on-dark-muted">
            {t("blurb")}
          </p>
          <p className="mt-4 font-serif text-[18px] italic text-cream">
            {t("tagline")}
          </p>
        </div>

        {/* Hızlı linkler */}
        <div>
          <h3 className={colHeading}>{t("quickLinks")}</h3>
          <div className="flex flex-col gap-[11px]">
            <Link href="/hakkimizda" className={colLink}>
              {tNav("about")}
            </Link>
            <Link href="/ekip" className={colLink}>
              {tNav("team")}
            </Link>
            <a href="#" className={colLink}>
              {tNav("articles")}
            </a>
            <a href="#" className={colLink}>
              {tNav("press")}
            </a>
            <a href="#" className={colLink}>
              {tNav("faq")}
            </a>
            <a href="#" className={colLink}>
              {tActions("book")}
            </a>
          </div>
        </div>

        {/* Çalışma alanları */}
        <div>
          <h3 className={colHeading}>{t("practiceAreas")}</h3>
          <div className="flex flex-col gap-[11px]">
            {practiceAreas.slice(0, 5).map((area) => (
              <a key={area.slug} href={area.href} className={colLink}>
                {area.title}
              </a>
            ))}
            <a href="#" className={colLink}>
              {tNav("allAreas")}
            </a>
          </div>
        </div>

        {/* İletişim */}
        <div>
          <h3 className={colHeading}>{t("contact")}</h3>
          <div className="flex flex-col gap-[13px] text-sm leading-relaxed text-on-dark">
            <span>
              {site.address.line1}
              <br />
              {site.address.line2}
            </span>
            <a href={site.phoneHref} className="transition-colors hover:text-gold">
              {site.phone}
            </a>
            <a href={site.emailHref} className="transition-colors hover:text-gold">
              {site.email}
            </a>
            <span className="font-mono text-xs tracking-[1.5px] text-gold">
              {t("reachable")}
            </span>
          </div>
        </div>
      </Container>

      <Container className="pb-8 pt-7">
        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6">
          <span className="text-[12.5px] text-on-dark-muted">{t("rights")}</span>
          <div className="flex items-center gap-[22px] text-[12.5px]">
            <a href="#" className={cn(colLink, "text-on-dark-muted")}>
              {t("kvkk")}
            </a>
            <a href="#" className={cn(colLink, "text-on-dark-muted")}>
              {t("disclosure")}
            </a>
            <a href="#" className={cn(colLink, "text-on-dark-muted")}>
              {t("cookies")}
            </a>
          </div>
        </div>
      </Container>
    </footer>
  );
}
