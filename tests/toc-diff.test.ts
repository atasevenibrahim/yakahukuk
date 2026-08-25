import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { buildToc, headingId } from "@/lib/seo/toc";
import { diffSummary, diffWords } from "@/lib/editor/diff";

describe("headingId", () => {
  test("Türkçe başlığı çapaya çevirir", () => {
    assert.equal(headingId("İtiraz Yolu", new Set()), "itiraz-yolu");
  });

  test("aynı başlık iki kez geçerse çapalar çakışmaz", () => {
    const used = new Set<string>();
    const a = headingId("Sonuç", used);
    used.add(a);
    const b = headingId("Sonuç", used);
    assert.notEqual(a, b, "ikinci çapa benzersiz olmalı");
  });

  test("harfsiz başlıkta da kullanılabilir bir çapa üretir", () => {
    assert.match(headingId("???", new Set()), /^[a-z0-9-]+$/);
  });
});

describe("buildToc", () => {
  const md = [
    "Giriş metni.",
    "## Birinci bölüm",
    "İçerik.",
    "### Alt başlık",
    "İçerik.",
    "## İkinci bölüm",
    "İçerik.",
  ].join("\n\n");

  test("başlıkları sırayla toplar", () => {
    const toc = buildToc(md);
    assert.equal(toc.length, 3);
    assert.equal(toc[0].text, "Birinci bölüm");
    assert.equal(toc[2].text, "İkinci bölüm");
  });

  test("başlık seviyesini korur", () => {
    const toc = buildToc(md);
    assert.equal(toc[0].level, 2);
    assert.equal(toc[1].level, 3);
  });

  test("her girdinin benzersiz id'si olur", () => {
    const toc = buildToc(md);
    assert.equal(new Set(toc.map((t) => t.id)).size, toc.length);
  });

  test("başlıksız metinde boş liste", () => {
    assert.deepEqual(buildToc("Yalnızca düz metin."), []);
    assert.deepEqual(buildToc(""), []);
  });

  test("kod bloğu içindeki # başlık sayılmaz", () => {
    const withCode = "Metin.\n\n```\n## sahte başlık\n```\n\n## gerçek başlık";
    const toc = buildToc(withCode);
    assert.equal(toc.length, 1);
    assert.equal(toc[0].text, "gerçek başlık");
  });
});

describe("diffWords / diffSummary", () => {
  test("değişmeyen metinde tek 'same' parça", () => {
    const parts = diffWords("aynı metin", "aynı metin");
    assert.ok(parts.every((p) => p.type === "same"));
    assert.deepEqual(diffSummary(parts), { added: 0, removed: 0 });
  });

  test("eklenen kelime 'added' sayılır", () => {
    const s = diffSummary(diffWords("bir iki", "bir iki üç"));
    assert.equal(s.added, 1);
    assert.equal(s.removed, 0);
  });

  test("silinen kelime 'removed' sayılır", () => {
    const s = diffSummary(diffWords("bir iki üç", "bir iki"));
    assert.equal(s.removed, 1);
    assert.equal(s.added, 0);
  });

  test("değiştirilen kelime hem ekleme hem silme üretir", () => {
    const s = diffSummary(diffWords("kira artışı", "kira bedeli"));
    assert.ok(s.added > 0 && s.removed > 0);
  });

  test("boştan doluya geçiş tamamen ekleme", () => {
    const s = diffSummary(diffWords("", "yeni metin"));
    assert.equal(s.removed, 0);
    assert.ok(s.added > 0);
  });

  test("parçalar birleştirilince sonuç metnini verir", () => {
    const parts = diffWords("bir iki üç", "bir dört üç");
    const after = parts.filter((p) => p.type !== "removed").map((p) => p.text).join("");
    assert.equal(after.replace(/\s+/g, " ").trim(), "bir dört üç");
  });
});
