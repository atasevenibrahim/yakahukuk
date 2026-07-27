export type ArticleStatus = "DRAFT" | "SCHEDULED" | "PUBLISHED";

export type ArticleListItem = {
  id: string;
  title: string;
  category: string;
  status: ArticleStatus;
  dateLabel: string;
  hasEn: boolean;
  views: number;
};

export type ArticleLocaleForm = {
  title: string;
  excerpt: string;
  body: string;
  metaTitle: string;
  metaDescription: string;
};

export type FaqItem = { question: string; answer: string };

export type ArticleFormData = {
  id: string | null;
  slug: string;
  practiceAreaSlug: string;
  /** Yazan ekip üyesi — boşsa makale kurum adına görünür (E-E-A-T zayıflar). */
  authorSlug: string;
  /**
   * Makaleye özel SSS. Gövdeden ayrı tutuluyor: FAQPage yapılandırılmış verisi soru-cevap
   * çiftleri istiyor, markdown'dan çıkarım yapmak kırılgan olurdu.
   */
  faq: { tr: FaqItem[]; en: FaqItem[] };
  readMinutes: number;
  tags: string;
  coverImageUrl: string;
  featured: boolean;
  status: ArticleStatus;
  publishAt: string; // "YYYY-MM-DDTHH:mm", boş olabilir
  /** SEO odak anahtar kelimesi — SEO denetimleri bunun üzerinden çalışır. */
  focusKeyword: string;
  /** Kullanıcının kaynaktan doğruladığı atıfların anahtarları (bkz. lib/ai/citations.ts). */
  verifiedClaims: string[];
  tr: ArticleLocaleForm;
  en: ArticleLocaleForm;
};

export type SaveArticleResult =
  | { ok: true; list: ArticleListItem; form: ArticleFormData }
  | { ok: false; error: string };

export type SimpleResult = { ok: true } | { ok: false; error: string };
