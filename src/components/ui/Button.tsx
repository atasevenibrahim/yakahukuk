import { cn } from "@/lib/cn";

type Variant = "dark" | "outline" | "light";
type Size = "sm" | "md" | "lg";

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
 * Buton görünümlü bağlantı. Şu an tüm CTA'lar yer tutucu ("#");
 * randevu/iletişim sayfaları eklendiğinde href gerçek rotaya bağlanır.
 */
export function Button({
  href = "#",
  variant = "dark",
  size = "md",
  block,
  className,
  children,
}: {
  href?: string;
  variant?: Variant;
  size?: Size;
  block?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className={cn(
        "rounded-[4px] text-center font-semibold transition-colors duration-200",
        block ? "block" : "inline-block",
        variants[variant],
        sizes[size],
        className,
      )}
    >
      {children}
    </a>
  );
}
