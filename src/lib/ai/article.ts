"use server";

import { z } from "zod";
import { getPathname } from "@/i18n/navigation";
import { requireSessionUser } from "@/lib/auth/session";
import { logAudit } from "@/lib/auth/audit";
import { getPracticeAreasRaw } from "@/content/practice-areas";
import { getArticlesRaw } from "@/content/articles";
import { AiError, complete, type AiUsage } from "./provider";
import {
  internalLinkSystemPrompt,
  seoSystemPrompt,
  titlesSystemPrompt,
  translateSystemPrompt,
  type AreaContext,
  type LinkTarget,
} from "./prompts";
import { buildVerificationReport, type VerificationReport } from "./citations";

const MODULE_LABEL = "MAKALELER";

/**
 * Server Action'lar ağdan doğrudan çağrılabildiği için her fonksiyon kendi oturum kontrolünü
 * yapar — layout guard'ı yalnızca sayfa render'ını korur (bkz. `requireSessionUser` yorumu).
 * Ayrıca ücretsiz AI kotasını kimliksiz kimse yakamasın diye bu kontrol maliyet güvenliği de.
 */
async function guard() {
  return requireSessionUser();
}

/** Tüm AI fonksiyonlarının ortak dönüş zarfı — hata panelde okunabilir şekilde gösterilir. */
export type AiActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

function fail(err: unknown): { ok: false; error: string } {
  if (err instanceof AiError) return { ok: false, error: err.userMessage };
  console.error("[ai] beklenmeyen hata:", err);
  return {
    ok: false,
    error: "Beklenmeyen bir hata oluştu. Yazdıklarınız kaybolmadı; tekrar deneyin.",
  };
}

function usageLabel(usage: AiUsage): string {
  return `${usage.totalTokens} token (girdi ${usage.promptTokens} / çıktı ${usage.outputTokens})`;
}

// ---------------------------------------------------------------------------
// Bağlam yükleyiciler
// ---------------------------------------------------------------------------

async function areaContext(areaSlug: string): Promise<AreaContext> {
  const areas = await getPracticeAreasRaw();
  const area = areas.find((a) => a.slug === areaSlug);
  if (!area) throw new AiError("invalid", "Seçilen çalışma alanı bulunamadı.");
  return {
    slug: area.slug,
    title: area.t.tr.title,
    href: getPathname({
      href: { pathname: "/calisma-alanlari/[slug]", params: { slug: area.slug } },
      locale: "tr",
    }),
  };
}

/**
 * İç bağlantı hedefleri: tüm çalışma alanları + yayınlanmış makaleler. Yolları biz üretiyoruz
 * (`getPathname`), modelden yol uydurması istenmiyor — yalnızca listeden kopyalıyor.
 */
async function linkTargets(excludeArticleSlug?: string): Promise<LinkTarget[]> {
  const [areas, articles] = await Promise.all([getPracticeAreasRaw(), getArticlesRaw()]);

  const areaTargets: LinkTarget[] = areas.map((a) => ({
    title: a.t.tr.title,
    href: getPathname({
      href: { pathname: "/calisma-alanlari/[slug]", params: { slug: a.slug } },
      locale: "tr",
    }),
  }));

  const articleTargets: LinkTarget[] = articles
    .filter((a) => a.slug !== excludeArticleSlug)
    .map((a) => ({
      title: a.t.tr.title,
      href: getPathname({
        href: { pathname: "/makaleler/[slug]", params: { slug: a.slug } },
        locale: "tr",
      }),
    }));

  return [...areaTargets, ...articleTargets];
}

/** Sihirbazın gövde adımının ihtiyaç duyduğu bağlam — akış Route Handler'ında kullanılır. */
export async function loadBodyContext(
  areaSlug: string,
): Promise<AiActionResult<{ area: AreaContext; targets: LinkTarget[] }>> {
  try {
    await guard();
    const [area, targets] = await Promise.all([areaContext(areaSlug), linkTargets()]);
    return { ok: true, data: { area, targets } };
  } catch (err) {
    return fail(err);
  }
}

// ---------------------------------------------------------------------------
// Başlık önerileri
// ---------------------------------------------------------------------------

const titlesSchema = z.object({
  titles: z
    .array(
      z.object({
        title: z.string(),
        /** Neden bu başlık — kullanıcı seçerken aralarındaki farkı görsün. */
        angle: z.string(),
      }),
    )
    .min(1)
    .max(3),
});

export type TitleSuggestion = z.infer<typeof titlesSchema>["titles"][number];

export async function suggestTitles(
  topic: string,
  areaSlug: string,
): Promise<AiActionResult<TitleSuggestion[]>> {
  try {
    const user = await guard();
    const trimmed = topic.trim();
    if (trimmed.length < 5) {
      return { ok: false, error: "Konuyu biraz daha açık yazın (en az 5 karakter)." };
    }

    const area = await areaContext(areaSlug);
    const { value, usage } = await complete({
      system: titlesSystemPrompt(area),
      prompt: `Konu: ${trimmed}`,
      schema: titlesSchema,
      thinking: "low",
      temperature: 1,
    });

    await logAudit({
      actorId: user.id,
      action: "ai_titles_suggested",
      module: MODULE_LABEL,
      detail: usageLabel(usage),
    });

    return { ok: true, data: value.titles };
  } catch (err) {
    return fail(err);
  }
}

// ---------------------------------------------------------------------------
// SEO alanları
// ---------------------------------------------------------------------------

const seoSchema = z.object({
  metaTitle: z.array(z.string()).min(1).max(3),
  metaDescription: z.array(z.string()).min(1).max(3),
  excerpt: z.array(z.string()).min(1).max(3),
  tags: z.array(z.array(z.string())).min(1).max(3),
  focusKeyword: z.array(z.string()).min(1).max(3),
});

export type SeoSuggestions = z.infer<typeof seoSchema>;

export async function suggestSeo(
  title: string,
  body: string,
): Promise<AiActionResult<SeoSuggestions>> {
  try {
    const user = await guard();
    if (!body.trim()) return { ok: false, error: "Önce makale gövdesini üretin." };

    const { value, usage } = await complete({
      system: seoSystemPrompt(),
      // Gövdenin tamamı gerekmiyor; ilk bölüm konuyu belirlemeye yeter ve token tasarrufu olur.
      prompt: `Başlık: ${title}\n\nMakale:\n${body.slice(0, 6000)}`,
      schema: seoSchema,
      thinking: "low",
      temperature: 1,
    });

    await logAudit({
      actorId: user.id,
      action: "ai_seo_suggested",
      module: MODULE_LABEL,
      detail: usageLabel(usage),
    });

    return { ok: true, data: value };
  } catch (err) {
    return fail(err);
  }
}

// ---------------------------------------------------------------------------
// EN çevirisi
// ---------------------------------------------------------------------------

const translationSchema = z.object({
  title: z.string(),
  excerpt: z.string(),
  body: z.string(),
  metaTitle: z.string(),
  metaDescription: z.string(),
});

export type Translation = z.infer<typeof translationSchema>;

export async function translateToEn(tr: {
  title: string;
  excerpt: string;
  body: string;
  metaTitle: string;
  metaDescription: string;
}): Promise<AiActionResult<Translation>> {
  try {
    const user = await guard();
    if (!tr.title.trim() || !tr.body.trim()) {
      return { ok: false, error: "Çeviri için başlık ve gövde gerekli." };
    }

    const { value, usage } = await complete({
      system: translateSystemPrompt(),
      prompt: JSON.stringify(tr, null, 2),
      schema: translationSchema,
      thinking: "medium",
      temperature: 0.4,
      // Çeviri girdiyle aynı uzunlukta olur; uzun makalede varsayılan sınır yetmeyebilir.
      maxOutputTokens: 16000,
    });

    await logAudit({
      actorId: user.id,
      action: "ai_translated",
      module: MODULE_LABEL,
      detail: usageLabel(usage),
    });

    return { ok: true, data: value };
  } catch (err) {
    return fail(err);
  }
}

// ---------------------------------------------------------------------------
// İç bağlantı önerileri
// ---------------------------------------------------------------------------

const linksSchema = z.object({
  suggestions: z
    .array(
      z.object({
        phrase: z.string(),
        href: z.string(),
        reason: z.string(),
      }),
    )
    .max(5),
});

export type LinkSuggestion = z.infer<typeof linksSchema>["suggestions"][number];

export async function suggestInternalLinks(
  body: string,
  excludeArticleSlug?: string,
): Promise<AiActionResult<LinkSuggestion[]>> {
  try {
    const user = await guard();
    if (!body.trim()) return { ok: false, error: "Önce makale gövdesini üretin." };

    const targets = await linkTargets(excludeArticleSlug);
    const { value, usage } = await complete({
      system: internalLinkSystemPrompt(targets),
      prompt: body.slice(0, 8000),
      schema: linksSchema,
      thinking: "low",
      temperature: 0.5,
    });

    // Model metinde geçmeyen bir ifade ya da listede olmayan bir yol önerebilir —
    // ikisini de burada süzüyoruz, panelde çalışmayan öneri gösterilmesin.
    const allowedHrefs = new Set(targets.map((t) => t.href));
    const filtered = value.suggestions.filter(
      (s) => allowedHrefs.has(s.href) && body.includes(s.phrase),
    );

    await logAudit({
      actorId: user.id,
      action: "ai_links_suggested",
      module: MODULE_LABEL,
      detail: usageLabel(usage),
    });

    return { ok: true, data: filtered };
  } catch (err) {
    return fail(err);
  }
}

// ---------------------------------------------------------------------------
// Doğrulama raporu (AI çağrısı yok — saf, ücretsiz, anında)
// ---------------------------------------------------------------------------

export async function verifyText(text: string): Promise<VerificationReport> {
  await guard();
  return buildVerificationReport(text);
}
