import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { ApiError } from "@google/genai";
import { classify, AiError } from "@/lib/ai/provider";

/** Gerçek Gemini yanıt gövdelerinin birebir kopyası — canlı testlerde yakalandı. */
const REAL_INVALID_KEY_BODY =
  '{"error":{"code":400,"message":"API key not valid. Please pass a valid API key.","status":"INVALID_ARGUMENT"}}';
const REAL_RPM_BODY =
  '{"error":{"code":429,"message":"... Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 5, model: gemini-3.6-flash. Please retry in 22.831559269s","status":"RESOURCE_EXHAUSTED","details":[{"@type":"type.googleapis.com/google.rpc.QuotaFailure","violations":[{"quotaId":"GenerateRequestsPerMinutePerProjectPerModel-FreeTier"}]}]}}';
const REAL_RPD_BODY =
  '{"error":{"code":429,"message":"You exceeded your current quota...","status":"RESOURCE_EXHAUSTED","details":[{"@type":"type.googleapis.com/google.rpc.QuotaFailure","violations":[{"quotaId":"GenerateRequestsPerDayPerProjectPerModel-FreeTier","quotaValue":"20"}]}]}}';

describe("classify — geçersiz API anahtarı (asıl kusur)", () => {
  test("400 + API_KEY_INVALID gövdesi 'auth' sınıfına gider, 'invalid' DEĞİL", () => {
    const err = new ApiError({ message: REAL_INVALID_KEY_BODY, status: 400 });
    const result = classify(err);
    assert.equal(result.kind, "auth", "eski davranış 'invalid' verip admini yanlış yere gönderiyordu");
    assert.match(result.userMessage, /anahtar/i);
  });

  test("sıradan 400 (biçim hatası, anahtar sorunu değil) hâlâ 'invalid' kalır", () => {
    const err = new ApiError({ message: '{"error":{"code":400,"message":"Invalid JSON payload"}}', status: 400 });
    assert.equal(classify(err).kind, "invalid");
  });

  test("gerçek 401/403 hâlâ doğrudan 'auth'", () => {
    assert.equal(classify(new ApiError({ message: "forbidden", status: 401 })).kind, "auth");
    assert.equal(classify(new ApiError({ message: "forbidden", status: 403 })).kind, "auth");
  });
});

describe("classify — günlük/dakikalık kota ayrımı (asıl kusur)", () => {
  test("RPM (dakikalık) 429 'quota' sınıfına gider, 'günlük' demez", () => {
    const err = new ApiError({ message: REAL_RPM_BODY, status: 429 });
    const result = classify(err);
    assert.equal(result.kind, "quota");
    assert.doesNotMatch(result.userMessage, /günlük/i, "eski mesaj dakikalık limitte de 'günlük' diyordu");
  });

  test("RPD (günlük) 429 'quota-daily' sınıfına gider", () => {
    const err = new ApiError({ message: REAL_RPD_BODY, status: 429 });
    const result = classify(err);
    assert.equal(result.kind, "quota-daily");
    assert.match(result.userMessage, /günlük/i);
    assert.doesNotMatch(result.userMessage, /birkaç dakika/i, "günlük kotada 'birkaç dakika' yanıltıcı");
  });

  test("quotaId belirsizse (eski SDK sürümü vb.) güvenli varsayılan: 'quota' (kısa süreli)", () => {
    const err = new ApiError({ message: '{"error":{"code":429,"message":"rate limited"}}', status: 429 });
    assert.equal(classify(err).kind, "quota");
  });
});

describe("classify — diğer sınıflar bozulmadı", () => {
  test("5xx 'transient'", () => {
    assert.equal(classify(new ApiError({ message: "unavailable", status: 503 })).kind, "transient");
  });

  test("AiError zaten sınıflandırılmışsa aynen döner", () => {
    const original = new AiError("blocked", "test");
    assert.equal(classify(original), original);
  });

  test("mesaj tabanlı çıkarım (ApiError'a sarılmamış) hâlâ çalışıyor", () => {
    assert.equal(classify(new Error("RESOURCE_EXHAUSTED: too many requests")).kind, "quota");
  });

  test("bilinmeyen hata 'transient'", () => {
    assert.equal(classify(new Error("garip bir şey")).kind, "transient");
  });
});
