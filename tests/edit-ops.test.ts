import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  applyEdit,
  checkEdit,
  checkEdits,
  joinBlocks,
  numberedBlocks,
  splitBlocks,
  type ArticleFields,
} from "@/lib/ai/edit-ops";

const FIELDS: ArticleFields = {
  body: "Giriş paragrafı.\n\n## Başlık\n\nİkinci paragraf burada.\n\nÜçüncü paragraf.",
  title: "Kira artışı nasıl hesaplanır?",
  excerpt: "Kısa özet.",
  metaTitle: "Meta başlık",
  metaDescription: "Meta açıklama",
  tags: "kira, artış",
  focusKeyword: "kira artışı",
  faq: "",
};

describe("blok işlemleri", () => {
  test("splitBlocks / joinBlocks gidiş-dönüş kayıpsız", () => {
    assert.equal(joinBlocks(splitBlocks(FIELDS.body)), FIELDS.body);
  });

  test("boş satırlar blok sınırı sayılır", () => {
    assert.equal(splitBlocks(FIELDS.body).length, 4);
  });

  test("numberedBlocks her bloğa sıra numarası verir", () => {
    const numbered = numberedBlocks(FIELDS.body);
    assert.match(numbered, /\b0\b/);
    assert.ok(numbered.includes("Giriş paragrafı."));
  });

  test("boş gövde çökmez", () => {
    assert.deepEqual(splitBlocks(""), []);
    assert.equal(joinBlocks([]), "");
  });
});

describe("checkEdit — uygulamadan önce doğrulama", () => {
  test("bulunan metin için ok döner", () => {
    const c = checkEdit(
      { target: "title", find: "nasıl hesaplanır", replace: "nasıl hesaplanıyor", reason: "üslup" },
      FIELDS,
    );
    assert.equal(c.status.ok, true);
  });

  test("bulunmayan metin 'not-found' verir", () => {
    const c = checkEdit({ target: "title", find: "olmayan ifade", replace: "x", reason: "t" }, FIELDS);
    assert.equal(c.status.ok, false);
    if (!c.status.ok) assert.equal(c.status.problem, "not-found");
  });

  test("bir alanda iki kez geçen metin 'ambiguous' verir", () => {
    const fields = { ...FIELDS, excerpt: "kira kira" };
    const c = checkEdit({ target: "excerpt", find: "kira", replace: "yeni", reason: "t" }, fields);
    assert.equal(c.status.ok, false);
    if (!c.status.ok) assert.equal(c.status.problem, "ambiguous");
  });

  test("gövde hedefinde blok numarası zorunlu", () => {
    const c = checkEdit({ target: "body", find: "Giriş", replace: "x", reason: "t" }, FIELDS);
    assert.equal(c.status.ok, false);
    if (!c.status.ok) assert.equal(c.status.problem, "bad-block");
  });

  test("geçersiz blok numarası 'bad-block' verir", () => {
    const c = checkEdit({ target: "body", block: 99, find: "Giriş", replace: "x", reason: "t" }, FIELDS);
    assert.equal(c.status.ok, false);
    if (!c.status.ok) assert.equal(c.status.problem, "bad-block");
  });

  test("gövdede belirsizlik BLOK İÇİNDE değerlendirilir", () => {
    // Aynı ifade iki AYRI blokta geçiyorsa sorun değil — blok numarası zaten ayırıyor.
    const twoBlocks = { ...FIELDS, body: "aynı metin\n\naynı metin" };
    const ok = checkEdit(
      { target: "body", block: 0, find: "aynı metin", replace: "y", reason: "t" },
      twoBlocks,
    );
    assert.equal(ok.status.ok, true);

    // Tek blokta iki kez geçiyorsa hangisi kastedildiği belirsizdir.
    const oneBlock = { ...FIELDS, body: "aynı metin ve yine aynı metin" };
    const c = checkEdit(
      { target: "body", block: 0, find: "aynı metin", replace: "y", reason: "t" },
      oneBlock,
    );
    assert.equal(c.status.ok, false);
    if (!c.status.ok) assert.equal(c.status.problem, "ambiguous");
  });

  test("ok durumunda öncesi/sonrası metni taşır", () => {
    const c = checkEdit({ target: "excerpt", find: "Kısa", replace: "Uzun", reason: "t" }, FIELDS);
    assert.equal(c.status.ok, true);
    if (c.status.ok) {
      assert.equal(c.status.before, "Kısa özet.");
      assert.equal(c.status.after, "Uzun özet.");
    }
  });

  test("find boşsa alanın tamamı değiştirilir", () => {
    const c = checkEdit({ target: "excerpt", find: "", replace: "Yepyeni özet.", reason: "t" }, FIELDS);
    assert.equal(c.status.ok, true);
    if (c.status.ok) assert.equal(c.status.after, "Yepyeni özet.");
  });
});

describe("checkEdits — toplu", () => {
  test("her düzenleme tek tek değerlendirilir", () => {
    const results = checkEdits(
      [
        { target: "title", find: "nasıl", replace: "ne şekilde", reason: "a" },
        { target: "title", find: "yok", replace: "x", reason: "b" },
      ],
      FIELDS,
    );
    assert.equal(results.length, 2);
    assert.equal(results[0].status.ok, true);
    assert.equal(results[1].status.ok, false);
  });
});

describe("applyEdit", () => {
  test("yalnızca hedef alanı değiştirir", () => {
    const next = applyEdit({ target: "excerpt", find: "Kısa", replace: "Uzun", reason: "t" }, FIELDS);
    assert.ok(next);
    assert.equal(next!.excerpt, "Uzun özet.");
    assert.equal(next!.title, FIELDS.title, "başlık dokunulmadan kalmalı");
    assert.equal(next!.body, FIELDS.body, "gövde dokunulmadan kalmalı");
  });

  test("uygulanamayan düzenlemede null döner — metin sessizce bozulmaz", () => {
    assert.equal(applyEdit({ target: "title", find: "yok", replace: "x", reason: "t" }, FIELDS), null);
  });

  test("özgün nesneyi mutasyona uğratmaz", () => {
    const snapshot = JSON.stringify(FIELDS);
    applyEdit({ target: "excerpt", find: "Kısa", replace: "Uzun", reason: "t" }, FIELDS);
    assert.equal(JSON.stringify(FIELDS), snapshot);
  });

  test("gövdede blok hedefli düzenleme diğer blokları korur", () => {
    const next = applyEdit(
      { target: "body", block: 2, find: "İkinci", replace: "Değişmiş", reason: "t" },
      FIELDS,
    );
    assert.ok(next);
    assert.ok(next!.body.includes("Değişmiş paragraf burada."));
    assert.ok(next!.body.includes("Giriş paragrafı."));
    assert.ok(next!.body.includes("Üçüncü paragraf."));
  });
});
