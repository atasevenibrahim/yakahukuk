"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import type { LocalizedLegalDocument } from "@/content/legal";
import { legalLastUpdated } from "@/content/legal";
import { cn } from "@/lib/cn";

export function LegalBrowser({ documents }: { documents: LocalizedLegalDocument[] }) {
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const initialIndex = Math.max(
    0,
    documents.findIndex((d) => d.slug === requestedTab),
  );
  const [active, setActive] = useState(initialIndex);
  const doc = documents[active];

  return (
    <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[280px_1fr] lg:gap-12">
      <div className="flex flex-col gap-1 lg:sticky lg:top-24">
        {documents.map((d, index) => {
          const isActive = index === active;
          return (
            <button
              key={d.slug}
              type="button"
              onClick={() => setActive(index)}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded px-4 py-3.5 text-left font-sans text-[14.5px] font-semibold transition-colors",
                isActive ? "bg-surface text-ink" : "bg-transparent text-muted hover:text-ink",
              )}
            >
              <span
                className={cn(
                  "h-0.5 w-4 flex-none transition-colors",
                  isActive ? "bg-gold" : "bg-line",
                )}
              />
              {d.tabLabel}
            </button>
          );
        })}
        <div className="mt-5 rounded-md border border-line bg-surface px-4 py-[18px]">
          <span className="font-mono text-[10.5px] tracking-[2px] text-gold">
            SON GÜNCELLEME
          </span>
          <p className="mt-2 text-[13.5px] text-muted">{legalLastUpdated}</p>
        </div>
      </div>

      <div className="max-w-[760px] rounded-md border border-line bg-surface p-8 shadow-card sm:p-11">
        <span className="font-mono text-[11.5px] tracking-[2.5px] text-gold">{doc.tag}</span>
        <h2 className="mt-3 font-serif text-[28px] font-medium sm:text-[34px]">{doc.title}</h2>
        <p className="mt-5 text-[15.5px] leading-[1.75] text-pretty text-muted">{doc.intro}</p>
        {doc.sections.map((section) => (
          <div key={section.no} className="mt-8">
            <h3 className="m-0 flex items-baseline gap-3 text-[17px] font-bold">
              <span className="font-mono text-[12.5px] font-normal text-gold">{section.no}</span>
              {section.title}
            </h3>
            <p className="mt-2.5 text-[15px] leading-[1.75] text-pretty text-muted">
              {section.text}
            </p>
          </div>
        ))}
        <div className="mt-10 rounded border border-line bg-cream px-6 py-5">
          <p className="m-0 text-[13.5px] leading-relaxed text-muted">
            <span className="font-mono text-[10.5px] tracking-[2px] text-gold">NOT</span> — Bu
            metin şablon niteliğindedir; nihai yasal metinler büronun KVKK danışmanı tarafından
            onaylanarak admin panelinden yüklenecektir.
          </p>
        </div>
      </div>
    </div>
  );
}
