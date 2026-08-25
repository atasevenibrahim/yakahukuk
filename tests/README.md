# Testler

```bash
npm test
```

Node 24'ün yerleşik koşucusu (`node --test`) ve yerel TypeScript desteği kullanılıyor —
derleme adımı yok, yeni bağımlılık yok.

## Neden `alias-loader.mjs`?

Node, `tsconfig.json`daki `paths` ayarını okumaz; uygulama kodu ise her yerde `@/lib/...`
yazıyor. `tests/alias-hooks.mjs` bu takma adı ve uzantısız göreli import'ları çözer.

`@/lib/metadata` testte `tests/stubs/metadata.ts` ile değiştirilir: gerçek modül next-intl
üzerinden `next/navigation`a bağlı ve düz Node altında yüklenmiyor. Test edilen fonksiyonlar
ondan yalnızca `BASE_URL` sabitini kullanıyor.

## Kapsam

Yalnızca **saf** modüller test ediliyor — veritabanı, ağ ya da React gerektirmeyenler:

| Dosya | Kapsanan |
|---|---|
| `slugify.test.ts` | Türkçe slug üretimi, etiket arşivlerinin birleşmesi |
| `faq-text.test.ts` | SSS metin ⇄ çift dönüşümü |
| `chat-storage.test.ts` | Sohbet geçmişinin makaleler arası taşınmama garantisi |
| `chat-suggestions.test.ts` | Makaleye özel öneri üretimi |
| `seo-score.test.ts` | 19 SEO denetimi, puanlama sınırları |
| `citations.test.ts` | Doğrulanmamış bilgi tespiti ve yayın kapısı |
| `edit-ops.test.ts` | AI düzenleme önerilerinin güvenli uygulanması |
| `toc-diff.test.ts` | İçindekiler çapaları, kelime bazlı diff |
| `jsonld.test.ts` | CollectionPage / BreadcrumbList / FAQPage şemaları |

`tests/helpers/article.ts` ortak örnek makaleyi tutar: denetimlerin tamamını geçecek kadar
sağlıklı (600+ kelime, ara başlıklar, liste, iki iç bağlantı). Bir denetimin bozulduğunu
göstermek isteyen test bunu tek noktadan bozar.
