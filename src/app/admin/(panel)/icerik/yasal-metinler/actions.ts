"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSessionUser } from "@/lib/auth/session";
import { logAudit } from "@/lib/auth/audit";
import { linesToSections } from "@/lib/admin/content-fields";
import type { SavePayload, SaveResult, SimpleResult } from "@/components/admin/content/ContentModuleBrowser";
import { toModuleItem } from "./mapper";

const MODULE_LABEL = "İÇERİK/YASAL METİNLER";

export async function saveLegalDocument(payload: SavePayload): Promise<SaveResult> {
  if (!payload.id) return { ok: false, error: "Yasal belgeler yalnızca düzenlenebilir, yeni belge eklenemez." };
  const user = await requireSessionUser();
  const title = payload.tr.title?.trim();
  if (!title) return { ok: false, error: "Başlık boş bırakılamaz." };

  const trBlock = {
    tabLabel: payload.tr.tabLabel?.trim() || title,
    tag: payload.tr.tag?.trim() || "",
    title,
    intro: payload.tr.intro ?? "",
    sections: linesToSections(payload.tr.sections ?? ""),
  };
  const hasEn = Object.values(payload.en).some((v) => v.trim());
  const t = hasEn
    ? {
        tr: trBlock,
        en: {
          tabLabel: payload.en.tabLabel || trBlock.tabLabel,
          tag: payload.en.tag || trBlock.tag,
          title: payload.en.title || title,
          intro: payload.en.intro ?? "",
          sections: linesToSections(payload.en.sections ?? ""),
        },
      }
    : { tr: trBlock };

  const updated = await prisma.legalDocument.update({
    where: { id: payload.id },
    data: { t, updatedAt: new Date() },
  });
  await logAudit({ actorId: user.id, action: "content_item_updated", module: MODULE_LABEL, entityId: updated.id });
  revalidatePath("/[locale]", "layout");
  return { ok: true, item: toModuleItem(updated) };
}

export async function deleteLegalDocument(): Promise<SimpleResult> {
  return { ok: false, error: "Yasal belgeler silinemez." };
}

export async function reorderLegalDocuments(orderedIds: string[]): Promise<SimpleResult> {
  const user = await requireSessionUser();
  await prisma.$transaction(
    orderedIds.map((id, index) => prisma.legalDocument.update({ where: { id }, data: { order: index } })),
  );
  await logAudit({ actorId: user.id, action: "content_reordered", module: MODULE_LABEL });
  revalidatePath("/[locale]", "layout");
  return { ok: true };
}
