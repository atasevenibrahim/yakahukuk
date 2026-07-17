import { cn } from "@/lib/cn";

/** Beyaz yüzey kartı. `hover` → yükselme; `accent` → hover'da altın üst kenar. */
export function Card({
  hover,
  accent,
  className,
  children,
}: {
  hover?: boolean;
  accent?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-md border border-line bg-surface shadow-card",
        accent && "border-t-2 border-t-transparent",
        hover &&
          "transition-all duration-[250ms] hover:-translate-y-0.5 hover:shadow-card-hover",
        accent && hover && "hover:border-t-gold",
        className,
      )}
    >
      {children}
    </div>
  );
}
