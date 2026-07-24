"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSessionUser } from "@/lib/auth/session";
import { logAudit } from "@/lib/auth/audit";
import type { SavePayload, SaveResult, SimpleResult } from "@/components/admin/content/ContentModuleBrowser";
import { toModuleItem } from "./mapper";

const MODULE_LABEL = "İÇERİK/YORUMLAR";

export async function saveTestimonial(payload: SavePayload): Promise<SaveResult> {
  const user = await requireSessionUser();
  const quote = payload.tr.quote?.trim();
  if (!quote) return { ok: false, error: "Yorum metni boş bırakılamaz." };
  const initials = payload.top.initials?.trim();
  if (!initials) return { ok: false, error: "İsim / rumuz boş bırakılamaz." };

  const hasEn = Object.values(payload.en).some((v) => v.trim());
  const t = hasEn ? { tr: { quote }, en: { quote: payload.en.quote || quote } } : { tr: { quote } };

  const rating = Math.max(1, Math.min(5, Number.parseInt(payload.top.rating, 10) || 5));

  const data = {
    practiceAreaSlug: payload.top.practiceAreaSlug || "",
    areaLabel: payload.top.areaLabel?.trim() || "",
    initials,
    monthLabel: payload.top.monthLabel?.trim() || "",
    rating,
    published: payload.published,
    t,
  };

  if (payload.id) {
    const updated = await prisma.testimonial.update({ where: { id: payload.id }, data });
    await logAudit({ actorId: user.id, action: "content_item_updated", module: MODULE_LABEL, entityId: updated.id });
    revalidatePath("/[locale]", "layout");
    return { ok: true, item: toModuleItem(updated) };
  }

  const maxOrder = await prisma.testimonial.aggregate({ _max: { order: true } });
  const created = await prisma.testimonial.create({
    data: { ...data, order: (maxOrder._max.order ?? -1) + 1 },
  });
  await logAudit({ actorId: user.id, action: "content_item_created", module: MODULE_LABEL, entityId: created.id });
  revalidatePath("/[locale]", "layout");
  return { ok: true, item: toModuleItem(created) };
}

export async function deleteTestimonial(id: string): Promise<SimpleResult> {
  const user = await requireSessionUser();
  await prisma.testimonial.delete({ where: { id } });
  await logAudit({ actorId: user.id, action: "content_item_deleted", module: MODULE_LABEL, entityId: id });
  revalidatePath("/[locale]", "layout");
  return { ok: true };
}

export async function reorderTestimonials(orderedIds: string[]): Promise<SimpleResult> {
  const user = await requireSessionUser();
  await prisma.$transaction(
    orderedIds.map((id, index) => prisma.testimonial.update({ where: { id }, data: { order: index } })),
  );
  await logAudit({ actorId: user.id, action: "content_reordered", module: MODULE_LABEL });
  revalidatePath("/[locale]", "layout");
  return { ok: true };
}
