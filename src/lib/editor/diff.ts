/**
 * Kelime düzeyinde diff — sohbet asistanının önerdiği değişikliği "öncesi/sonrası" olarak
 * göstermek için.
 *
 * Neden kendi kodumuz: ihtiyaç dar (iki kısa metin, kelime düzeyi) ve `markdown.ts` ile aynı
 * gerekçe geçerli — bir diff kütüphanesi bu iş için fazla ağır. Saf fonksiyon olduğu için
 * birim testi kolay.
 *
 * Karakter değil kelime düzeyi tercih edildi: hukuk metninde "sözleşmede" → "sözleşmenizde"
 * gibi bir değişikliği harf harf boyamak okunmuyor; kelimeyi bütün göstermek daha anlaşılır.
 */

export type DiffPart = {
  type: "same" | "added" | "removed";
  text: string;
};

/**
 * Metni kelimelere ve aradaki boşluklara böler. Boşluklar da parça olarak tutulur ki
 * birleştirildiğinde orijinal metin birebir geri gelsin.
 */
function tokenize(text: string): string[] {
  if (!text) return [];
  return text.match(/\s+|[^\s]+/g) ?? [];
}

/** Klasik LCS tablosu. Kısa metinler için (bir paragraf) fazlasıyla yeterli. */
function lcsTable(a: string[], b: string[]): number[][] {
  const table: number[][] = Array.from({ length: a.length + 1 }, () =>
    new Array<number>(b.length + 1).fill(0),
  );
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      table[i][j] = a[i] === b[j] ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }
  return table;
}

/** Ardışık aynı türdeki parçaları birleştirir — render'da gereksiz span üretilmesin. */
function collapse(parts: DiffPart[]): DiffPart[] {
  const out: DiffPart[] = [];
  for (const part of parts) {
    if (!part.text) continue;
    const last = out[out.length - 1];
    if (last && last.type === part.type) last.text += part.text;
    else out.push({ ...part });
  }
  return out;
}

export function diffWords(before: string, after: string): DiffPart[] {
  if (before === after) return before ? [{ type: "same", text: before }] : [];

  const a = tokenize(before);
  const b = tokenize(after);
  const table = lcsTable(a, b);

  const parts: DiffPart[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      parts.push({ type: "same", text: a[i] });
      i += 1;
      j += 1;
    } else if (table[i + 1][j] >= table[i][j + 1]) {
      parts.push({ type: "removed", text: a[i] });
      i += 1;
    } else {
      parts.push({ type: "added", text: b[j] });
      j += 1;
    }
  }
  while (i < a.length) {
    parts.push({ type: "removed", text: a[i] });
    i += 1;
  }
  while (j < b.length) {
    parts.push({ type: "added", text: b[j] });
    j += 1;
  }

  return collapse(parts);
}

/** Özet sayaç — kartın başlığında "3 kelime eklendi, 1 çıkarıldı" demek için. */
export function diffSummary(parts: DiffPart[]): { added: number; removed: number } {
  const count = (text: string) => (text.match(/[^\s]+/g) ?? []).length;
  let added = 0;
  let removed = 0;
  for (const part of parts) {
    if (part.type === "added") added += count(part.text);
    else if (part.type === "removed") removed += count(part.text);
  }
  return { added, removed };
}
