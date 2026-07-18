"use client";

import { AppIcon } from "./AppIcon";

/** Makaleler + SSS'te birebir aynı stilde arama kutusu. */
export function SearchInput({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
}) {
  return (
    <div className={`relative flex-none ${className ?? ""}`}>
      <AppIcon
        name="search"
        size={16}
        strokeWidth={1.75}
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-12 w-full rounded border border-line bg-surface pl-10 pr-4 font-sans text-[14.5px] text-ink outline-none focus:border-gold focus:shadow-[0_2px_8px_rgba(156,124,74,0.12)] sm:w-[280px]"
      />
    </div>
  );
}
