import "server-only";
import { Resend } from "resend";

/**
 * E-postaya değen TEK dosya. Üstteki hiçbir modül Resend'i görmez — yalnızca `sendMail`'i ve
 * `MailResult`'ı bilir. Sağlayıcı değiştirmek (ör. Postmark'a geçmek) bu dosyayı değiştirmek
 * olur. `lib/ai/provider.ts` ve `lib/media/storage.ts` ile aynı desen.
 *
 * Yapılandırma yoksa çökmez: gönderim yerine sunucu konsoluna yazar ve `skipped` döner.
 * Böylece ne geliştirme ortamı anahtar ister, ne de üretimde anahtar eksikliği ziyaretçinin
 * randevu talebini düşürür.
 */

const FROM_FALLBACK = "YAKA Hukuk <onboarding@resend.dev>";

export type MailResult =
  | { ok: true; id: string | null }
  /** Anahtar yok — gönderim atlandı, akış devam etmeli. */
  | { ok: false; skipped: true }
  | { ok: false; skipped: false; error: string };

export type MailInput = {
  to: string[];
  subject: string;
  /** Düz metin gövde; HTML sürümü buradan üretilir. */
  text: string;
  /** Yanıtla düğmesinin gideceği adres (ör. talebi gönderen ziyaretçi). */
  replyTo?: string;
};

export function isMailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}

/** Gönderen adresi: doğrulanmış alan adı gelene kadar Resend'in test göndericisi. */
function fromAddress(): string {
  return process.env.MAIL_FROM || FROM_FALLBACK;
}

let cached: Resend | undefined;
let cachedKey: string | undefined;

function client(key: string): Resend {
  if (!cached || cachedKey !== key) {
    cached = new Resend(key);
    cachedKey = key;
  }
  return cached;
}

/** Düz metni basit, güvenli bir HTML gövdeye çevirir (satır sonları korunur). */
function toHtml(text: string): string {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return `<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;font-size:15px;line-height:1.6;color:#1C2230;white-space:pre-wrap">${escaped}</div>`;
}

export async function sendMail(input: MailInput): Promise<MailResult> {
  const key = process.env.RESEND_API_KEY;
  const recipients = input.to.map((a) => a.trim()).filter(Boolean);

  if (recipients.length === 0) {
    return { ok: false, skipped: false, error: "Alıcı adresi tanımlı değil." };
  }

  if (!key) {
    console.log(
      `[mailer] RESEND_API_KEY yok — gönderim atlandı.\nKime: ${recipients.join(", ")}\nKonu: ${input.subject}\n${input.text}`,
    );
    return { ok: false, skipped: true };
  }

  try {
    const { data, error } = await client(key).emails.send({
      from: fromAddress(),
      to: recipients,
      subject: input.subject,
      text: input.text,
      html: toHtml(input.text),
      ...(input.replyTo ? { replyTo: input.replyTo } : {}),
    });
    if (error) return { ok: false, skipped: false, error: error.message };
    return { ok: true, id: data?.id ?? null };
  } catch (err) {
    return {
      ok: false,
      skipped: false,
      error: err instanceof Error ? err.message : "E-posta gönderilemedi.",
    };
  }
}
