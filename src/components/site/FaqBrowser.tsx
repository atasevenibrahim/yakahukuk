"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import type { LocalizedFaqCategory } from "@/content/faq";
import { SearchInput } from "@/components/ui/SearchInput";
import { AppIcon } from "@/components/ui/AppIcon";
import { cn } from "@/lib/cn";

export function FaqBrowser({ categories }: { categories: LocalizedFaqCategory[] }) {
  const t = useTranslations("faqPage");
  const [activeCategory, setActiveCategory] = useState(categories[0]?.slug ?? "");
  const [query, setQuery] = useState("");
  const [openIndex, setOpenIndex] = useState<number>(0);

  const q = query.trim().toLocaleLowerCase("tr");

  const visibleItems = useMemo(() => {
    if (q) {
      return categories
        .flatMap((cat) => cat.items)
        .filter(
          (item) =>
            item.question.toLocaleLowerCase("tr").includes(q) ||
            item.answer.toLocaleLowerCase("tr").includes(q),
        );
    }
    return categories.find((cat) => cat.slug === activeCategory)?.items ?? [];
  }, [categories, activeCategory, q]);

  return (
    <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[280px_1fr] lg:gap-12">
      {/* Kategori navigasyonu */}
      <div className="flex gap-2 overflow-x-auto pb-1 lg:sticky lg:top-24 lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0">
        {categories.map((cat) => {
          const active = !q && cat.slug === activeCategory;
          return (
            <button
              key={cat.slug}
              type="button"
              onClick={() => {
                setActiveCategory(cat.slug);
                setQuery("");
                setOpenIndex(0);
              }}
              className={cn(
                "flex flex-none cursor-pointer items-center gap-3 rounded px-4 py-3.5 font-sans text-[14.5px] font-semibold transition-colors",
                active ? "bg-surface text-ink" : "bg-transparent text-muted hover:text-ink",
              )}
            >
              <span
                className={cn(
                  "h-0.5 w-4 flex-none transition-colors",
                  active ? "bg-gold" : "bg-line",
                )}
              />
              <span className="whitespace-nowrap">{cat.name}</span>
              <span
                className={cn(
                  "ml-auto font-mono text-[11px] font-normal",
                  active ? "text-gold" : "text-muted",
                )}
              >
                {String(cat.items.length).padStart(2, "0")}
              </span>
            </button>
          );
        })}
      </div>

      {/* Sorular */}
      <div className="max-w-[760px]">
        <div className="mb-6">
          <SearchInput
            value={query}
            onChange={(v) => {
              setQuery(v);
              setOpenIndex(0);
            }}
            placeholder={t("searchPlaceholder")}
            className="w-full sm:w-full"
          />
        </div>

        {visibleItems.length === 0 ? (
          <div className="rounded-md border border-line bg-surface px-8 py-16 text-center">
            <span className="inline-block h-[18px] w-[18px] rotate-45 border-[1.5px] border-gold" />
            <p className="mt-5 text-base font-semibold text-ink">{t("emptyTitle")}</p>
            <p className="mt-2 text-[14.5px] text-muted">{t("emptyText")}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {visibleItems.map((item, index) => {
              const open = index === openIndex;
              return (
                <div
                  key={item.slug}
                  className={cn(
                    "overflow-hidden rounded-md border bg-surface shadow-card transition-colors",
                    open ? "border-gold" : "border-line",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setOpenIndex(open ? -1 : index)}
                    aria-expanded={open}
                    className="flex w-full cursor-pointer items-center gap-4 px-6 py-5 text-left font-sans text-base font-semibold text-ink"
                  >
                    <AppIcon
                      name="chevronDown"
                      size={16}
                      className={cn(
                        "flex-none text-muted transition-transform duration-300",
                        open && "rotate-180 text-gold",
                      )}
                    />
                    {item.question}
                  </button>
                  <div
                    className="grid transition-[grid-template-rows] duration-300 ease-out"
                    style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
                  >
                    <div className="overflow-hidden">
                      <p className="text-pretty px-6 pb-[22px] pl-[46px] text-[15px] leading-[1.7] text-muted">
                        {item.answer}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
