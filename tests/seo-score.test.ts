import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { analyzeSeo } from "@/lib/seo/score";
import { GOOD_INPUT } from "./helpers/article.ts";

const analyze = (over: Partial<typeof GOOD_INPUT> = {}) => analyzeSeo({ ...GOOD_INPUT, ...over });
const check = (a: ReturnType<typeof analyzeSeo>, id: string) => a.checks.find((c) => c.id === id)!;

describe("analyzeSeo — genel", () => {
  test("skor 0-100 arasında kalır", () => {
    for (const a of [analyze(), analyze({ body: "", title: "", focusKeyword: "" })]) {
      assert.ok(a.score >= 0 && a.score <= 100, `skor aralık dışı: ${a.score}`);
    }
  });

  test("sağlıklı makale yüksek skor alır ve hiç fail denetimi bırakmaz", () => {
    const a = analyze();
    const failed = a.checks.filter((c) => c.status === "fail").map((c) => c.id);
    assert.deepEqual(failed, [], `beklenmeyen fail: ${failed.join(", ")}`);
    assert.ok(a.score >= 85, `beklenen ≥85, gelen ${a.score}`);
  });

  test("boş makale 0 alır — hiçbir denetim 'yokluktan' puan kazandırmamalı", () => {
    const a = analyzeSeo({
      title: "", slug: "", body: "", excerpt: "", metaTitle: "", metaDescription: "",
      focusKeyword: "", baseUrl: "https://yakahukuk.com", faqCount: 5, hasAuthor: false,
    });
    assert.equal(a.score, 0);
  });

  test("kazanılan puan hiçbir denetimde ağırlığı aşmaz", () => {
    for (const c of analyze().checks) {
      assert.ok(c.weight > 0, `${c.id}: ağırlık pozitif olmalı`);
      assert.ok(c.earned <= c.weight, `${c.id}: ${c.earned} > ${c.weight}`);
    }
  });

  test("okuma süresi en az 1 dakika", () => {
    assert.ok(analyze().readMinutes >= 1);
    assert.ok(analyze({ body: "tek kelime" }).readMinutes >= 1);
  });
});

describe("odak anahtar kelime denetimleri", () => {
  test("odak kelime yoksa tek bir 'focus-missing' denetimi olur, alt denetimler olmaz", () => {
    const a = analyze({ focusKeyword: "" });
    assert.equal(check(a, "focus-missing").status, "fail");
    assert.equal(a.checks.find((c) => c.id === "focus-title"), undefined);
  });

  test("odak kelime varsa alt denetimler devreye girer", () => {
    const a = analyze();
    assert.equal(a.checks.find((c) => c.id === "focus-missing"), undefined);
    assert.equal(check(a, "focus-title").status, "ok");
    assert.equal(check(a, "focus-slug").status, "ok");
  });

  test("ilk paragrafta geçmeyen odak kelime yakalanır", () => {
    // İlk paragraftaki TÜM geçişler kaldırılmalı — denetim paragrafın tamamına bakıyor.
    const blocks = GOOD_INPUT.body.split("\n\n");
    blocks[0] = blocks[0].replace(/[Kk]ira artış\w*/g, "bu konu");
    const a = analyze({ body: blocks.join("\n\n") });
    assert.notEqual(check(a, "focus-first-paragraph").status, "ok");
  });
});

describe("SSS ve yazar denetimleri", () => {
  test("SSS yokken uyarı verir ve puan kazandırmaz", () => {
    const c = check(analyze({ faqCount: 0 }), "faq");
    assert.equal(c.status, "warn");
    assert.equal(c.earned, 0);
  });

  test("2 soru yarım, 4 soru tam puan", () => {
    assert.equal(check(analyze({ faqCount: 2 }), "faq").status, "warn");
    assert.equal(check(analyze({ faqCount: 4 }), "faq").status, "ok");
    assert.ok(
      check(analyze({ faqCount: 4 }), "faq").earned > check(analyze({ faqCount: 2 }), "faq").earned,
    );
  });

  test("yazar atanmamışsa puan yok — ikili denetim, yarım puan vermez", () => {
    const c = check(analyze({ hasAuthor: false }), "author");
    assert.equal(c.status, "warn");
    assert.equal(c.earned, 0);
  });

  test("SSS ve yazar eklemek skoru yükseltir", () => {
    const before = analyze({ faqCount: 0, hasAuthor: false }).score;
    const after = analyze({ faqCount: 4, hasAuthor: true }).score;
    assert.ok(after > before, `${after} > ${before} olmalı`);
  });
});

describe("yapı denetimleri", () => {
  test("iç bağlantı: 0 fail, 1 warn, 2+ ok", () => {
    const keepLinks = (n: number) => {
      let seen = 0;
      return GOOD_INPUT.body.replace(/\[([^\]]+)\]\([^)]+\)/g, (m, t) => (++seen > n ? t : m));
    };
    assert.equal(check(analyze({ body: keepLinks(0) }), "internal-links").status, "fail");
    assert.equal(check(analyze({ body: keepLinks(1) }), "internal-links").status, "warn");
    assert.equal(check(analyze(), "internal-links").status, "ok");
  });

  test("ara başlık ve liste sayılır", () => {
    const a = analyze();
    assert.ok(a.headings.length >= 3, `başlık sayısı: ${a.headings.length}`);
    assert.equal(check(a, "list").status, "ok");
  });

  test("başlıktaki yıl işaretlenir — içerik erken eskir; gövdedeki yıl denetlenmez", () => {
    assert.equal(check(analyze(), "title-year").status, "ok");
    assert.equal(check(analyze({ title: "Kira artışı 2026" }), "title-year").status, "fail");
    const withYearInBody = GOOD_INPUT.body + "\n\n2026 yılında yapılan değişiklik.";
    assert.equal(check(analyze({ body: withYearInBody }), "title-year").status, "ok");
  });

  test("kısa metin uzunluk denetiminden kalır", () => {
    assert.equal(check(analyze({ body: "Çok kısa bir metin." }), "word-count").status, "fail");
    assert.equal(check(analyze(), "word-count").status, "ok");
  });
});
