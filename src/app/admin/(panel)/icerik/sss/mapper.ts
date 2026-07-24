import type { ModuleItem } from "@/components/admin/content/ContentModuleBrowser";

type FaqLocale = { question: string; answer: string };
type FaqT = { tr: FaqLocale; en?: FaqLocale };

export type FaqItemRow = {
  id: string;
  categoryId: string;
  published: boolean;
  order: number;
  t: unknown;
  category: { t: unknown };
};

export function toModuleItem(row: FaqItemRow): ModuleItem {
  const t = row.t as FaqT;
  const categoryT = row.category.t as { tr: { name: string } };
  return {
    id: row.id,
    order: row.order,
    published: row.published,
    featured: null,
    listTitle: t.tr.question,
    listSubtitle: categoryT.tr.name,
    hasEn: !!t.en,
    top: { categoryId: row.categoryId },
    tr: { question: t.tr.question, answer: t.tr.answer },
    en: t.en ? { question: t.en.question, answer: t.en.answer } : {},
  };
}
