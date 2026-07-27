import "server-only";
import { BASE_URL } from "@/lib/metadata";
import { getSiteSettings } from "@/lib/site-settings";
import { logAudit } from "@/lib/auth/audit";
import { sendMail } from "./mailer";

/**
 * Avukatlara giden operasyonel bildirimler.
 *
 * İYS kapsamı DIŞINDA: bunlar firmanın kendi personeline yaptığı operasyonel bildirimler,
 * ticari elektronik ileti değil. (Halka açık bülten farklı — bkz. lib/newsletter/consent.ts.)
 *
 * Hiçbiri ziyaretçinin isteğini bloklamamalı: gönderim başarısız olsa da randevu/mesaj
 * kaydedilmiş olur, hata yalnızca loglanır. Bu yüzden çağıranlar `void notify…()` ile çağırır
 * ve dönüşü beklemez.
 */

const DATE_FMT = new Intl.DateTimeFormat("tr-TR", {
  timeZone: "Europe/Istanbul",
  day: "2-digit",
  month: "long",
  year: "numeric",
});

async function deliver(subject: string, text: string, replyTo?: string): Promise<void> {
  try {
    const settings = await getSiteSettings();
    const to = settings.notificationEmails.filter(Boolean);
    if (to.length === 0) return;

    const result = await sendMail({ to, subject, text, replyTo });
    if (result.ok) {
      await logAudit({
        action: "notification_sent",
        module: "BİLDİRİM",
        detail: `${to.length} alıcı · ${subject}`,
      });
    } else if (!result.skipped) {
      console.error(`[bildirim] gönderilemedi: ${result.error}`);
    }
  } catch (err) {
    // Bildirim ikincil bir işlev; buradaki hiçbir hata çağıranın akışına yansımamalı.
    console.error("[bildirim] beklenmeyen hata", err);
  }
}

export async function notifyNewAppointment(input: {
  name: string;
  email: string;
  phone: string;
  date: Date;
  startTime: string;
  subject: string | null;
  note?: string | null;
}): Promise<void> {
  const lines = [
    "Yeni randevu talebi geldi.",
    "",
    `Ad Soyad: ${input.name}`,
    `Telefon: ${input.phone}`,
    `E-posta: ${input.email}`,
    `Tarih: ${DATE_FMT.format(input.date)} · ${input.startTime}`,
    `Konu: ${input.subject ?? "Belirtilmedi"}`,
    input.note?.trim() ? `Açıklama: ${input.note.trim()}` : "",
    "",
    `Panelde görüntüle: ${BASE_URL}/admin/randevular`,
  ].filter(Boolean);

  await deliver(`Yeni randevu talebi — ${input.name}`, lines.join("\n"), input.email);
}

export async function notifyNewMessage(input: {
  name: string;
  email: string;
  phone?: string | null;
  subject: string;
  message: string;
}): Promise<void> {
  const lines = [
    "Yeni iletişim mesajı geldi.",
    "",
    `Ad Soyad: ${input.name}`,
    `E-posta: ${input.email}`,
    input.phone?.trim() ? `Telefon: ${input.phone.trim()}` : "",
    `Konu: ${input.subject}`,
    "",
    input.message,
    "",
    `Panelde görüntüle: ${BASE_URL}/admin/gelen-talepler`,
  ].filter(Boolean);

  await deliver(`Yeni mesaj — ${input.subject}`, lines.join("\n"), input.email);
}

/** Şifre sıfırlama bağlantısı — alıcı bir avukat/yönetici, bildirim listesi değil. */
export async function sendPasswordResetMail(input: {
  to: string;
  name: string;
  token: string;
}): Promise<void> {
  const link = `${BASE_URL}/admin/giris?resetToken=${input.token}`;
  const text = [
    `Merhaba ${input.name},`,
    "",
    "YAKA Hukuk yönetim paneli için şifre sıfırlama talebinde bulundunuz.",
    "Aşağıdaki bağlantı 30 dakika geçerlidir:",
    "",
    link,
    "",
    "Bu talebi siz yapmadıysanız bu e-postayı yok sayın; şifreniz değişmez.",
  ].join("\n");

  const result = await sendMail({ to: [input.to], subject: "Şifre sıfırlama bağlantısı", text });
  if (!result.ok && result.skipped) {
    // Anahtar yokken akış yarım kalmasın: bağlantı konsola düşer (geliştirme davranışı).
    console.log(`[dev-logger] Şifre sıfırlama bağlantısı (${input.to}): ${link}`);
  } else if (!result.ok) {
    console.error(`[bildirim] şifre sıfırlama e-postası gönderilemedi: ${result.error}`);
  }
}
