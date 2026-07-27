import type { ArticleFormData, ArticleListItem, ArticleLocaleForm, FaqItem } from "./types";

type ArticleLocaleT = {
  title: string;
  excerpt: string;
  body: string; // markdown
  metaTitle?: string;
  metaDescription?: string;
};
type ArticleT = { tr: ArticleLocaleT; en?: ArticleLocaleT };

export type ArticleRow = {
  id: string;
  slug: string;
  practiceAreaSlug: string | null;
  category: string;
  readMinutes: number;
  tags: string[];
  coverImageUrl: string | null;
  featured: boolean;
  status: "DRAFT" | "SCHEDULED" | "PUBLISHED";
  publishAt: Date | null;
  /** `publishAt` boşken tarih sütununun düştüğü yedek. */
  createdAt: Date;
  focusKeyword: string | null;
  verifiedClaims: string[];
  authorSlug: string | null;
  faq: unknown;
  views: number;
  t: unknown;
};

/** DB'deki `faq` alanı serbest JSON; forma girmeden önce şekli doğrulanır. */
function toFaqList(value: unknown): FaqItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (item): item is FaqItem =>
        !!item &&
        typeof item === "object" &&
        typeof (item as FaqItem).question === "string" &&
        typeof (item as FaqItem).answer === "string",
    )
    .map((item) => ({ question: item.question, answer: item.answer }));
}

const DATE_FMT = new Intl.DateTimeFormat("tr-TR", {
  timeZone: "Europe/Istanbul",
  day: "2-digit",
  month: "short",
  year: "2-digit",
});

function toLocaleForm(loc: ArticleLocaleT | undefined): ArticleLocaleForm {
  if (!loc) return { title: "", excerpt: "", body: "", metaTitle: "", metaDescription: "" };
  return {
    title: loc.title,
    excerpt: loc.excerpt,
    body: loc.body ?? "",
    metaTitle: loc.metaTitle ?? "",
    metaDescription: loc.metaDescription ?? "",
  };
}

function toDatetimeLocal(date: Date | null): string {
  if (!date) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function toListItem(row: ArticleRow): ArticleListItem {
  const t = row.t as ArticleT;
  return {
    id: row.id,
    title: t.tr.title,
    category: row.category,
    status: row.status,
    // Genel sitedeki davranışla aynı (`content/articles.ts` → `publishAt ?? createdAt`).
    // Önceden yalnızca publishAt'e bakılıyordu; tohumlanan 9 yayındaki makalede bu alan boş
    // olduğu için liste "—" gösteriyordu, oysa sitede tarihleri görünüyordu.
    dateLabel: DATE_FMT.format(row.publishAt ?? row.createdAt).toUpperCase(),
    hasEn: !!t.en,
    views: row.views,
  };
}

export function toFormData(row: ArticleRow): ArticleFormData {
  const t = row.t as ArticleT;
  const faq = (row.faq ?? {}) as { tr?: unknown; en?: unknown };
  return {
    id: row.id,
    slug: row.slug,
    practiceAreaSlug: row.practiceAreaSlug ?? "",
    authorSlug: row.authorSlug ?? "",
    faq: { tr: toFaqList(faq.tr), en: toFaqList(faq.en) },
    readMinutes: row.readMinutes,
    tags: row.tags.join("\n"),
    coverImageUrl: row.coverImageUrl ?? "",
    featured: row.featured,
    status: row.status,
    publishAt: toDatetimeLocal(row.publishAt),
    focusKeyword: row.focusKeyword ?? "",
    verifiedClaims: row.verifiedClaims,
    tr: toLocaleForm(t.tr),
    en: toLocaleForm(t.en),
  };
}
