"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { LocalizedArticle } from "@/content/articles";
import { ArticleGrid } from "@/components/site/ArticleGrid";
import { SearchInput } from "@/components/ui/SearchInput";
import { AppIcon } from "@/components/ui/AppIcon";

const PAGE_SIZE = 6;

export function ArticlesBrowser({ articles }: { articles: LocalizedArticle[] }) {
  const t = useTranslations("articlesPage");
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(PAGE_SIZE);

  // Kategoriler artık istemci tarafı filtre değil, kendi arşiv sayfalarına giden bağlantı:
  // Google gezgin için taranabilir bir yol açıyor ve her kategori kendi başlığı/canonical'ı
  // olan bir açılış sayfası kazanıyor. Arama kutusu liste üstünde çalışmayı sürdürüyor.
  const categories = useMemo(() => {
    const map = new Map<string, string>();
    for (const a of articles) if (!map.has(a.practiceAreaSlug)) map.set(a.practiceAreaSlug, a.category);
    return [...map.entries()].map(([slug, label]) => ({ slug, label }));
  }, [articles]);

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr");
    if (!q) return articles;
    return articles.filter(
      (a) =>
        a.title.toLocaleLowerCase("tr").includes(q) ||
        a.excerpt.toLocaleLowerCase("tr").includes(q),
    );
  }, [articles, query]);

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
        {categories.map((cat) => (
          <Link
            key={cat.slug}
            href={{ pathname: "/makaleler/kategori/[slug]", params: { slug: cat.slug } }}
            className="rounded-full border border-line bg-surface px-[18px] py-2.5 font-sans text-[13.5px] font-semibold text-ink transition-colors hover:border-gold hover:text-gold"
          >
            {cat.label.charAt(0) + cat.label.slice(1).toLocaleLowerCase("tr")}
          </Link>
        ))}
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
                setLimit(PAGE_SIZE);
              }}
              className="mt-[22px] cursor-pointer rounded border border-gold bg-surface px-[22px] py-2.5 font-sans text-sm font-semibold text-ink transition-colors hover:bg-cream"
            >
              {t("clearFilters")}
            </button>
          </div>
        ) : (
          <ArticleGrid articles={visible} />
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
