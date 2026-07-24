import type { ModuleItem } from "@/components/admin/content/ContentModuleBrowser";
import { sectionsToLines } from "@/lib/admin/content-fields";

type LegalSection = { no: string; title: string; text: string };
type LegalLocale = { tabLabel: string; tag: string; title: string; intro: string; sections: LegalSection[] };
type LegalT = { tr: LegalLocale; en?: LegalLocale };

export type LegalDocumentRow = {
  id: string;
  slug: string;
  order: number;
  t: unknown;
  updatedAt: Date;
};

function toLines(loc: LegalLocale | undefined): Record<string, string> {
  if (!loc) return {};
  return {
    tabLabel: loc.tabLabel,
    tag: loc.tag,
    title: loc.title,
    intro: loc.intro,
    sections: sectionsToLines(loc.sections ?? []),
  };
}

export function toModuleItem(row: LegalDocumentRow): ModuleItem {
  const t = row.t as LegalT;
  return {
    id: row.id,
    order: row.order,
    published: true,
    featured: null,
    listTitle: t.tr.tabLabel,
    listSubtitle: t.tr.tag,
    hasEn: !!t.en,
    top: { slug: row.slug },
    tr: toLines(t.tr),
    en: toLines(t.en),
  };
}
