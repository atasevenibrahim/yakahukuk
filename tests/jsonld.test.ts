import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { breadcrumbSchema, collectionSchema, faqSchema } from "@/lib/seo/jsonld";

describe("collectionSchema — kategori/etiket arşivleri", () => {
  const schema = collectionSchema({
    name: "AİLE HUKUKU makaleleri",
    description: "Aile hukuku alanındaki yazılar.",
    url: "https://yakahukuk.com/tr/makaleler/kategori/aile-hukuku",
    locale: "tr",
    items: [
      { title: "Birinci", url: "https://yakahukuk.com/tr/makaleler/bir" },
      { title: "İkinci", url: "https://yakahukuk.com/tr/makaleler/iki" },
    ],
  });

  test("CollectionPage + ItemList tipini basar", () => {
    assert.equal(schema["@type"], "CollectionPage");
    assert.equal(schema.mainEntity["@type"], "ItemList");
  });

  test("öğe sayısını ve sırasını bildirir", () => {
    assert.equal(schema.mainEntity.numberOfItems, 2);
    assert.equal(schema.mainEntity.itemListElement[0].position, 1);
    assert.equal(schema.mainEntity.itemListElement[1].position, 2);
  });

  test("dili basar", () => {
    assert.equal(schema.inLanguage, "tr");
  });

  test("boş arşiv geçerli şema üretir", () => {
    const empty = collectionSchema({
      name: "x", description: "y", url: "z", locale: "tr", items: [],
    });
    assert.equal(empty.mainEntity.numberOfItems, 0);
    assert.deepEqual(empty.mainEntity.itemListElement, []);
  });
});

describe("breadcrumbSchema", () => {
  test("kırıntıları sırayla numaralar", () => {
    const b = breadcrumbSchema([
      { name: "Ana Sayfa", url: "https://yakahukuk.com/tr" },
      { name: "Makaleler", url: "https://yakahukuk.com/tr/makaleler" },
      { name: "Yazı", url: "https://yakahukuk.com/tr/makaleler/yazi" },
    ]);
    assert.equal(b["@type"], "BreadcrumbList");
    assert.equal(b.itemListElement.length, 3);
    assert.equal(b.itemListElement[0].position, 1);
    assert.equal(b.itemListElement[2].position, 3);
  });

  test("boş liste çökmez", () => {
    assert.deepEqual(breadcrumbSchema([]).itemListElement, []);
  });
});

describe("faqSchema", () => {
  test("soru-cevapları FAQPage olarak basar", () => {
    const f = faqSchema([
      { question: "Ne kadar sürer?", answer: "Tek celsede biter." },
      { question: "Avukat şart mı?", answer: "Zorunlu değil." },
    ]);
    assert.equal(f["@type"], "FAQPage");
    assert.equal(f.mainEntity.length, 2);
    assert.equal(f.mainEntity[0]["@type"], "Question");
    assert.equal(f.mainEntity[0].acceptedAnswer["@type"], "Answer");
    assert.equal(f.mainEntity[0].name, "Ne kadar sürer?");
  });

  test("boş SSS listesi boş mainEntity verir", () => {
    assert.deepEqual(faqSchema([]).mainEntity, []);
  });
});
