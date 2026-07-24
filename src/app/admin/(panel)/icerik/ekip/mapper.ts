import type { ModuleItem } from "@/components/admin/content/ContentModuleBrowser";
import { arrayToLines, educationToLines } from "@/lib/admin/content-fields";

type TeamLocale = { role: string; roleShort: string; bio: string[]; education: { period: string; text: string }[] };
type TeamT = { tr: TeamLocale; en?: TeamLocale };

export type TeamRow = {
  id: string;
  slug: string;
  name: string;
  bar: string;
  tags: string[];
  areas: string[];
  languages: string[];
  articleSlugs: string[];
  portraitUrl: string | null;
  published: boolean;
  order: number;
  t: unknown;
};

function toLines(loc: TeamLocale | undefined): Record<string, string> {
  if (!loc) return {};
  return {
    role: loc.role,
    roleShort: loc.roleShort,
    bio: arrayToLines(loc.bio ?? []),
    education: educationToLines(loc.education ?? []),
  };
}

export function toModuleItem(row: TeamRow): ModuleItem {
  const t = row.t as TeamT;
  return {
    id: row.id,
    order: row.order,
    published: row.published,
    featured: null,
    listTitle: row.name,
    listSubtitle: [t.tr.roleShort, row.tags.join(", ")].filter(Boolean).join(" · "),
    hasEn: !!t.en,
    top: {
      slug: row.slug,
      name: row.name,
      bar: row.bar,
      tags: arrayToLines(row.tags),
      areas: arrayToLines(row.areas),
      languages: arrayToLines(row.languages),
      articleSlugs: arrayToLines(row.articleSlugs),
      portraitUrl: row.portraitUrl ?? "",
    },
    tr: toLines(t.tr),
    en: toLines(t.en),
  };
}
