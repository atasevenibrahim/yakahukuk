export type ArticleStatus = "DRAFT" | "SCHEDULED" | "PUBLISHED";

export type ArticleListItem = {
  id: string;
  title: string;
  category: string;
  status: ArticleStatus;
  dateLabel: string;
  hasEn: boolean;
};

export type ArticleLocaleForm = {
  title: string;
  excerpt: string;
  body: string;
  metaTitle: string;
  metaDescription: string;
};

export type ArticleFormData = {
  id: string | null;
  slug: string;
  practiceAreaSlug: string;
  readMinutes: number;
  tags: string;
  coverImageUrl: string;
  featured: boolean;
  status: ArticleStatus;
  publishAt: string; // "YYYY-MM-DDTHH:mm", boş olabilir
  /** SEO odak anahtar kelimesi — Aşama 3'teki denetimler bunun üzerinden çalışır. */
  focusKeyword: string;
  tr: ArticleLocaleForm;
  en: ArticleLocaleForm;
};

export type SaveArticleResult =
  | { ok: true; list: ArticleListItem; form: ArticleFormData }
  | { ok: false; error: string };

export type SimpleResult = { ok: true } | { ok: false; error: string };
