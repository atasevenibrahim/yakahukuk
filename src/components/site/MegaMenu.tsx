"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

export type MegaMenuArea = { title: string; href: string; slug: string };

/** "Çalışma Alanları" mega menüsü — hover + klavye (focus/Escape) ile açılır. */
export function MegaMenu({
  label,
  areas,
  viewAllLabel,
}: {
  label: string;
  areas: MegaMenuArea[];
  viewAllLabel: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
        }}
        className="flex cursor-pointer items-center gap-1.5 border-b-2 border-transparent bg-transparent py-1.5 text-sm font-medium text-ink transition-colors hover:text-gold"
      >
        {label}
        <span aria-hidden className="translate-y-px text-[9px] text-muted">
          ▾
        </span>
      </button>

      {open && (
        <div
          className="absolute left-1/2 top-full z-50 -translate-x-1/2 pt-4"
          style={{ animation: "riseIn .2s ease-out both" }}
        >
          <div
            className="grid w-[560px] grid-cols-2 gap-x-5 gap-y-0.5 rounded-md border border-line bg-surface p-[18px]"
            style={{
              boxShadow:
                "0 1px 2px rgba(28,34,48,.06), 0 12px 32px rgba(28,34,48,.09)",
            }}
          >
            {areas.map((area) => (
              <a
                key={area.slug}
                href={area.href}
                className="block truncate rounded px-2.5 py-2 text-[13.5px] font-medium text-ink transition-colors hover:bg-cream hover:text-gold"
              >
                {area.title}
              </a>
            ))}
            <a
              href="#"
              className={cn(
                "col-span-2 mt-2 border-t border-line px-2.5 pt-3 text-center",
                "font-mono text-[11.5px] tracking-[1px] text-gold",
              )}
            >
              {viewAllLabel}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
