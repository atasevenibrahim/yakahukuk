"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSessionUser } from "@/lib/auth/session";
import { logAudit } from "@/lib/auth/audit";
import { slugify, uniqueSlug } from "@/lib/admin/slugify";
import { linesToArray } from "@/lib/admin/content-fields";
import { icons, type IconName } from "@/lib/icons";
import type { SavePayload, SaveResult, SimpleResult } from "@/components/admin/content/ContentModuleBrowser";
import { toModuleItem } from "./mapper";

const MODULE_LABEL = "İÇERİK/ÇALIŞMA ALANLARI";

export async function savePracticeArea(payload: SavePayload): Promise<SaveResult> {
  const user = await requireSessionUser();
  const title = payload.tr.title?.trim();
  if (!title) return { ok: false, error: "Başlık boş bırakılamaz." };

  const trBlock = {
    title,
    excerpt: payload.tr.excerpt ?? "",
    whatWeDo: linesToArray(payload.tr.whatWeDo ?? ""),
    typicalCases: linesToArray(payload.tr.typicalCases ?? ""),
  };
  const hasEn = Object.values(payload.en).some((v) => v.trim());
  const t = hasEn
    ? {
        tr: trBlock,
        en: {
          title: payload.en.title || title,
          excerpt: payload.en.excerpt ?? "",
          whatWeDo: linesToArray(payload.en.whatWeDo ?? ""),
          typicalCases: linesToArray(payload.en.typicalCases ?? ""),
        },
      }
    : { tr: trBlock };

  const icon = (payload.top.icon in icons ? payload.top.icon : "heart") as IconName;

  const existingRows = await prisma.practiceArea.findMany({ select: { id: true, slug: true } });
  const existingSlugs = new Set(
    existingRows.filter((r) => r.id !== payload.id).map((r) => r.slug),
  );
  const slug = uniqueSlug(slugify(payload.top.slug || title), existingSlugs);

  if (payload.id) {
    const updated = await prisma.practiceArea.update({
      where: { id: payload.id },
      data: { slug, icon, featured: payload.featured, published: payload.published, t },
    });
    await logAudit({ actorId: user.id, action: "content_item_updated", module: MODULE_LABEL, entityId: updated.id });
    revalidatePath("/[locale]", "layout");
    return { ok: true, item: toModuleItem(updated) };
  }

  const maxOrder = await prisma.practiceArea.aggregate({ _max: { order: true } });
  const created = await prisma.practiceArea.create({
    data: {
      slug,
      icon,
      featured: payload.featured,
      published: payload.published,
      order: (maxOrder._max.order ?? -1) + 1,
      t,
    },
  });
  await logAudit({ actorId: user.id, action: "content_item_created", module: MODULE_LABEL, entityId: created.id });
  revalidatePath("/[locale]", "layout");
  return { ok: true, item: toModuleItem(created) };
}

export async function deletePracticeArea(id: string): Promise<SimpleResult> {
  const user = await requireSessionUser();
  await prisma.practiceArea.delete({ where: { id } });
  await logAudit({ actorId: user.id, action: "content_item_deleted", module: MODULE_LABEL, entityId: id });
  revalidatePath("/[locale]", "layout");
  return { ok: true };
}

export async function reorderPracticeAreas(orderedIds: string[]): Promise<SimpleResult> {
  const user = await requireSessionUser();
  await prisma.$transaction(
    orderedIds.map((id, index) => prisma.practiceArea.update({ where: { id }, data: { order: index } })),
  );
  await logAudit({ actorId: user.id, action: "content_reordered", module: MODULE_LABEL });
  revalidatePath("/[locale]", "layout");
  return { ok: true };
}
