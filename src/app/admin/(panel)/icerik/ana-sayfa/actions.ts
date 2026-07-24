"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSessionUser } from "@/lib/auth/session";
import { logAudit } from "@/lib/auth/audit";

export type ActionResult = { ok: true } | { ok: false; error: string };

export type HomeHeroInput = {
  headline: string;
  subtext: string;
  closingCtaTitle: string;
  closingCtaText: string;
};

export async function saveHomeHero(input: HomeHeroInput): Promise<ActionResult> {
  const user = await requireSessionUser();

  if (!input.headline.trim() || !input.subtext.trim()) {
    return { ok: false, error: "Başlık ve alt metin boş bırakılamaz." };
  }

  const existing = await prisma.homeHero.findFirst();
  if (existing) {
    await prisma.homeHero.update({ where: { id: existing.id }, data: input });
  } else {
    await prisma.homeHero.create({ data: input });
  }

  await logAudit({ actorId: user.id, action: "content_item_updated", module: "İÇERİK/ANA SAYFA-HERO" });
  revalidatePath("/[locale]", "layout");
  return { ok: true };
}
