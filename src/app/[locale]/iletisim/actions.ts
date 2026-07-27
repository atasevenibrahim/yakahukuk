"use server";

import { headers } from "next/headers";
import { getLocale } from "next-intl/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { notifyNewMessage } from "@/lib/mail/notifications";

// Aydınlatma Metni sayfası henüz yok; onay kanıtı için sabit bir sürüm etiketi.
const KVKK_TEXT_VERSION = "v1-2026";

const schema = z.object({
  ad: z.string().trim().min(1),
  eposta: z.string().trim().email(),
  telefon: z.string().trim().optional(),
  konu: z.string().trim().min(1),
  mesaj: z.string().trim().min(1),
  kvkk: z.literal(true),
});

export type ContactFormInput = {
  ad: string;
  eposta: string;
  telefon: string;
  konu: string;
  mesaj: string;
  kvkk: boolean;
};

export type ContactFormResult =
  | { ok: true }
  | { ok: false; errors: Partial<Record<keyof ContactFormInput, boolean>> };

export async function submitContactForm(
  input: ContactFormInput,
): Promise<ContactFormResult> {
  const parsed = schema.safeParse(input);

  if (!parsed.success) {
    const errors: Partial<Record<keyof ContactFormInput, boolean>> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (typeof field === "string") {
        errors[field as keyof ContactFormInput] = true;
      }
    }
    return { ok: false, errors };
  }

  const [locale, headerList] = await Promise.all([getLocale(), headers()]);
  const data = parsed.data;

  const created = await prisma.contactMessage.create({
    data: {
      name: data.ad,
      email: data.eposta,
      phone: data.telefon || null,
      subject: data.konu,
      message: data.mesaj,
      locale,
      kvkkConsent: data.kvkk,
      kvkkTextVersion: KVKK_TEXT_VERSION,
      ip: headerList.get("x-forwarded-for"),
      userAgent: headerList.get("user-agent"),
    },
  });

  // Avukatlara bildirim — beklenmeden gönderilir; hata ziyaretçinin formunu düşürmemeli.
  void notifyNewMessage({
    name: created.name,
    email: created.email,
    phone: created.phone,
    subject: created.subject,
    message: created.message,
  });

  return { ok: true };
}
