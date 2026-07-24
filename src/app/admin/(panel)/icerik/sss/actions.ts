"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSessionUser } from "@/lib/auth/session";
import { logAudit } from "@/lib/auth/audit";
import { slugify, uniqueSlug } from "@/lib/admin/slugify";
import type { SavePayload, SaveResult, SimpleResult } from "@/components/admin/content/ContentModuleBrowser";
import { toModuleItem } from "./mapper";

const MODULE_LABEL = "İÇERİK/SSS";

export async function saveFaqItem(payload: SavePayload): Promise<SaveResult> {
  const user = await requireSessionUser();
  const question = payload.tr.question?.trim();
  if (!question) return { ok: false, error: "Soru boş bırakılamaz." };
  const categoryId = payload.top.categoryId;
  if (!categoryId) return { ok: false, error: "Kategori seçilmelidir." };

  const trBlock = { question, answer: payload.tr.answer ?? "" };
  const hasEn = Object.values(payload.en).some((v) => v.trim());
  const t = hasEn
    ? { tr: trBlock, en: { question: payload.en.question || question, answer: payload.en.answer ?? "" } }
    : { tr: trBlock };

  const existingRows = await prisma.faqItem.findMany({ select: { id: true, slug: true } });
  const existingSlugs = new Set(existingRows.filter((r) => r.id !== payload.id).map((r) => r.slug));
  const slug = uniqueSlug(slugify(question), existingSlugs);

  const data = { categoryId, published: payload.published, t };
  const include = { category: { select: { t: true } } };

  if (payload.id) {
    const updated = await prisma.faqItem.update({ where: { id: payload.id }, data, include });
    await logAudit({ actorId: user.id, action: "content_item_updated", module: MODULE_LABEL, entityId: updated.id });
    revalidatePath("/[locale]", "layout");
    return { ok: true, item: toModuleItem(updated) };
  }

  const maxOrder = await prisma.faqItem.aggregate({ _max: { order: true } });
  const created = await prisma.faqItem.create({
    data: { ...data, slug, order: (maxOrder._max.order ?? -1) + 1 },
    include,
  });
  await logAudit({ actorId: user.id, action: "content_item_created", module: MODULE_LABEL, entityId: created.id });
  revalidatePath("/[locale]", "layout");
  return { ok: true, item: toModuleItem(created) };
}

export async function deleteFaqItem(id: string): Promise<SimpleResult> {
  const user = await requireSessionUser();
  await prisma.faqItem.delete({ where: { id } });
  await logAudit({ actorId: user.id, action: "content_item_deleted", module: MODULE_LABEL, entityId: id });
  revalidatePath("/[locale]", "layout");
  return { ok: true };
}

export async function reorderFaqItems(orderedIds: string[]): Promise<SimpleResult> {
  const user = await requireSessionUser();
  await prisma.$transaction(
    orderedIds.map((id, index) => prisma.faqItem.update({ where: { id }, data: { order: index } })),
  );
  await logAudit({ actorId: user.id, action: "content_reordered", module: MODULE_LABEL });
  revalidatePath("/[locale]", "layout");
  return { ok: true };
}
