"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSessionUser } from "@/lib/auth/session";
import { logAudit } from "@/lib/auth/audit";

export type ActionResult = { ok: true } | { ok: false; error: string };

export type GeneralSettingsInput = {
  phone: string;
  email: string;
  address: string;
  hoursLabel: string;
  notificationEmails: string[];
  notifySound: boolean;
  seoTitle: string;
  seoDescription: string;
};

export async function saveGeneralSettings(input: GeneralSettingsInput): Promise<ActionResult> {
  const user = await requireSessionUser();

  if (!input.phone.trim() || !input.email.trim() || !input.seoTitle.trim()) {
    return { ok: false, error: "Telefon, e-posta ve SEO başlığı boş bırakılamaz." };
  }

  const existing = await prisma.siteSettings.findFirst();
  if (existing) {
    await prisma.siteSettings.update({ where: { id: existing.id }, data: input });
  } else {
    await prisma.siteSettings.create({ data: input });
  }

  await logAudit({ actorId: user.id, action: "site_settings_updated", module: "AYARLAR" });

  // Footer + İletişim/Ekip/Çalışma Alanı detay sayfaları [locale] layout'unu paylaşıyor —
  // tek çağrıyla hepsi tazelenir (dinamik slug'ları tek tek saymaya gerek yok).
  revalidatePath("/[locale]", "layout");
  revalidatePath("/admin/ayarlar");
  return { ok: true };
}
