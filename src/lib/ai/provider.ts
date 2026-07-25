import { ApiError, GoogleGenAI, ThinkingLevel } from "@google/genai";
import type { z } from "zod";
import { toJSONSchema } from "zod";

/**
 * Sağlayıcıya değen TEK dosya. Üstteki hiçbir modül `@google/genai` tiplerini görmez —
 * yalnızca `complete()` / `completeStream()` ve `AiError`'ı bilir. Sağlayıcı değiştirmek
 * (ör. Anthropic'e geçmek) bu dosyayı ve `AI_MODEL` env değişkenini değiştirmek olur.
 *
 * Model seçimi: Gemini'nin ücretsiz katmanı süresiz ve kredi kartı istemiyor; `gemini-3.6-flash`
 * ücretsiz katmandaki güncel stable model. Kotalar Google tarafından garanti EDİLMİYOR, bu yüzden
 * 429 ayrı bir hata sınıfı olarak ele alınıp kullanıcıya anlaşılır şekilde gösteriliyor.
 */

const DEFAULT_MODEL = "gemini-3.6-flash";

export type AiUsage = {
  promptTokens: number;
  outputTokens: number;
  totalTokens: number;
};

export type AiErrorKind =
  /** Ortam değişkeni eksik/yanlış — kullanıcı hatası değil, kurulum hatası. */
  | "config"
  /** Ücretsiz kota doldu (429) ya da eşzamanlılık limiti. */
  | "quota"
  /** Model güvenlik süzgeci yanıtı engelledi. */
  | "blocked"
  /** Model geçersiz/eksik JSON döndürdü. */
  | "invalid"
  /** Ağ hatası, 5xx, zaman aşımı — tekrar denenebilir. */
  | "transient";

/**
 * Panelde doğrudan gösterilebilecek Türkçe bir mesaj taşır. Amaç: dış servis düşerse ekran
 * çökmesin, form içeriği kaybolmasın — `safeQuery`'nin içerik tarafında yaptığının AI karşılığı.
 */
export class AiError extends Error {
  readonly kind: AiErrorKind;
  readonly userMessage: string;

  constructor(kind: AiErrorKind, userMessage: string, options?: { cause?: unknown }) {
    super(userMessage, options);
    this.name = "AiError";
    this.kind = kind;
    this.userMessage = userMessage;
  }
}

const USER_MESSAGES: Record<AiErrorKind, string> = {
  config:
    "Yapay zeka servisi henüz yapılandırılmamış (GEMINI_API_KEY eksik). Ayarlar tamamlanana kadar makaleleri elle yazabilirsiniz.",
  quota:
    "Günlük ücretsiz kota dolmuş görünüyor. Birkaç dakika sonra tekrar deneyin — yazdıklarınız kaybolmadı.",
  blocked:
    "Model bu konuyu yanıtlamayı reddetti. Konuyu daha nötr bir dille yeniden yazıp tekrar deneyin.",
  invalid:
    "Yapay zeka beklenen biçimde yanıt vermedi. Tekrar üretmeyi deneyin; sorun sürerse konuyu kısaltın.",
  transient:
    "Yapay zeka servisine şu an ulaşılamıyor. Birkaç saniye sonra tekrar deneyin — yazdıklarınız kaybolmadı.",
};

function aiError(kind: AiErrorKind, cause?: unknown): AiError {
  return new AiError(kind, USER_MESSAGES[kind], { cause });
}

/** SDK/ağ hatasını sınıflandırır. Bilinmeyen her şey `transient` sayılır (tekrar denenebilir). */
function classify(err: unknown): AiError {
  if (err instanceof AiError) return err;

  if (err instanceof ApiError) {
    if (err.status === 429) return aiError("quota", err);
    // 401/403: anahtar geçersiz ya da yetkisiz — kurulum sorunu, tekrar denemek çözmez.
    if (err.status === 401 || err.status === 403) return aiError("config", err);
    if (err.status === 400) return aiError("invalid", err);
    return aiError("transient", err);
  }

  // ApiError'a sarılmamış durumlar için mesajdan çıkarım (SDK sürümleri arasında değişebiliyor).
  const message = err instanceof Error ? err.message : String(err);
  if (/RESOURCE_EXHAUSTED|\b429\b|quota/i.test(message)) return aiError("quota", err);
  return aiError("transient", err);
}

let cachedClient: GoogleGenAI | undefined;
let cachedKey: string | undefined;

/**
 * İstemciyi tembel kurar. Modül yüklenirken anahtar aramaz — aksi hâlde `next build` sırasında
 * anahtar yoksa derleme çöker (`prisma.config.ts`'te tam bu hatayı bir kez yaşadık).
 */
function client(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) throw aiError("config");

  // Anahtar değişirse (dev'de .env.local düzenlenmesi) istemci yenilenir.
  if (!cachedClient || cachedKey !== apiKey) {
    cachedClient = new GoogleGenAI({ apiKey });
    cachedKey = apiKey;
  }
  return cachedClient;
}

function model(): string {
  return process.env.AI_MODEL?.trim() || DEFAULT_MODEL;
}

export type ThinkingEffort = "minimal" | "low" | "medium" | "high";

const THINKING: Record<ThinkingEffort, ThinkingLevel> = {
  minimal: ThinkingLevel.MINIMAL,
  low: ThinkingLevel.LOW,
  medium: ThinkingLevel.MEDIUM,
  high: ThinkingLevel.HIGH,
};

function usageOf(meta: { promptTokenCount?: number; candidatesTokenCount?: number; totalTokenCount?: number } | undefined): AiUsage {
  return {
    promptTokens: meta?.promptTokenCount ?? 0,
    outputTokens: meta?.candidatesTokenCount ?? 0,
    totalTokens: meta?.totalTokenCount ?? 0,
  };
}

/**
 * Gemini `responseJsonSchema` alanında gerçek JSON Schema kabul ediyor ama desteklenen alt küme
 * sınırlı — `$schema` gibi meta anahtarlar gönderilmemeli. zod 4'ün ürettiği şemadan bunlar
 * ayıklanır.
 */
function jsonSchemaOf(schema: z.ZodType): unknown {
  const raw = toJSONSchema(schema, { io: "output" }) as Record<string, unknown>;
  const cleaned = { ...raw };
  delete cleaned.$schema;
  return cleaned;
}

export type CompleteOptions<T> = {
  system: string;
  prompt: string;
  schema: z.ZodType<T>;
  temperature?: number;
  thinking?: ThinkingEffort;
  maxOutputTokens?: number;
  signal?: AbortSignal;
};

/** Yapılandırılmış (şemaya uyan) tek seferlik üretim. */
export async function complete<T>(options: CompleteOptions<T>): Promise<{ value: T; usage: AiUsage }> {
  const ai = client();

  let raw: Awaited<ReturnType<typeof ai.models.generateContent>>;
  try {
    raw = await ai.models.generateContent({
      model: model(),
      contents: options.prompt,
      config: {
        systemInstruction: options.system,
        responseMimeType: "application/json",
        responseJsonSchema: jsonSchemaOf(options.schema),
        temperature: options.temperature ?? 0.8,
        thinkingConfig: { thinkingLevel: THINKING[options.thinking ?? "low"] },
        maxOutputTokens: options.maxOutputTokens,
        abortSignal: options.signal,
      },
    });
  } catch (err) {
    throw classify(err);
  }

  const text = raw.text;
  if (!text) {
    // Boş yanıt neredeyse her zaman güvenlik süzgeci ya da kesilmiş üretimdir.
    const blocked =
      raw.promptFeedback?.blockReason ||
      raw.candidates?.[0]?.finishReason === "SAFETY" ||
      raw.candidates?.[0]?.finishReason === "PROHIBITED_CONTENT";
    throw aiError(blocked ? "blocked" : "invalid", raw.candidates?.[0]?.finishReason);
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(text);
  } catch (err) {
    throw aiError("invalid", err);
  }

  const parsed = options.schema.safeParse(parsedJson);
  if (!parsed.success) throw aiError("invalid", parsed.error);

  return { value: parsed.data, usage: usageOf(raw.usageMetadata) };
}

export type StreamOptions = {
  system: string;
  prompt: string;
  temperature?: number;
  thinking?: ThinkingEffort;
  maxOutputTokens?: number;
  signal?: AbortSignal;
  /** Akış bittiğinde token kullanımını bildirir (AuditLog'a yazmak için). */
  onUsage?: (usage: AiUsage) => void;
};

/**
 * Serbest metin (markdown gövde) üretimi — parça parça gelir. Uzun çıktıda istek zaman aşımına
 * düşmesin ve kullanıcı metnin yazıldığını görsün diye akış kullanılır.
 */
export async function* completeStream(options: StreamOptions): AsyncGenerator<string> {
  const ai = client();

  let stream: Awaited<ReturnType<typeof ai.models.generateContentStream>>;
  try {
    stream = await ai.models.generateContentStream({
      model: model(),
      contents: options.prompt,
      config: {
        systemInstruction: options.system,
        temperature: options.temperature ?? 0.8,
        thinkingConfig: { thinkingLevel: THINKING[options.thinking ?? "medium"] },
        maxOutputTokens: options.maxOutputTokens,
        abortSignal: options.signal,
      },
    });
  } catch (err) {
    throw classify(err);
  }

  let emitted = false;
  let lastUsage: AiUsage | undefined;

  try {
    for await (const chunk of stream) {
      if (chunk.usageMetadata) lastUsage = usageOf(chunk.usageMetadata);
      const text = chunk.text;
      if (text) {
        emitted = true;
        yield text;
      }
    }
  } catch (err) {
    throw classify(err);
  }

  if (!emitted) throw aiError("blocked");
  if (lastUsage) options.onUsage?.(lastUsage);
}
