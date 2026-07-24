import { cache } from "react";

/**
 * Bir içerik sorgusunu React `cache()` ile sarar (istek başına tekilleştirir) ve DB'ye
 * ulaşılamazsa (ör. build anında ortam değişkeni henüz yayılmamışsa) verilen statik yedeğe
 * zarifçe düşer — randevu-al'da yaşanan "build DB'ye bağımlı kalıp çöküyor" hatasının burada,
 * çok daha geniş bir yüzeyde (12 alan + tüm site sayfaları) tekrarlanmaması için.
 */
export function safeQuery<T>(fetcher: () => Promise<T>, fallback: T): () => Promise<T> {
  return cache(async (): Promise<T> => {
    try {
      return await fetcher();
    } catch (err) {
      console.error("[content] DB sorgusu başarısız, statik yedeğe düşülüyor:", err);
      return fallback;
    }
  });
}
