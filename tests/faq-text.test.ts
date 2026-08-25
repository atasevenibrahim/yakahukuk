import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { faqToText, textToFaq, type FaqPair } from "@/lib/ai/faq-text";

const PAIRS: FaqPair[] = [
  { question: "Anlaşmalı boşanma ne kadar sürer?", answer: "Protokol hazırsa tek celsede biter." },
  { question: "Avukat şart mı?", answer: "Zorunlu değil ama protokolün denetlenmesi önemli." },
];

describe("faqToText / textToFaq", () => {
  test("gidiş-dönüş kayıpsız", () => {
    assert.deepEqual(textToFaq(faqToText(PAIRS)), PAIRS);
  });

  test("S:/C: biçimini kullanır ve çiftleri boş satırla ayırır", () => {
    const text = faqToText(PAIRS);
    assert.equal(text.split("\n")[0], "S: Anlaşmalı boşanma ne kadar sürer?");
    assert.equal(text.split("\n\n").length, 2);
  });

  test("boş girdiler boş çıktı verir", () => {
    assert.equal(faqToText([]), "");
    assert.deepEqual(textToFaq(""), []);
    assert.deepEqual(textToFaq("   \n\n  "), []);
  });

  test("yarım kalmış çiftler yayına girmez", () => {
    assert.deepEqual(textToFaq("S: Soru?"), []);
    assert.deepEqual(textToFaq("C: Cevap."), []);
  });

  test("modelin sarmaladığı çok satırlı cevap tek cevapta birleşir", () => {
    assert.deepEqual(textToFaq("S: Soru?\nC: İlk satır\nikinci satır"), [
      { question: "Soru?", answer: "İlk satır ikinci satır" },
    ]);
  });

  test("boş çiftler yazılmaz", () => {
    assert.equal(faqToText([{ question: "", answer: "" }, PAIRS[0]]), faqToText([PAIRS[0]]));
  });

  test("Türkçe karakterler korunur", () => {
    const parsed = textToFaq("S: Şüpheli ifadesi?\nC: Müdafi hakkı vardır.");
    assert.equal(parsed[0].question, "Şüpheli ifadesi?");
    assert.equal(parsed[0].answer, "Müdafi hakkı vardır.");
  });
});
