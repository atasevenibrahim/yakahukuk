"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import type { LocalizedArticle } from "@/content/articles";
import { Card } from "@/components/ui/Card";
import { ArticleCover } from "@/components/site/ArticleCover";
import { SearchInput } from "@/components/ui/SearchInput";
import { AppIcon } from "@/components/ui/AppIcon";
import { cn } from "@/lib/cn";

const PAGE_SIZE = 6;

export function ArticlesBrowser({ articles }: { articles: LocalizedArticle[] }) {
  const t = useTranslations("articlesPage");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("Tümü");
  const [limit, setLimit] = useState(PAGE_SIZE);

  const categories = useMemo(() => {
    const distinct = Array.from(new Set(articles.map((a) => a.category)));
    return ["Tümü", ...distinct];
  }, [articles]);

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr");
    return articles.filter((a) => {
      const matchesCategory = category === "Tümü" || a.category === category;
      const matchesQuery =
        !q ||
        a.title.toLocaleLowerCase("tr").includes(q) ||
        a.excerpt.toLocaleLowerCase("tr").includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [articles, query, category]);

  const visible = filtered.slice(0, limit);
  const hasMore = filtered.length > visible.length;

  return (
    <>
      <div className="flex items-end justify-between gap-8 flex-wrap">
        <div className="max-w-[640px]">
          <div className="flex items-center gap-3.5">
            <span className="relative block h-px w-[34px] animate-draw bg-gold">
              <span
                aria-hidden
                className="absolute -top-[3px] right-[9px] block h-px w-2 rotate-[-45deg] bg-gold"
              />
            </span>
            <span className="font-mono text-[12.5px] tracking-[3px] text-muted">
              MAKALELER
            </span>
          </div>
          <h1 className="mt-[22px] font-serif text-[40px] font-medium leading-[1.08] text-balance sm:text-[52px] md:text-[60px]">
            Hukuku anlaşılır kılan yazılar.
          </h1>
        </div>
        <SearchInput
          value={query}
          onChange={(v) => {
            setQuery(v);
            setLimit(PAGE_SIZE);
          }}
          placeholder={t("searchPlaceholder")}
          className="mb-1.5"
        />
      </div>

      <div className="mt-10 flex flex-wrap gap-2.5">
        {categories.map((cat) => {
          const active = cat === category;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => {
                setCategory(cat);
                setLimit(PAGE_SIZE);
              }}
              className={cn(
                "cursor-pointer rounded-full border px-[18px] py-2.5 font-sans text-[13.5px] font-semibold transition-colors",
                active
                  ? "border-ink bg-ink text-cream"
                  : "border-line bg-surface text-ink hover:border-gold hover:text-gold",
              )}
            >
              {cat === "Tümü" ? cat : cat.charAt(0) + cat.slice(1).toLocaleLowerCase("tr")}
            </button>
          );
        })}
      </div>

      <div className="mt-12">
        {filtered.length === 0 ? (
          <div className="rounded-md border border-line bg-surface px-8 py-[72px] text-center">
            <span className="inline-block h-[18px] w-[18px] rotate-45 border-[1.5px] border-gold" />
            <p className="mt-5 text-base font-semibold text-ink">
              {t("emptyTitle")}
            </p>
            <p className="mt-2 text-[14.5px] text-muted">{t("emptyText")}</p>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setCategory("Tümü");
                setLimit(PAGE_SIZE);
              }}
              className="mt-[22px] cursor-pointer rounded border border-gold bg-surface px-[22px] py-2.5 font-sans text-sm font-semibold text-ink transition-colors hover:bg-cream"
            >
              {t("clearFilters")}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((article) => (
              <a key={article.slug} href={article.href} className="block text-ink">
                <Card hover className="h-full overflow-hidden">
                  <ArticleCover
                    size="card"
                    category={article.category}
                    title={article.title}
                    readMinutes={article.readMinutes}
                  />
                  <div className="p-6">
                    <span className="font-mono text-[11px] tracking-[2px] text-gold">
                      {article.category}
                    </span>
                    <h3 className="mt-2.5 text-lg font-semibold leading-[1.4] text-balance">
                      {article.title}
                    </h3>
                    <p className="mt-3 font-mono text-[11.5px] text-muted">
                      {article.date} · {article.readMinutes} DK OKUMA
                    </p>
                    <p className="mt-2.5 text-sm leading-relaxed text-muted">
                      {article.excerpt}
                    </p>
                  </div>
                </Card>
              </a>
            ))}
          </div>
        )}
      </div>

      {hasMore && (
        <div className="mt-12 text-center">
          <button
            type="button"
            onClick={() => setLimit((n) => n + PAGE_SIZE)}
            className="cursor-pointer rounded border border-gold bg-surface px-7 py-3.5 font-sans text-[15px] font-semibold text-ink transition-colors hover:bg-gold hover:text-white"
          >
            <span className="inline-flex items-center gap-2">
              {t("loadMore")}
              <AppIcon name="arrowRight" size={15} className="rotate-90" />
            </span>
          </button>
        </div>
      )}
    </>
  );
}
