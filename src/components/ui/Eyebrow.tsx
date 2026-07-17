import { cn } from "@/lib/cn";

/** Ok-çizgili "eyebrow" etiketi (mockup'larda her bölüm başında). */
export function Eyebrow({
  label,
  center,
  onDark,
  draw,
  className,
}: {
  label: string;
  center?: boolean;
  onDark?: boolean;
  draw?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-[14px]",
        center && "justify-center",
        className,
      )}
    >
      <span
        className={cn("relative block h-px w-[34px] bg-gold", draw && "animate-draw")}
      >
        <span
          aria-hidden
          className="absolute -top-[3px] right-[9px] block h-px w-2 bg-gold"
          style={{ transform: "rotate(-45deg)" }}
        />
      </span>
      <span
        className={cn(
          "font-mono text-[12.5px] tracking-[3px]",
          onDark ? "text-on-dark-muted" : "text-muted",
        )}
      >
        {label}
      </span>
    </div>
  );
}
