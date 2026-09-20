# YAKA Hukuk & Danışmanlık

Ankara Beştepe'de bir hukuk bürosunun kurumsal sitesi ve yönetim paneli. Next.js 16
(App Router, Turbopack), Prisma + Supabase Postgres, Supabase Storage (medya) ve Gemini
(AI destekli makale editörü) üzerine kurulu.

## Gereksinimler

- **Node.js `>= 24.0.0`** — `package.json`'daki `engines` alanı bunu zorunlu kılıyor.
  Prisma istemcisi yalnızca `^20.19 || ^22.12 || >=24.0` destekliyor (Node 21, 22.0-22.11
  ve 23.x **dahil değil**); proje yalnızca 24.x üzerinde geliştirilip test edildi.
- Bir **Supabase** projesi (Postgres veritabanı + Storage bucket).
- Bir **Google AI Studio** (Gemini) API anahtarı — isteğe bağlı; yoksa yalnızca AI destekli
  makale editörü özellikleri devre dışı kalır, sitenin geri kalanı etkilenmez.

## Kurulum

```bash
git clone https://github.com/atasevenibrahim/yakahukuk.git
cd yakahukuk
npm install
```

`npm install` sırasında `postinstall` betiği otomatik olarak `prisma generate` çalıştırır;
Prisma istemcisinin native ikili dosyaları o anda, çalıştığınız makineye göre üretilir.
**`node_modules` klasörünü başka bir makineye kopyalamayın** — `sharp`, `argon2` ve Prisma
platforma özgü derlenmiş ikili içeriyor; her makinede `npm install` yeniden çalıştırılmalı.

### Ortam değişkenleri

`.env.example` dosyasını `.env.local` olarak kopyalayıp doldurun:

```bash
cp .env.example .env.local
```

| Değişken | Zorunlu mu | Açıklama |
|---|---|---|
| `DATABASE_URL` | Evet | Supabase Postgres bağlantısı. Build sırasında paralel işçiler session pooler'ın (port 5432) bağlantı sınırına takılabiliyor — transaction pooler (port 6543) önerilir. |
| `TWOFA_ENCRYPTION_KEY` | Evet | Admin 2FA gizli anahtarlarının şifrelenmesinde kullanılır (32 baytlık rastgele değer). **Bir kez üretilir, sonra hiç değiştirilmez** — değişirse mevcut kullanıcıların şifreli 2FA sırları çözülemez hale gelir. |
| `GEMINI_API_KEY` | Hayır | Google AI Studio'dan alınan ücretsiz katman anahtarı. Yoksa AI özellikleri panelde kapalı görünür, makaleler elle yazılabilir. |
| `AI_MODEL` | Hayır | Model geçersiz kılma (varsayılan: `gemini-3.6-flash`). |
| `SUPABASE_URL` | Evet | Medya kütüphanesi için. `media` adında herkese açık bir bucket gerekir. |
| `SUPABASE_SERVICE_ROLE_KEY` | Evet | Yalnızca sunucuda kullanılır, hiçbir istemci bileşenine sızmamalı. |
| `RESEND_API_KEY` | Hayır | Randevu/mesaj bildirimleri için. Yoksa gönderim atlanır, sunucu günlüğüne yazılır — hiçbir akış çökmez. |
| `MAIL_FROM` | Hayır | Alan adı doğrulanmadan önce boş bırakılabilir (Resend test göndericisi kullanılır). |

**Önemli:** `GEMINI_API_KEY`'in ücretsiz katman kotası (`gemini-3.6-flash` için günde 20,
dakikada 5 istek) **anahtara bağlıdır, makineye değil**. Aynı anahtarı başka bir makineye
taşırsanız kota sıfırlanmaz.

### Veritabanı

```bash
npx prisma migrate deploy   # mevcut migration'ları uygular
```

Şemayı değiştirmeden önce `prisma/schema.prisma`'ya bakın; yeni bir migration için
`npx prisma migrate dev --name <ad>` kullanılır (yalnızca geliştirme ortamında).

## Geliştirme

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) adresinde açılır. Admin paneli:
`http://localhost:3000/admin/giris`.

**Bilinen sorun:** Bu proje üzerinde geliştirme sunucusu bazı Windows makinelerinde
~12-13 dakika çalıştıktan sonra bellek yetersizliğinden (`JavaScript heap out of memory`)
çökebiliyor; yük (istek sayısı) ile ilişkisi gözlenmedi. Veri kaybına yol açmaz,
`npm run dev` ile yeniden başlatmak yeterlidir. Kök nedeni (Turbopack'in dev dosya
izleme/önbellek katmanı olması muhtemel) çözülmedi.

## Test ve denetim

```bash
npm test          # node --test ile saf mantık testleri (DB/ağ gerektirmez)
npx tsc --noEmit  # tip kontrolü
npm run lint      # ESLint
```

`tests/` klasörü Node'un yerleşik test koşucusunu ve yerel TypeScript desteğini kullanır —
ayrı bir derleme adımı ya da test bağımlılığı yok. Kapsam: SEO denetimleri, AI düzenleme
doğrulaması, sohbet geçmişi izolasyonu, hata sınıflandırma/yeniden deneme mantığı gibi
veritabanı veya gerçek AI çağrısı gerektirmeyen saf modüller. Ayrıntı için `tests/README.md`.

## Üretim derlemesi

```bash
npm run build
npm run start
```

## Mimari notları

- **İçerik katmanı** (`src/content/`, `src/lib/content/safe-query.ts`): her sorgu
  veritabanına ulaşılamazsa statik bir yedeğe düşer — build anında ya da geçici bir
  kesintide site çökmez.
- **Randevu akışı** (`src/lib/booking.ts`) veritabanı kesintisinde **boş slot** döner
  (uydurma müsaitlik göstermez) ve sayfa telefonla yönlendirme gösterir; içerik gibi
  statik bir yedeğe düşmez, çünkü "eski slotları göster" var olmayan bir saate randevu
  alınmasına yol açar.
- **AI katmanı** (`src/lib/ai/`): sağlayıcı (`provider.ts`) tek dosyada izole — sağlayıcı
  değiştirmek bu dosyayı ve `AI_MODEL` değişkenini değiştirmek demek. Geçici hatalarda
  (5xx, dakikalık kota) otomatik yeniden dener; günlük kota asla yeniden denenmez.
  Uydurma kanun/karar atıfı üretmesi engellenir — doğrulanamayan iddialar
  `[DOĞRULANACAK]` işaretiyle bırakılır ve yayın bu işaretçi temizlenmeden kilitlenir.

## Lisans

Özel — YAKA Hukuk & Danışmanlık'a aittir.
