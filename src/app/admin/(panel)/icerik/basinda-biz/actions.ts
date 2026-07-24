"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSessionUser } from "@/lib/auth/session";
import { logAudit } from "@/lib/auth/audit";
import { slugify, uniqueSlug } from "@/lib/admin/slugify";
import type { SavePayload, SaveResult, SimpleResult } from "@/components/admin/content/ContentModuleBrowser";
import { toModuleItem } from "./mapper";

const MODULE_LABEL = "İÇERİK/BASINDA BİZ";

function parseIsoDate(value: string): Date {
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

export async function savePressItem(payload: SavePayload): Promise<SaveResult> {
  const user = await requireSessionUser();
  const title = payload.tr.title?.trim();
  if (!title) return { ok: false, error: "Başlık boş bırakılamaz." };

  const trBlock = { title, excerpt: payload.tr.excerpt ?? "", content: payload.tr.content ?? "" };
  const hasEn = Object.values(payload.en).some((v) => v.trim());
  const t = hasEn
    ? {
        tr: trBlock,
        en: {
          title: payload.en.title || title,
          excerpt: payload.en.excerpt ?? "",
          content: payload.en.content ?? "",
        },
      }
    : { tr: trBlock };

  const existingRows = await prisma.pressItem.findMany({ select: { id: true, slug: true } });
  const existingSlugs = new Set(existingRows.filter((r) => r.id !== payload.id).map((r) => r.slug));
  const slug = uniqueSlug(slugify(payload.top.slug || title), existingSlugs);
  const tag = payload.top.tag === "DUYURU" ? "DUYURU" : "BASIN";

  const data = {
    slug,
    date: payload.top.date?.trim() || "",
    isoDate: parseIsoDate(payload.top.isoDate),
    tag,
    source: tag === "BASIN" ? payload.top.source?.trim() || null : null,
    published: payload.published,
    t,
  };

  if (payload.id) {
    const updated = await prisma.pressItem.update({ where: { id: payload.id }, data });
    await logAudit({ actorId: user.id, action: "content_item_updated", module: MODULE_LABEL, entityId: updated.id });
    revalidatePath("/[locale]", "layout");
    return { ok: true, item: toModuleItem(updated) };
  }

  const maxOrder = await prisma.pressItem.aggregate({ _max: { order: true } });
  const created = await prisma.pressItem.create({
    data: { ...data, order: (maxOrder._max.order ?? -1) + 1 },
  });
  await logAudit({ actorId: user.id, action: "content_item_created", module: MODULE_LABEL, entityId: created.id });
  revalidatePath("/[locale]", "layout");
  return { ok: true, item: toModuleItem(created) };
}

export async function deletePressItem(id: string): Promise<SimpleResult> {
  const user = await requireSessionUser();
  await prisma.pressItem.delete({ where: { id } });
  await logAudit({ actorId: user.id, action: "content_item_deleted", module: MODULE_LABEL, entityId: id });
  revalidatePath("/[locale]", "layout");
  return { ok: true };
}

export async function reorderPressItems(orderedIds: string[]): Promise<SimpleResult> {
  const user = await requireSessionUser();
  await prisma.$transaction(
    orderedIds.map((id, index) => prisma.pressItem.update({ where: { id }, data: { order: index } })),
  );
  await logAudit({ actorId: user.id, action: "content_reordered", module: MODULE_LABEL });
  revalidatePath("/[locale]", "layout");
  return { ok: true };
}
