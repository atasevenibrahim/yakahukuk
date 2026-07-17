import type { CSSProperties } from "react";
import type { DiamondVariant } from "@/content/practice-areas";
import { cn } from "@/lib/cn";

const GOLD = "var(--color-gold)";
const BORDER = `1.5px solid ${GOLD}`;

const shapes: Record<DiamondVariant, CSSProperties> = {
  diamond: { width: 16, height: 16, border: BORDER, transform: "rotate(45deg)" },
  square: { width: 16, height: 16, border: BORDER },
  circle: { width: 16, height: 16, border: BORDER, borderRadius: "50%" },
  rounded: { width: 16, height: 16, border: BORDER, borderRadius: 2, transform: "rotate(45deg)" },
  dot: { width: 8, height: 8, background: GOLD, transform: "rotate(45deg)" },
  corner: { width: 16, height: 16, borderLeft: BORDER, borderBottom: BORDER },
};

/** Mockup'lardaki dekoratif altın işaret (kart / değer başlıkları). */
export function Diamond({
  variant = "diamond",
  className,
}: {
  variant?: DiamondVariant;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn("block flex-none", className)}
      style={shapes[variant]}
    />
  );
}
