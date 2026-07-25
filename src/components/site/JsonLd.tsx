/**
 * Yapılandırılmış veriyi (`schema.org`) sayfaya basar.
 *
 * `data` yalnızca kendi kodumuzun ürettiği düz nesnelerden gelir (bkz. lib/seo/jsonld.ts);
 * kullanıcı girdisi doğrudan buraya verilmez. `JSON.stringify` çıktısındaki `<` karakteri, HTML
 * ayrıştırıcısının script bloğunu erken kapatmasına yol açabileceği için kaçırılır.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
