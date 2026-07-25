import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Depolamaya değen TEK dosya. Üstteki hiçbir modül Supabase tiplerini görmez —
 * yalnızca `uploadImage` / `deleteImage` ve `MediaError`'ı bilir. Sağlayıcı değiştirmek
 * (ör. Vercel Blob'a geçmek) bu dosyayı değiştirmek olur. `lib/ai/provider.ts` ile aynı desen.
 */

const BUCKET = "media";

/** Kabul edilen görsel türleri. Sunucu tarafında zorunlu — istemci kontrolü güvenlik değil. */
export const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/avif"] as const;
export const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export type MediaErrorKind = "config" | "too-large" | "bad-type" | "upload-failed" | "not-found";

export class MediaError extends Error {
  readonly kind: MediaErrorKind;
  readonly userMessage: string;

  constructor(kind: MediaErrorKind, userMessage: string, options?: { cause?: unknown }) {
    super(userMessage, options);
    this.name = "MediaError";
    this.kind = kind;
    this.userMessage = userMessage;
  }
}

const MESSAGES: Record<MediaErrorKind, string> = {
  config:
    "Medya depolaması henüz yapılandırılmamış (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY eksik).",
  "too-large": `Dosya çok büyük. En fazla ${MAX_BYTES / 1024 / 1024} MB yükleyebilirsiniz.`,
  "bad-type": "Yalnızca JPEG, PNG, WebP ve AVIF görselleri yüklenebilir.",
  "upload-failed": "Dosya yüklenemedi. Bağlantınızı kontrol edip tekrar deneyin.",
  "not-found": "Dosya bulunamadı.",
};

function mediaError(kind: MediaErrorKind, cause?: unknown): MediaError {
  return new MediaError(kind, MESSAGES[kind], { cause });
}

let cached: SupabaseClient | undefined;
let cachedKey: string | undefined;

/**
 * İstemciyi tembel kurar — modül yüklenirken anahtar aramaz, aksi hâlde anahtar yokken
 * `next build` çöker.
 *
 * `service_role` anahtarı kullanılır: tam yetkilidir ve YALNIZCA sunucuda çalışır. Bu dosya
 * hiçbir client bileşeninden import edilmemeli.
 */
function client(): SupabaseClient {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) throw mediaError("config");

  if (!cached || cachedKey !== key) {
    cached = createClient(url, key, { auth: { persistSession: false } });
    cachedKey = key;
  }
  return cached;
}

/** Depolama yapılandırılmış mı — arayüz buna göre uyarı gösterir. */
export function isStorageConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL?.trim() && process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());
}

function safeName(filename: string): string {
  const dot = filename.lastIndexOf(".");
  const base = (dot === -1 ? filename : filename.slice(0, dot))
    .toLocaleLowerCase("en-US")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  const ext = dot === -1 ? "" : filename.slice(dot).toLocaleLowerCase("en-US");
  return `${base || "gorsel"}${ext}`;
}

export type UploadResult = {
  path: string;
  url: string;
  filename: string;
  mimeType: string;
  size: number;
};

export async function uploadImage(file: File): Promise<UploadResult> {
  if (!ALLOWED_MIME.includes(file.type as (typeof ALLOWED_MIME)[number])) {
    throw mediaError("bad-type");
  }
  if (file.size > MAX_BYTES) throw mediaError("too-large");

  const supabase = client();
  // Yol çakışmasın diye tarih klasörü + rastgele önek; aynı adlı iki dosya birbirini ezmez.
  const stamp = new Date().toISOString().slice(0, 7); // YYYY-MM
  const unique = crypto.randomUUID().slice(0, 8);
  const path = `${stamp}/${unique}-${safeName(file.name)}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw mediaError("upload-failed", error);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return {
    path,
    url: data.publicUrl,
    filename: file.name,
    mimeType: file.type,
    size: file.size,
  };
}

export async function deleteImage(path: string): Promise<void> {
  const supabase = client();
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  // Dosya zaten yoksa hata sayılmaz — DB kaydını temizlemeye devam edilmeli.
  if (error) throw mediaError("upload-failed", error);
}
