import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";

type Variant = "dark" | "outline" | "light";
type Size = "sm" | "md" | "lg";
type LinkHref = React.ComponentProps<typeof Link>["href"];

const variants: Record<Variant, string> = {
  dark: "bg-ink text-cream hover:bg-gold hover:text-white",
  outline: "border border-gold text-ink hover:bg-gold hover:text-white",
  light: "bg-cream text-ink hover:bg-gold hover:text-white",
};

const sizes: Record<Size, string> = {
  sm: "px-6 py-3 text-[15px]",
  md: "px-7 py-3.5 text-base",
  lg: "px-[34px] py-4 text-base",
};

/**
 * Buton görünümlü bağlantı. `href="#"` henüz sayfası olmayan hedefler için
 * yer tutucu olarak kalır (düz `<a>`); gerçek dahili rotalar next-intl'in
 * locale-aware `Link`'i ile render edilir.
 */
export function Button({
  href = "#",
  variant = "dark",
  size = "md",
  block,
  className,
  children,
}: {
  href?: LinkHref | "#";
  variant?: Variant;
  size?: Size;
  block?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const classes = cn(
    "rounded-[4px] text-center font-semibold transition-colors duration-200",
    block ? "block" : "inline-block",
    variants[variant],
    sizes[size],
    className,
  );

  if (href === "#") {
    return (
      <a href="#" className={classes}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={classes}>
      {children}
    </Link>
  );
}
