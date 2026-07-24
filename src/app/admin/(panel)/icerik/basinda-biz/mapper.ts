import type { ModuleItem } from "@/components/admin/content/ContentModuleBrowser";

type PressLocale = { title: string; excerpt: string; content: string };
type PressT = { tr: PressLocale; en?: PressLocale };

export type PressRow = {
  id: string;
  slug: string;
  date: string;
  isoDate: Date;
  tag: string;
  source: string | null;
  published: boolean;
  order: number;
  t: unknown;
};

export function toModuleItem(row: PressRow): ModuleItem {
  const t = row.t as PressT;
  return {
    id: row.id,
    order: row.order,
    published: row.published,
    featured: null,
    listTitle: t.tr.title,
    listSubtitle: `${row.tag} · ${row.date}`,
    hasEn: !!t.en,
    top: {
      slug: row.slug,
      date: row.date,
      isoDate: row.isoDate.toISOString().slice(0, 10),
      tag: row.tag,
      source: row.source ?? "",
    },
    tr: { title: t.tr.title, excerpt: t.tr.excerpt, content: t.tr.content },
    en: t.en ? { title: t.en.title, excerpt: t.en.excerpt, content: t.en.content } : {},
  };
}
