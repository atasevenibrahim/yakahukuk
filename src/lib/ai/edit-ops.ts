/**
 * Sohbet asistanının önerdiği düzenlemelerin doğrulanması ve uygulanması.
 *
 * Tasarım: yapay zeka serbest metin (yeniden yazılmış makale) DÖNDÜRMEZ; hedef alanı, blok
 * numarasını ve o blokta birebir geçen alıntıyı içeren yapılandırılmış düzenlemeler döndürür.
 *
 * Neden hem blok numarası hem alıntı: yalnızca numaraya güvenmek modelin sayma hatasına açık;
 * yalnızca serbest metin eşleşmesine güvenmek ise aynı ifade birden çok yerde geçtiğinde
 * yanlış yeri değiştirir. İkisi birlikte kullanıldığında numara aramayı daraltır, alıntı da
 * doğrular.
 *
 * Hiçbir düzenleme sessizce düşmez: uygulanamayanlar sebebiyle birlikte raporlanır.
 */

export const EDIT_TARGETS = [
  "body",
  "title",
  "excerpt",
  "metaTitle",
  "metaDescription",
  "tags",
  "focusKeyword",
  /** Soru-cevap çiftleri düz metin olarak (bkz. lib/ai/faq-text.ts). */
  "faq",
] as const;

export type EditTarget = (typeof EDIT_TARGETS)[number];

export type ProposedEdit = {
  target: EditTarget;
  /** Yalnızca `body` için: kaçıncı blok (0-tabanlı). */
  block?: number;
  /** Hedefte birebir geçmesi gereken metin. Boşsa tüm alan `replace` ile değiştirilir. */
  find: string;
  /** Yerine gelecek metin. Boş string silme demektir. */
  replace: string;
  reason: string;
};

export type EditStatus =
  | { ok: true; before: string; after: string }
  /** `find` hedefte hiç geçmiyor — metin bu arada değişmiş olabilir. */
  | { ok: false; problem: "not-found" }
  /** `find` birden çok kez geçiyor; hangisi olduğu belirsiz. */
  | { ok: false; problem: "ambiguous"; count: number }
  /** Blok numarası metindeki blok sayısının dışında. */
  | { ok: false; problem: "bad-block" };

export type CheckedEdit = ProposedEdit & { status: EditStatus };

export const PROBLEM_LABELS: Record<"not-found" | "ambiguous" | "bad-block", string> = {
  "not-found": "Aranan metin bulunamadı — makale bu arada değişmiş olabilir.",
  ambiguous: "Aranan metin birden fazla yerde geçiyor; hangisi olduğu belirsiz.",
  "bad-block": "Belirtilen bölüm makalede yok.",
};

/**
 * Gövdeyi bloklara ayırır. `parseMarkdown` ile AYNI kuralı kullanır (boş satır ayracı), böylece
 * modele verdiğimiz numaralar kullanıcının gördüğü yapıyla örtüşür.
 */
export function splitBlocks(markdown: string): string[] {
  return markdown
    .replace(/\r\n?/g, "\n")
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);
}

export function joinBlocks(blocks: string[]): string {
  return blocks.filter((b) => b.trim()).join("\n\n");
}

/** Modele gönderilecek numaralı gövde dökümü. */
export function numberedBlocks(markdown: string): string {
  return splitBlocks(markdown)
    .map((block, i) => `[${i}] ${block}`)
    .join("\n\n");
}

function countOccurrences(haystack: string, needle: string): number {
  if (!needle) return 0;
  let count = 0;
  let index = haystack.indexOf(needle);
  while (index !== -1) {
    count += 1;
    index = haystack.indexOf(needle, index + needle.length);
  }
  return count;
}

export type ArticleFields = Record<Exclude<EditTarget, "body">, string> & { body: string };

/** Tek bir düzenlemeyi, hiçbir şey değiştirmeden, uygulanabilir mi diye sınar. */
export function checkEdit(edit: ProposedEdit, fields: ArticleFields): CheckedEdit {
  if (edit.target === "body") {
    const blocks = splitBlocks(fields.body);
    const index = edit.block ?? -1;
    if (index < 0 || index >= blocks.length) {
      return { ...edit, status: { ok: false, problem: "bad-block" } };
    }
    const block = blocks[index];

    // `find` boşsa bloğun tamamı değiştirilir.
    if (!edit.find) {
      return { ...edit, status: { ok: true, before: block, after: edit.replace } };
    }

    const count = countOccurrences(block, edit.find);
    if (count === 0) return { ...edit, status: { ok: false, problem: "not-found" } };
    if (count > 1) return { ...edit, status: { ok: false, problem: "ambiguous", count } };

    return {
      ...edit,
      status: { ok: true, before: block, after: block.replace(edit.find, edit.replace) },
    };
  }

  const current = fields[edit.target] ?? "";
  if (!edit.find) {
    return { ...edit, status: { ok: true, before: current, after: edit.replace } };
  }
  const count = countOccurrences(current, edit.find);
  if (count === 0) return { ...edit, status: { ok: false, problem: "not-found" } };
  if (count > 1) return { ...edit, status: { ok: false, problem: "ambiguous", count } };
  return {
    ...edit,
    status: { ok: true, before: current, after: current.replace(edit.find, edit.replace) },
  };
}

export function checkEdits(edits: ProposedEdit[], fields: ArticleFields): CheckedEdit[] {
  return edits.map((edit) => checkEdit(edit, fields));
}

/**
 * Onaylanan tek bir düzenlemeyi uygular ve YENİ alan kümesini döner (girdiyi değiştirmez).
 *
 * Her uygulama öncesi yeniden `checkEdit` çalışır: kullanıcı kartları istediği sırayla
 * onaylayabilir ve önceki bir uygulama metni kaydırmış olabilir. Uygulanamaz hâle gelmişse
 * `null` döner ve arayüz kartı "artık uygulanamıyor" olarak işaretler.
 */
export function applyEdit(edit: ProposedEdit, fields: ArticleFields): ArticleFields | null {
  const checked = checkEdit(edit, fields);
  if (!checked.status.ok) return null;

  if (edit.target === "body") {
    const blocks = splitBlocks(fields.body);
    blocks[edit.block ?? 0] = checked.status.after;
    return { ...fields, body: joinBlocks(blocks) };
  }

  return { ...fields, [edit.target]: checked.status.after };
}
