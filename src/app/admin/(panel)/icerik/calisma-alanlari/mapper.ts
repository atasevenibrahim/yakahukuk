import type { ModuleItem } from "@/components/admin/content/ContentModuleBrowser";
import { arrayToLines } from "@/lib/admin/content-fields";

type PracticeAreaLocale = { title: string; excerpt: string; whatWeDo: string[]; typicalCases: string[] };
type PracticeAreaT = { tr: PracticeAreaLocale; en?: PracticeAreaLocale };

export type PracticeAreaRow = {
  id: string;
  slug: string;
  icon: string;
  featured: boolean;
  published: boolean;
  order: number;
  t: unknown;
};

function toLines(loc: PracticeAreaLocale | undefined): Record<string, string> {
  if (!loc) return {};
  return {
    title: loc.title,
    excerpt: loc.excerpt,
    whatWeDo: arrayToLines(loc.whatWeDo ?? []),
    typicalCases: arrayToLines(loc.typicalCases ?? []),
  };
}

export function toModuleItem(row: PracticeAreaRow): ModuleItem {
  const t = row.t as PracticeAreaT;
  return {
    id: row.id,
    order: row.order,
    published: row.published,
    featured: row.featured,
    listTitle: t.tr.title,
    listSubtitle: row.slug,
    hasEn: !!t.en,
    top: { slug: row.slug, icon: row.icon },
    tr: toLines(t.tr),
    en: toLines(t.en),
  };
}
