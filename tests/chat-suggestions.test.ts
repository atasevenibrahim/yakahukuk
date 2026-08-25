import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { buildChatSuggestions } from "@/lib/ai/chat-suggestions";
import { analyzeSeo } from "@/lib/seo/score";
import { buildVerificationReport } from "@/lib/ai/citations";
import { GOOD_INPUT } from "./helpers/article.ts";

function suggest(over: Partial<typeof GOOD_INPUT> = {}, faqCount = GOOD_INPUT.faqCount) {
  const input = { ...GOOD_INPUT, ...over, faqCount };
  const analysis = analyzeSeo(input);
  return buildChatSuggestions({
    analysis,
    placeholderCount: buildVerificationReport(input.body).placeholders.length,
    faqCount,
  });
}
const has = (list: ReturnType<typeof suggest>, id: string) => list.some((s) => s.id === id);

describe("buildChatSuggestions", () => {
  test("gövde boşken hiç öneri üretmez", () => {
    assert.deepEqual(suggest({ body: "" }, 0), []);
  });

  test("geçen denetim için öneri üretmez, düşen denetim için üretir", () => {
    assert.equal(has(suggest(), "meta-description"), false);
    assert.equal(has(suggest({ metaDescription: "" }), "meta-description"), true);
  });

  test("SSS önerisi sayıya göre metin değiştirir", () => {
    assert.equal(suggest({}, 0).find((s) => s.id === "faq")!.label, "4 SSS ekle");
    assert.equal(suggest({}, 2).find((s) => s.id === "faq")!.label, "SSS'leri tamamla");
    assert.equal(has(suggest({}, 4), "faq"), false);
  });

  test("odak kelime yoksa öneri çıkar", () => {
    assert.equal(has(suggest({ focusKeyword: "" }), "focus-missing"), true);
  });

  test("doğrulanacak bilgi en üstte listelenir ve sayıyı yazar", () => {
    const body = `${GOOD_INPUT.body}\n\nArtış oranı [DOĞRULANACAK: TÜFE ortalaması] ile sınırlıdır.`;
    const list = suggest({ body });
    assert.equal(list[0].id, "verification");
    assert.equal(list[0].label, "1 doğrulanacak bilgiyi listele");
  });

  test("temiz metinde doğrulama önerisi çıkmaz", () => {
    assert.equal(has(suggest(), "verification"), false);
  });

  test("iç bağlantı: yoksa öneri var, ikisi varken yok", () => {
    const noLinks = GOOD_INPUT.body.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
    assert.equal(has(suggest({ body: noLinks }), "internal-links"), true);
    assert.equal(has(suggest(), "internal-links"), false);
  });

  test("en fazla 5 öneri, id'ler benzersiz, hepsinin metni dolu", () => {
    const list = suggest(
      { metaDescription: "", metaTitle: "", excerpt: "", focusKeyword: "", body: "Kısa metin. [DOĞRULANACAK: oran] burada." },
      0,
    );
    assert.ok(list.length > 0 && list.length <= 5, `öneri sayısı: ${list.length}`);
    assert.equal(new Set(list.map((s) => s.id)).size, list.length);
    for (const s of list) {
      assert.ok(s.label.trim().length > 0, `${s.id}: etiket boş`);
      assert.ok(s.prompt.trim().length > 20, `${s.id}: talimat çok kısa`);
      assert.ok(!/undefined|NaN/.test(s.prompt), `${s.id}: talimatta yer tutucu kalmış`);
    }
  });

  test("sıra etkiye göre: doğrulama → meta → SSS", () => {
    const body = `${GOOD_INPUT.body}\n\nOran [DOĞRULANACAK: TÜFE] kadardır.`;
    const ids = suggest({ body, metaDescription: "" }, 0).map((s) => s.id);
    assert.ok(ids.indexOf("verification") < ids.indexOf("meta-description"));
    assert.ok(ids.indexOf("meta-description") < ids.indexOf("faq"));
  });

  test("geçen hiçbir denetim öneri üretmez — asıl değişmez bu", () => {
    const input = { ...GOOD_INPUT };
    const analysis = analyzeSeo(input);
    const okIds = new Set(analysis.checks.filter((c) => c.status === "ok").map((c) => c.id));
    for (const s of suggest()) {
      assert.ok(!okIds.has(s.id), `"${s.id}" denetimi geçiyor ama yine de öneri üretti`);
    }
  });

  test("sağlıklı makalede yalnızca gerçekten düşen denetim önerilir", () => {
    // Örnek makale 96/100 alıyor; tek uyarısı okunabilirlik (Türkçe hukuk metninde beklenir).
    assert.deepEqual(suggest().map((s) => s.id), ["readability"]);
  });
});
