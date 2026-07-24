import type { ModuleItem } from "@/components/admin/content/ContentModuleBrowser";

type TestimonialLocale = { quote: string };
type TestimonialT = { tr: TestimonialLocale; en?: TestimonialLocale };

export type TestimonialRow = {
  id: string;
  practiceAreaSlug: string;
  areaLabel: string;
  initials: string;
  monthLabel: string;
  rating: number;
  published: boolean;
  order: number;
  t: unknown;
};

export function toModuleItem(row: TestimonialRow): ModuleItem {
  const t = row.t as TestimonialT;
  const stars = "★".repeat(Math.max(0, Math.min(5, row.rating)));
  const excerpt = t.tr.quote.length > 42 ? `${t.tr.quote.slice(0, 42)}…` : t.tr.quote;
  return {
    id: row.id,
    order: row.order,
    published: row.published,
    featured: null,
    listTitle: `${row.initials} — ${row.areaLabel}`,
    listSubtitle: `${stars} · "${excerpt}"`,
    hasEn: !!t.en,
    top: {
      practiceAreaSlug: row.practiceAreaSlug,
      areaLabel: row.areaLabel,
      initials: row.initials,
      monthLabel: row.monthLabel,
      rating: String(row.rating),
    },
    tr: { quote: t.tr.quote },
    en: t.en ? { quote: t.en.quote } : {},
  };
}
