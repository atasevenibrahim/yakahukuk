/**
 * SSS listesi ↔ düz metin dönüşümü.
 *
 * Sohbet asistanı alanları metin olarak görüp `find`/`replace` ile düzenliyor (bkz.
 * `lib/ai/edit-ops.ts`). SSS'yi de aynı mekanizmaya sokabilmek için soru-cevap çiftleri
 * satır tabanlı basit bir biçime çevriliyor:
 *
 *     S: Anlaşmalı boşanma ne kadar sürer?
 *     C: Protokol hazırsa çoğu zaman tek celsede sonuçlanır.
 *
 * Çiftler boş satırla ayrılır; cevap birden çok satır olabilir. Bu biçim hem model için
 * okunaklı hem de düzenlemesi kolay — JSON döndürtmek `find` alıntılarını kırılganlaştırırdı.
 */

export type FaqPair = { question: string; answer: string };

const QUESTION_PREFIX = "S:";
const ANSWER_PREFIX = "C:";

export function faqToText(items: FaqPair[]): string {
  return items
    .filter((i) => i.question.trim() || i.answer.trim())
    .map((i) => `${QUESTION_PREFIX} ${i.question.trim()}\n${ANSWER_PREFIX} ${i.answer.trim()}`)
    .join("\n\n");
}

export function textToFaq(text: string): FaqPair[] {
  const blocks = text
    .replace(/\r\n?/g, "\n")
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);

  const pairs: FaqPair[] = [];
  for (const block of blocks) {
    const lines = block.split("\n");
    let question = "";
    const answerLines: string[] = [];
    let inAnswer = false;

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith(QUESTION_PREFIX)) {
        question = trimmed.slice(QUESTION_PREFIX.length).trim();
        inAnswer = false;
      } else if (trimmed.startsWith(ANSWER_PREFIX)) {
        answerLines.push(trimmed.slice(ANSWER_PREFIX.length).trim());
        inAnswer = true;
      } else if (inAnswer && trimmed) {
        // Cevabın devam satırı — model uzun cevabı sarmalayabiliyor.
        answerLines.push(trimmed);
      }
    }

    const answer = answerLines.join(" ").trim();
    // Yarım kalmış çift (yalnız soru ya da yalnız cevap) yayına girmemeli; atılır.
    if (question && answer) pairs.push({ question, answer });
  }

  return pairs;
}
