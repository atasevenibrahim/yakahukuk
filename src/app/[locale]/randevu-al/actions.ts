"use server";

import { headers } from "next/headers";
import { getLocale } from "next-intl/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isSlotAvailable, computeEndTime, dateFromKey } from "@/lib/booking";
import { notifyNewAppointment } from "@/lib/mail/notifications";
import { getPracticeAreasRaw } from "@/content/practice-areas";

const KVKK_TEXT_VERSION = "v1-2026";

const schema = z.object({
  konu: z.string().trim().min(1),
  aciklama: z.string().trim().optional(),
  dateKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  saat: z.string().regex(/^\d{2}:\d{2}$/),
  ad: z.string().trim().min(1),
  telefon: z
    .string()
    .trim()
    .refine((v) => v.replace(/\D/g, "").length >= 10),
  eposta: z.string().trim().email(),
  kvkk: z.literal(true),
});

export type AppointmentFormInput = {
  konu: string;
  aciklama: string;
  dateKey: string;
  saat: string;
  ad: string;
  telefon: string;
  eposta: string;
  kvkk: boolean;
};

export type AppointmentFormResult =
  | { ok: true }
  | { ok: false; errors: Partial<Record<keyof AppointmentFormInput, boolean>>; slotTaken?: boolean };

export async function submitAppointment(
  input: AppointmentFormInput,
): Promise<AppointmentFormResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    const errors: Partial<Record<keyof AppointmentFormInput, boolean>> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (typeof field === "string") errors[field as keyof AppointmentFormInput] = true;
    }
    return { ok: false, errors };
  }

  const data = parsed.data;
  const date = dateFromKey(data.dateKey);

  // Submit anında slotu yeniden doğrula (çift-rezervasyon güvenliği).
  const stillAvailable = await isSlotAvailable(date, data.saat);
  if (!stillAvailable) {
    return { ok: false, errors: {}, slotTaken: true };
  }

  const endTime = await computeEndTime(date, data.saat);
  const [locale, headerList, practiceAreas] = await Promise.all([
    getLocale(),
    headers(),
    getPracticeAreasRaw(),
  ]);
  const matchedArea = practiceAreas.find((a) => a.t.tr.title === data.konu);

  try {
    const created = await prisma.appointment.create({
      data: {
        date,
        startTime: data.saat,
        endTime,
        practiceAreaSlug: matchedArea?.slug ?? null,
        name: data.ad,
        email: data.eposta,
        phone: data.telefon,
        subject: data.konu === "Emin değilim" ? null : data.konu,
        locale,
        kvkkConsent: data.kvkk,
        kvkkTextVersion: KVKK_TEXT_VERSION,
        ip: headerList.get("x-forwarded-for"),
        userAgent: headerList.get("user-agent"),
      },
    });

    // Avukatlara bildirim. `await` YOK: e-posta sağlayıcısı yavaşsa ya da hata verirse
    // ziyaretçi bekletilmemeli — randevu zaten kaydedildi.
    void notifyNewAppointment({
      name: created.name,
      email: created.email,
      phone: created.phone,
      date: created.date,
      startTime: created.startTime,
      subject: created.subject,
      note: data.aciklama,
    });
  } catch {
    // @@unique([date, startTime, status]) ihlali — yarış durumunda slot az önce dolmuş.
    return { ok: false, errors: {}, slotTaken: true };
  }

  return { ok: true };
}
