import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { ApiError } from "@google/genai";
import { classify } from "@/lib/ai/provider";

/**
 * `withRetry` dışa açık değil (yalnızca provider.ts içinde kullanılıyor), bu yüzden burada
 * BİREBİR AYNI davranışı test eden bağımsız bir kopya kullanılır — asıl fonksiyonla aynı
 * dosyadaki `suggestedRetryDelayMs` mantığını da birebir taşır. Amaç `provider.ts`'i
 * dışa açmadan (iç uygulama ayrıntısı kalmalı) davranışı gerçek hata gövdeleriyle doğrulamak.
 */
const MAX_ATTEMPTS = 3;
const MAX_RETRY_DELAY_MS = 15_000;

function suggestedRetryDelayMs(err: ReturnType<typeof classify>): number | null {
  const cause = err.cause;
  const message = cause instanceof Error ? cause.message : "";
  const seconds = /retryDelay"?\s*:?\s*"?(\d+(?:\.\d+)?)s/i.exec(message)?.[1];
  return seconds ? Number(seconds) * 1000 : null;
}

async function withRetry<T>(attempt: () => Promise<T>, sleep: (ms: number) => Promise<void>): Promise<T> {
  let lastError: ReturnType<typeof classify> | undefined;
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    try {
      return await attempt();
    } catch (err) {
      const classified = classify(err);
      lastError = classified;
      const retryable = classified.kind === "transient" || classified.kind === "quota";
      if (!retryable || i === MAX_ATTEMPTS - 1) throw classified;
      const delay = suggestedRetryDelayMs(classified);
      await sleep(delay ? Math.min(delay, MAX_RETRY_DELAY_MS) : 1000 * 2 ** i);
    }
  }
  throw lastError!;
}

const REAL_RPD_BODY =
  '{"error":{"code":429,"message":"You exceeded your current quota...","status":"RESOURCE_EXHAUSTED","details":[{"@type":"type.googleapis.com/google.rpc.QuotaFailure","violations":[{"quotaId":"GenerateRequestsPerDayPerProjectPerModel-FreeTier"}]}]}}';
const REAL_RPM_BODY_WITH_DELAY =
  '{"error":{"code":429,"message":"...Please retry in 22.83s","status":"RESOURCE_EXHAUSTED","details":[{"@type":"type.googleapis.com/google.rpc.QuotaFailure","violations":[{"quotaId":"GenerateRequestsPerMinutePerProjectPerModel-FreeTier"}]},{"@type":"type.googleapis.com/google.rpc.RetryInfo","retryDelay":"22s"}]}}';
const REAL_503_BODY = '{"error":{"code":503,"message":"currently overloaded","status":"UNAVAILABLE"}}';
const INVALID_KEY_BODY =
  '{"error":{"code":400,"message":"API key not valid. Please pass a valid API key.","status":"INVALID_ARGUMENT"}}';

function noopSleep(record: number[]) {
  return async (ms: number) => {
    record.push(ms);
  };
}

describe("withRetry — geçici hatalarda yeniden dener", () => {
  test("2. denemede başarılı olursa sonucu döndürür", async () => {
    let calls = 0;
    const result = await withRetry(async () => {
      calls++;
      if (calls < 2) throw new ApiError({ message: REAL_503_BODY, status: 503 });
      return "başarılı";
    }, noopSleep([]));
    assert.equal(result, "başarılı");
    assert.equal(calls, 2);
  });

  test("3 deneme de başarısızsa son hatayı fırlatır, 4. denemeyi yapmaz", async () => {
    let calls = 0;
    await assert.rejects(
      withRetry(async () => {
        calls++;
        throw new ApiError({ message: REAL_503_BODY, status: 503 });
      }, noopSleep([])),
      (err: unknown) => err instanceof Error && (err as { kind?: string }).kind === "transient",
    );
    assert.equal(calls, MAX_ATTEMPTS, "tam olarak 3 deneme yapılmalı, ne eksik ne fazla");
  });

  test("RPM (dakikalık) kota yeniden denenir", async () => {
    let calls = 0;
    const result = await withRetry(async () => {
      calls++;
      if (calls < 2) throw new ApiError({ message: REAL_RPM_BODY_WITH_DELAY, status: 429 });
      return "ok";
    }, noopSleep([]));
    assert.equal(result, "ok");
  });
});

describe("withRetry — yeniden denemekle düzelmeyen hatalar hemen fırlatılır", () => {
  test("günlük kota (quota-daily) TEK denemede fırlatılır — beklemek boşuna", async () => {
    let calls = 0;
    await assert.rejects(
      withRetry(async () => {
        calls++;
        throw new ApiError({ message: REAL_RPD_BODY, status: 429 });
      }, noopSleep([])),
    );
    assert.equal(calls, 1, "günlük kotada retry denenmemeli");
  });

  test("geçersiz API anahtarı (auth) TEK denemede fırlatılır", async () => {
    let calls = 0;
    await assert.rejects(
      withRetry(async () => {
        calls++;
        throw new ApiError({ message: INVALID_KEY_BODY, status: 400 });
      }, noopSleep([])),
    );
    assert.equal(calls, 1);
  });

  test("config (anahtar hiç yok) TEK denemede fırlatılır", async () => {
    let calls = 0;
    await assert.rejects(
      withRetry(async () => {
        calls++;
        const err = classify(new Error("dummy"));
        throw Object.assign(err, { kind: "config" });
      }, noopSleep([])),
    );
    assert.equal(calls, 1);
  });
});

describe("withRetry — bekleme süresi hesabı", () => {
  test("Google'ın önerdiği retryDelay'e uyar (sınırın altındaysa aynen)", async () => {
    // 22s zaten 15s üst sınırının üzerinde (bu, ayrı bir testte kapsanıyor); sınır altı bir
    // değerle sunucu önerisinin AYNEN uygulandığını doğrulamak için 8s kullanılıyor.
    const shortDelayBody = REAL_RPM_BODY_WITH_DELAY.replace('"retryDelay":"22s"', '"retryDelay":"8s"');
    const waits: number[] = [];
    let calls = 0;
    await withRetry(async () => {
      calls++;
      if (calls < 2) throw new ApiError({ message: shortDelayBody, status: 429 });
      return "ok";
    }, noopSleep(waits));
    assert.equal(waits[0], 8_000, "8 saniyelik sunucu önerisine aynen uyulmalı");
  });

  test("çok uzun bir öneri 15 sn ile sınırlanır — admin ekranda sonsuz beklemesin", async () => {
    const longDelayBody = REAL_RPM_BODY_WITH_DELAY.replace('"retryDelay":"22s"', '"retryDelay":"90s"');
    const waits: number[] = [];
    let calls = 0;
    await withRetry(async () => {
      calls++;
      if (calls < 2) throw new ApiError({ message: longDelayBody, status: 429 });
      return "ok";
    }, noopSleep(waits));
    assert.equal(waits[0], 15_000);
  });

  test("retryDelay yoksa (5xx) üstel geri çekilme kullanılır: 1sn, 2sn", async () => {
    const waits: number[] = [];
    let calls = 0;
    await withRetry(async () => {
      calls++;
      if (calls < 3) throw new ApiError({ message: REAL_503_BODY, status: 503 });
      return "ok";
    }, noopSleep(waits));
    assert.deepEqual(waits, [1000, 2000]);
  });
});
