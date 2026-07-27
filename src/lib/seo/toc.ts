import { parseMarkdown } from "@/lib/markdown";
import { slugify } from "@/lib/admin/slugify";

/**
 * Makale içindekiler tablosu.
 *
 * Neden SEO'ya yarıyor: başlıklara kararlı `id` verilince Google arama sonucunda doğrudan
 * ilgili bölüme giden "atlama bağlantıları" (jump links) basabiliyor ve uzun makalelerde
 * tıklama oranı artıyor. Okuyucu için de gezinme kolaylığı.
 *
 * Saf fonksiyon: hem sunucuda (makale sayfası) hem istemcide (editör anahatı) kullanılabilir.
 */

export type TocEntry = {
  level: 2 | 3;
  text: string;
  /** Başlığa verilecek `id` — aynı metinli başlıklarda sonuna sayı eklenir. */
  id: string;
};

/** Başlık metnini `id`'ye çevirir. Türkçe karakterler için mevcut `slugify` kullanılır. */
export function headingId(text: string, used: Set<string>): string {
  // `slugify` harfsiz girdide kendi genel yedeği olan "kayit"i döndürüyor; bir başlık çapası
  // için anlamsız. Bu yüzden yedek, slugify'ın çıktısına değil girdinin kendisine bakılarak
  // seçiliyor — "Kayıt" başlıklı gerçek bir bölüm de doğru şekilde "kayit" almaya devam eder.
  const hasContent = /[\p{L}\p{N}]/u.test(text);
  const base = hasContent ? slugify(text) : "bolum";
  if (!used.has(base)) {
    used.add(base);
    return base;
  }
  // Aynı başlık iki kez geçerse id'ler çakışmamalı; aksi hâlde atlama bağlantısı yanlış yere gider.
  let i = 2;
  while (used.has(`${base}-${i}`)) i += 1;
  const unique = `${base}-${i}`;
  used.add(unique);
  return unique;
}

export function buildToc(markdown: string): TocEntry[] {
  const used = new Set<string>();
  const entries: TocEntry[] = [];

  for (const node of parseMarkdown(markdown)) {
    if (node.type !== "heading") continue;
    const text = node.spans.map((s) => s.text).join("").trim();
    if (!text) continue;
    entries.push({ level: node.level, text, id: headingId(text, used) });
  }

  return entries;
}
