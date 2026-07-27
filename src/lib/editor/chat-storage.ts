/**
 * Sohbet geçmişinin tarayıcı deposundaki saklanması.
 *
 * Neden ayrı bir modül: burada duran iki karar, "bir makalenin sohbeti başka bir makalede
 * göründü" hatasının tam kökeniydi. Saf fonksiyona çıkarılınca birim testiyle korunabiliyor.
 */

/**
 * `v2` öneki bilerek: v1'de kaydetme effect'i bir makalenin geçmişini başka bir makalenin
 * anahtarına yazabiliyordu, yani kullanıcıların mevcut kayıtları kirli olabilir. Önek
 * değişince o kayıtlar okunmaz.
 */
export function chatStorageKey(scope: string): string {
  return `yaka:chat:v2:${scope}`;
}

/**
 * Kayıtlı geçmişi okur. **Kayıt yoksa ya da bozuksa boş dizi döner** — `null` değil.
 *
 * Bu ayrım hatanın birinci yarısıydı: eski kod yalnızca kayıt varsa durumu güncelliyordu,
 * dolayısıyla henüz sohbeti olmayan bir makaleye geçildiğinde öncekinin mesajları ekranda
 * kalıyordu.
 */
export function loadChat<T>(storage: Pick<Storage, "getItem">, key: string): T[] {
  const saved = storage.getItem(key);
  if (!saved) return [];
  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

/**
 * Geçmiş bu anahtara yazılabilir mi?
 *
 * Hatanın ikinci yarısı: anahtar değiştiğinde okuma effect'i henüz çalışmamışken kaydetme
 * effect'i devreye giriyor ve ÖNCEKİ makalenin mesajlarını YENİ anahtara yazıyordu. Okuması
 * tamamlanan anahtarı karşılaştırmak bu yarışı kapatıyor.
 */
export function canPersistChat(
  loadedKey: string | null,
  key: string,
  persist: boolean,
): boolean {
  return persist && loadedKey === key;
}

/**
 * Kaydedilmemiş makalenin ("yeni") sohbetini, ilk kayıttan sonra gerçek id'ye taşır.
 * Taşımasak kullanıcı Kaydet'e bastığı anda o ana kadarki konuşmayı kaybederdi.
 */
export function migrateChatScope(
  storage: Pick<Storage, "getItem" | "setItem" | "removeItem">,
  fromScope: string,
  toScope: string,
): boolean {
  const from = chatStorageKey(fromScope);
  const saved = storage.getItem(from);
  if (!saved) return false;
  storage.setItem(chatStorageKey(toScope), saved);
  storage.removeItem(from);
  return true;
}
