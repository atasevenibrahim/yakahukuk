/**
 * Model bazen gövdede zaten `[İfade](/yol)` biçiminde bağlantılı olan bir ifadeyi tekrar
 * öneriyor. Böyle bir öneri uygulanırsa iç içe bağlantı oluşur ve sitenin dar markdown
 * ayrıştırıcısı bunu doğru basamaz: `[[İfade](/yol)](/yol)`. Bu modül hem sunucudaki öneri
 * süzgecinin (article.ts) hem de panelin "Uygula" düğmesinin (AiPanel.tsx) aynı kurala
 * uymasını sağlıyor — iki ayrı ortamda (server action / istemci bileşeni) kullanıldığı için
 * paylaşılan, bağımsız test edilebilir bir dosyada duruyor.
 */

const MARKDOWN_LINK = /\[([^\]]+)\]\([^)]+\)/g;

/** Gövdede, mevcut bir bağlantının DIŞINDA en az bir `phrase` geçişi var mı? */
export function hasLinkableOccurrence(body: string, phrase: string): boolean {
  if (!phrase) return false;
  const withoutExistingLinks = body.replace(MARKDOWN_LINK, "");
  return withoutExistingLinks.includes(phrase);
}

/**
 * `phrase`nin gövdedeki, mevcut bir bağlantının DIŞINDAKİ ilk geçişini bağlantıya çevirir.
 *
 * Düz `.replace(phrase, ...)` bunu garanti etmez: ifade önce bir bağlantının içinde
 * geçiyorsa, `.replace` o geçişi hedefleyip iç içe bağlantı üretir. Bulunamazsa (ör. süzgeç
 * geçtikten sonra kullanıcı metni değiştirdiyse) `null` döner — çağıran bunu "artık
 * uygulanamıyor" olarak göstermeli.
 */
export function linkifyFirstFreeOccurrence(
  body: string,
  phrase: string,
  href: string,
): string | null {
  if (!phrase) return null;

  const occupied: Array<[number, number]> = [];
  for (const match of body.matchAll(MARKDOWN_LINK)) {
    occupied.push([match.index, match.index + match[0].length]);
  }

  let searchFrom = 0;
  while (searchFrom <= body.length) {
    const idx = body.indexOf(phrase, searchFrom);
    if (idx === -1) return null;
    const insideExistingLink = occupied.some(([start, end]) => idx >= start && idx < end);
    if (!insideExistingLink) {
      return body.slice(0, idx) + `[${phrase}](${href})` + body.slice(idx + phrase.length);
    }
    searchFrom = idx + 1;
  }
  return null;
}
