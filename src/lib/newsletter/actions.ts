"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { NEWSLETTER_CONSENT_VERSION } from "@/lib/newsletter/consent";

/**
 * Bülten kaydı.
 *
 * Kayıt alınıyor, GÖNDERİM YAPILMIYOR (bkz. lib/newsletter/consent.ts). Onay anının kanıtı
 * (metin sürümü, zaman, IP, user-agent) İYS kaydında istenebildiği için birlikte saklanıyor.
 */

const schema = z.object({
  eposta: z.string().trim().toLowerCase().email(),
  onay: z.literal(true),
});

export type NewsletterInput = { eposta: string; onay: boolean };
export type NewsletterResult = { ok: true; alreadySubscribed: boolean } | { ok: false; error: string };

export async function subscribeNewsletter(input: NewsletterInput): Promise<NewsletterResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: input.onay
        ? "Geçerli bir e-posta adresi girin."
        : "Devam etmek için onay kutusunu işaretleyin.",
    };
  }

  const headerList = await headers();
  const { eposta } = parsed.data;

  try {
    const existing = await prisma.newsletterSubscriber.findUnique({ where: { email: eposta } });

    // Daha önce ayrılmış biri yeniden kaydolabilmeli; kayıt silinmiyor, onay tazeleniyor.
    if (existing) {
      if (!existing.unsubscribedAt) return { ok: true, alreadySubscribed: true };
      await prisma.newsletterSubscriber.update({
        where: { email: eposta },
        data: {
          unsubscribedAt: null,
          consentAt: new Date(),
          consentVersion: NEWSLETTER_CONSENT_VERSION,
          ip: headerList.get("x-forwarded-for"),
          userAgent: headerList.get("user-agent"),
        },
      });
      return { ok: true, alreadySubscribed: false };
    }

    await prisma.newsletterSubscriber.create({
      data: {
        email: eposta,
        consentVersion: NEWSLETTER_CONSENT_VERSION,
        ip: headerList.get("x-forwarded-for"),
        userAgent: headerList.get("user-agent"),
      },
    });
    return { ok: true, alreadySubscribed: false };
  } catch {
    return { ok: false, error: "Kayıt şu anda alınamadı. Lütfen daha sonra tekrar deneyin." };
  }
}
