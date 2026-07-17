import { cn } from "@/lib/cn";

/** Fotoğraf gelene kadar çapraz desenli görsel yer tutucusu (mockup ile aynı). */
export function PlaceholderImage({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "placeholder-pattern flex items-center justify-center rounded-md border border-line",
        className,
      )}
    >
      <span className="rounded-full border border-line bg-surface px-4 py-2 font-mono text-[11px] tracking-wide text-muted">
        {label}
      </span>
    </div>
  );
}
