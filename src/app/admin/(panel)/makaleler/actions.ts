"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSessionUser } from "@/lib/auth/session";
import { logAudit } from "@/lib/auth/audit";
import { slugify, uniqueSlug } from "@/lib/admin/slugify";
import { linesToArray } from "@/lib/admin/content-fields";
import { toFormData, toListItem } from "./mapper";
import type { ArticleFormData, ArticleStatus, SaveArticleResult, SimpleResult } from "./types";

const MODULE_LABEL = "MAKALELER";

function resolvePublishAt(
  status: ArticleStatus,
  publishAtInput: string,
  existingPublishAt: Date | null,
): { publishAt: Date | null; error?: string } {
  if (status === "DRAFT") return { publishAt: null };
  if (status === "SCHEDULED") {
    if (!publishAtInput) return { publishAt: null, error: "Zamanlama için bir tarih ve saat seçmelisiniz." };
    const d = new Date(publishAtInput);
    if (Number.isNaN(d.getTime())) return { publishAt: null, error: "Geçersiz tarih." };
    return { publishAt: d };
  }
  return { publishAt: existingPublishAt ?? new Date() };
}

export async function saveArticle(payload: ArticleFormData): Promise<SaveArticleResult> {
  const user = await requireSessionUser();
  const title = payload.tr.title?.trim();
  if (!title) return { ok: false, error: "Başlık boş bırakılamaz." };
  if (!payload.practiceAreaSlug) return { ok: false, error: "Çalışma alanı seçilmelidir." };

  const area = await prisma.practiceArea.findUnique({ where: { slug: payload.practiceAreaSlug } });
  if (!area) return { ok: false, error: "Seçilen çalışma alanı bulunamadı." };
  const category = (area.t as { tr: { title: string } }).tr.title.toLocaleUpperCase("tr");

  const existing = payload.id ? await prisma.article.findUnique({ where: { id: payload.id } }) : null;
  const { publishAt, error: dateError } = resolvePublishAt(
    payload.status,
    payload.publishAt,
    existing?.publishAt ?? null,
  );
  if (dateError) return { ok: false, error: dateError };

  const trBlock = {
    title,
    excerpt: payload.tr.excerpt ?? "",
    body: payload.tr.body ?? "",
    metaTitle: payload.tr.metaTitle?.trim() || undefined,
    metaDescription: payload.tr.metaDescription?.trim() || undefined,
  };
  const hasEn = Object.values(payload.en).some((v) => v.trim());
  const t = hasEn
    ? {
        tr: trBlock,
        en: {
          title: payload.en.title || title,
          excerpt: payload.en.excerpt ?? "",
          body: payload.en.body ?? "",
          metaTitle: payload.en.metaTitle?.trim() || undefined,
          metaDescription: payload.en.metaDescription?.trim() || undefined,
        },
      }
    : { tr: trBlock };

  // Yayınlanmış bir makalenin URL'i sessizce değişmemeli: mevcut kayıtta slug, yalnızca
  // kullanıcı slug alanını fiilen farklı bir değere çevirdiyse yeniden üretilir. Aksi hâlde
  // başlığı düzeltmek adresi de değiştirir, gelen linkler kırılır ve birikmiş SEO kaybedilir.
  const requestedSlug = payload.slug?.trim();
  let slug: string;
  if (existing && (!requestedSlug || requestedSlug === existing.slug)) {
    slug = existing.slug;
  } else {
    const existingRows = await prisma.article.findMany({ select: { id: true, slug: true } });
    const taken = new Set(existingRows.filter((r) => r.id !== payload.id).map((r) => r.slug));
    slug = uniqueSlug(slugify(requestedSlug || title), taken);
  }

  const readMinutes = Math.max(1, Number.parseInt(String(payload.readMinutes), 10) || 5);

  const data = {
    slug,
    practiceAreaSlug: payload.practiceAreaSlug,
    category,
    readMinutes,
    tags: linesToArray(payload.tags ?? ""),
    coverImageUrl: payload.coverImageUrl?.trim() || null,
    featured: payload.featured,
    status: payload.status,
    publishAt,
    t,
  };

  if (payload.id) {
    const updated = await prisma.article.update({ where: { id: payload.id }, data });
    await logAudit({ actorId: user.id, action: "article_updated", module: MODULE_LABEL, entityId: updated.id });
    revalidatePath("/[locale]", "layout");
    return { ok: true, list: toListItem(updated), form: toFormData(updated) };
  }

  const created = await prisma.article.create({ data });
  await logAudit({ actorId: user.id, action: "article_created", module: MODULE_LABEL, entityId: created.id });
  revalidatePath("/[locale]", "layout");
  return { ok: true, list: toListItem(created), form: toFormData(created) };
}

export async function deleteArticle(id: string): Promise<SimpleResult> {
  const user = await requireSessionUser();
  await prisma.article.delete({ where: { id } });
  await logAudit({ actorId: user.id, action: "article_deleted", module: MODULE_LABEL, entityId: id });
  revalidatePath("/[locale]", "layout");
  return { ok: true };
}
