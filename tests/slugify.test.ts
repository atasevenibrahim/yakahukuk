import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { slugify, uniqueSlug } from "@/lib/admin/slugify";

describe("slugify", () => {
  test("Türkçe harfleri ASCII karşılığına indirir", () => {
    assert.equal(slugify("ÇOCUĞUN ÜSTÜN YARARI"), "cocugun-ustun-yarari");
    assert.equal(slugify("İfade Şüphesi"), "ifade-suphesi");
    assert.equal(slugify("Poliçe Reddi"), "police-reddi");
  });

  test("büyük/küçük yazım aynı slug'ı verir — etiket arşivleri bu sayede birleşiyor", () => {
    assert.equal(slugify("KİRA ARTIŞI"), slugify("Kira Artışı"));
    assert.equal(slugify("kira artışı"), slugify("Kira ARTIŞI"));
  });

  test("yalnızca URL güvenli karakter üretir", () => {
    for (const input of ["POLİÇE REDDİ", "AYIPLI MAL", "Şirket Kuruluşu!", "a  b??c"]) {
      assert.match(slugify(input), /^[a-z0-9-]+$/, `başarısız: ${input}`);
    }
  });

  test("baştaki/sondaki ve tekrar eden ayırıcıları temizler", () => {
    assert.equal(slugify("  merhaba   dünya  "), "merhaba-dunya");
    assert.equal(slugify("--a--b--"), "a-b");
  });

  test("harfsiz girdide genel bir yedek döner", () => {
    assert.ok(slugify("!!!").length > 0);
    assert.match(slugify("!!!"), /^[a-z0-9-]+$/);
  });
});

describe("uniqueSlug", () => {
  test("çakışma yoksa temel slug'ı korur", () => {
    assert.equal(uniqueSlug("kira-artisi", new Set()), "kira-artisi");
  });

  test("çakışmada sayı ekler", () => {
    const used = new Set(["kira-artisi"]);
    const next = uniqueSlug("kira-artisi", used);
    assert.notEqual(next, "kira-artisi");
    assert.ok(next.startsWith("kira-artisi"));
  });

  test("art arda çakışmalarda hep yeni bir değer üretir", () => {
    const used = new Set<string>();
    const produced: string[] = [];
    for (let i = 0; i < 5; i++) {
      const s = uniqueSlug("ayni-baslik", used);
      produced.push(s);
      used.add(s);
    }
    assert.equal(new Set(produced).size, 5, "üretilen slug'lar benzersiz olmalı");
  });
});
