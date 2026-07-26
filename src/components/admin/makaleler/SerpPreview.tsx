import { SERP_DESCRIPTION_LIMIT, SERP_TITLE_LIMIT } from "@/lib/seo/score";

/**
 * Google arama sonucu kartı.
 *
 * `SeoPanel`'in içinden çıkarıldı ve sihirbazın seçenek önizlemeleriyle paylaşıldı — böylece
 * kullanıcı üç başlık seçeneğini düz metin olarak değil, **yayınlandığında görecekleri hâliyle**
 * karşılaştırıyor. İki yerde iki ayrı önizleme bakımı yapılmıyor.
 */
export function SerpPreview({
  title,
  description,
  url,
}: {
  title: string;
  description: string;
  url: string;
}) {
  const titleTruncated = title.length > SERP_TITLE_LIMIT;
  const descriptionTruncated = description.length > SERP_DESCRIPTION_LIMIT;
  const cut = (text: string, limit: number) =>
    text.length > limit ? text.slice(0, limit).trimEnd() : text;

  return (
    <div className="rounded border border-line bg-white px-4 py-3">
      <p className="m-0 truncate font-mono text-[11px] text-[#3F7A5B]">{url}</p>
      <p className="m-0 mt-0.5 text-[16px] leading-snug text-[#1a0dab]">
        {cut(title, SERP_TITLE_LIMIT) || (
          <span className="italic text-muted">Başlık boş</span>
        )}
        {titleTruncated && <span className="text-muted">…</span>}
      </p>
      <p className="m-0 mt-1 text-[12.5px] leading-relaxed text-[#4d5156]">
        {cut(description, SERP_DESCRIPTION_LIMIT) || (
          <span className="italic text-muted">
            Meta açıklama boş — Google kendi seçtiği bir metni gösterir.
          </span>
        )}
        {descriptionTruncated && <span className="text-muted">…</span>}
      </p>
    </div>
  );
}

/**
 * Sitedeki makale kartının önizlemesi — "Özet" seçeneklerini gerçek bağlamında göstermek için.
 * Kapak görseli yerine sade bir şerit kullanılır; amaç özetin kartta nasıl durduğunu görmek.
 */
export function ArticleCardPreview({
  category,
  title,
  excerpt,
  readMinutes,
}: {
  category: string;
  title: string;
  excerpt: string;
  readMinutes: number;
}) {
  return (
    <div className="overflow-hidden rounded border border-line bg-white">
      <div className="flex h-[54px] items-center bg-[#1C2230] px-4">
        <span className="font-mono text-[9px] tracking-[2px] text-[#9C7C4A]">
          {(category || "KATEGORİ").toLocaleUpperCase("tr")}
        </span>
      </div>
      <div className="px-4 py-3">
        <p className="m-0 text-[15px] font-semibold leading-[1.4] text-ink">
          {title || "(başlıksız)"}
        </p>
        <p className="m-0 mt-1.5 font-mono text-[10.5px] text-muted">
          {readMinutes} DK OKUMA
        </p>
        <p className="m-0 mt-2 text-[12.5px] leading-relaxed text-muted">
          {excerpt || <span className="italic">Özet boş.</span>}
        </p>
      </div>
    </div>
  );
}
