import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  buildVerificationReport,
  checkPublishGate,
  findCitations,
  findPlaceholders,
  uniqueCitations,
} from "@/lib/ai/citations";

describe("findPlaceholders", () => {
  test("[DOĞRULANACAK] işaretçilerini bulur", () => {
    const found = findPlaceholders("Süre [DOĞRULANACAK: iki hafta] kadardır.");
    assert.equal(found.length, 1);
  });

  test("birden fazla işaretçiyi ayrı ayrı sayar", () => {
    const t = "[DOĞRULANACAK: a] ve [DOĞRULANACAK: b] ile [DOĞRULANACAK: c]";
    assert.equal(findPlaceholders(t).length, 3);
  });

  test("temiz metinde hiç bulmaz", () => {
    assert.deepEqual(findPlaceholders("Tamamen doğrulanmış bir metin."), []);
  });
});

describe("findCitations — hukuk metninde doğrulanması gereken iddialar", () => {
  test("kanun maddesi yakalanır", () => {
    assert.ok(findCitations("TMK 166. madde uyarınca").length > 0);
  });

  test("süre ifadesi yakalanır", () => {
    assert.ok(findCitations("Dava 2 hafta içinde açılmalıdır.").length > 0);
  });

  test("oran yakalanır", () => {
    assert.ok(findCitations("Artış %25 ile sınırlıdır.").length > 0);
  });

  test("iddiasız metinde bulgu çıkmaz", () => {
    assert.deepEqual(findCitations("Bu süreç iletişimle çözülebilir."), []);
  });

  test("her bulgunun kararlı bir anahtarı ve türü olur", () => {
    for (const c of findCitations("TMK 166 uyarınca 2 hafta içinde %25 artış")) {
      assert.ok(c.key.length > 0);
      assert.ok(c.match.length > 0);
      assert.ok(["madde", "kanun", "karar", "oran", "sure", "para"].includes(c.kind));
    }
  });
});

describe("uniqueCitations", () => {
  test("aynı iddia iki yerde geçse tek satır olur", () => {
    const dup = findCitations("2 hafta içinde. Yine 2 hafta içinde.");
    const uniq = uniqueCitations(dup);
    assert.equal(new Set(uniq.map((c) => c.key)).size, uniq.length);
    assert.ok(uniq.length <= dup.length);
  });
});

describe("checkPublishGate — yayın kapısı", () => {
  const dirty = "Dava [DOĞRULANACAK: süre] içinde açılır.";

  test("işaretçi varken yayına izin vermez", () => {
    assert.equal(checkPublishGate(dirty, []).ok, false);
  });

  test("temiz ve onaylı metin geçer", () => {
    assert.equal(checkPublishGate("Bu metin genel bilgilendirmedir.", []).ok, true);
  });

  test("iddia onaylanmadan geçmez, onaylanınca geçer", () => {
    const text = "Artış %25 ile sınırlıdır.";
    const keys = findCitations(text).map((c) => c.key);
    assert.equal(checkPublishGate(text, []).ok, false);
    assert.equal(checkPublishGate(text, keys).ok, true);
  });

  test("reddedince sebep bildirir", () => {
    const gate = checkPublishGate(dirty, []);
    assert.equal(gate.ok, false);
    if (!gate.ok) assert.ok(gate.reason.length > 0);
  });
});

describe("buildVerificationReport", () => {
  test("işaretçi ve iddiaları birlikte döndürür", () => {
    const r = buildVerificationReport("TMK 166 uyarınca [DOĞRULANACAK: süre] içinde.");
    assert.equal(r.placeholders.length, 1);
    assert.ok(r.citations.length > 0);
  });

  test("boş metinde ikisi de boş", () => {
    const r = buildVerificationReport("");
    assert.deepEqual(r.placeholders, []);
    assert.deepEqual(r.citations, []);
  });
});
