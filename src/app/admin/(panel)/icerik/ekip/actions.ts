"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSessionUser } from "@/lib/auth/session";
import { logAudit } from "@/lib/auth/audit";
import { slugify, uniqueSlug } from "@/lib/admin/slugify";
import { linesToArray, linesToEducation } from "@/lib/admin/content-fields";
import type { SavePayload, SaveResult, SimpleResult } from "@/components/admin/content/ContentModuleBrowser";
import { toModuleItem } from "./mapper";

const MODULE_LABEL = "İÇERİK/EKİP";

export async function saveTeamMember(payload: SavePayload): Promise<SaveResult> {
  const user = await requireSessionUser();
  const name = payload.top.name?.trim();
  if (!name) return { ok: false, error: "Ad soyad boş bırakılamaz." };

  const trBlock = {
    role: payload.tr.role ?? "",
    roleShort: payload.tr.roleShort ?? "",
    bio: linesToArray(payload.tr.bio ?? ""),
    education: linesToEducation(payload.tr.education ?? ""),
  };
  const hasEn = Object.values(payload.en).some((v) => v.trim());
  const t = hasEn
    ? {
        tr: trBlock,
        en: {
          role: payload.en.role ?? "",
          roleShort: payload.en.roleShort ?? "",
          bio: linesToArray(payload.en.bio ?? ""),
          education: linesToEducation(payload.en.education ?? ""),
        },
      }
    : { tr: trBlock };

  const existingRows = await prisma.teamMember.findMany({ select: { id: true, slug: true } });
  const existingSlugs = new Set(existingRows.filter((r) => r.id !== payload.id).map((r) => r.slug));
  const slug = uniqueSlug(slugify(payload.top.slug || name), existingSlugs);

  const data = {
    slug,
    name,
    bar: payload.top.bar || "Ankara Barosu",
    tags: linesToArray(payload.top.tags ?? ""),
    areas: linesToArray(payload.top.areas ?? ""),
    languages: linesToArray(payload.top.languages ?? ""),
    articleSlugs: linesToArray(payload.top.articleSlugs ?? ""),
    portraitUrl: payload.top.portraitUrl?.trim() || null,
    published: payload.published,
    t,
  };

  if (payload.id) {
    const updated = await prisma.teamMember.update({ where: { id: payload.id }, data });
    await logAudit({ actorId: user.id, action: "content_item_updated", module: MODULE_LABEL, entityId: updated.id });
    revalidatePath("/[locale]", "layout");
    return { ok: true, item: toModuleItem(updated) };
  }

  const maxOrder = await prisma.teamMember.aggregate({ _max: { order: true } });
  const created = await prisma.teamMember.create({
    data: { ...data, order: (maxOrder._max.order ?? -1) + 1 },
  });
  await logAudit({ actorId: user.id, action: "content_item_created", module: MODULE_LABEL, entityId: created.id });
  revalidatePath("/[locale]", "layout");
  return { ok: true, item: toModuleItem(created) };
}

export async function deleteTeamMember(id: string): Promise<SimpleResult> {
  const user = await requireSessionUser();
  await prisma.teamMember.delete({ where: { id } });
  await logAudit({ actorId: user.id, action: "content_item_deleted", module: MODULE_LABEL, entityId: id });
  revalidatePath("/[locale]", "layout");
  return { ok: true };
}

export async function reorderTeamMembers(orderedIds: string[]): Promise<SimpleResult> {
  const user = await requireSessionUser();
  await prisma.$transaction(
    orderedIds.map((id, index) => prisma.teamMember.update({ where: { id }, data: { order: index } })),
  );
  await logAudit({ actorId: user.id, action: "content_reordered", module: MODULE_LABEL });
  revalidatePath("/[locale]", "layout");
  return { ok: true };
}
