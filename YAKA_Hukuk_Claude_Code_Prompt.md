# YAKA Hukuk & Danışmanlık — Claude Code Build Promptu

> **Nasıl kullanılır:** Bu metni Claude Code'a bir proje spesifikasyonu olarak ver. İçindeki **Faz planını** sırayla uygula. Tasarım/görsel kararlar için ayrı "Claude Design promptu" ile üretilen ekranları referans al. Alan adı: **yakahukuk.com**. Dağıtım: **Vercel**.

---

## 1) Proje amacı

Ankara'daki **YAKA Hukuk & Danışmanlık** için: (a) çok dilli, SEO uyumlu, hızlı bir **kurumsal tanıtım sitesi**; (b) tüm içeriği yönetmeye yarayan, **rol tabanlı**, **en üst düzey güvenlikli** bir **admin paneli**; (c) **takvim tabanlı randevu sistemi** ve **gelen talep (mesaj/randevu) kutusu**. İçerik alanları ekleme/düzenleme/silme/**sürükle-sıralama** ile yönetilir. Şu an içerikler placeholder; sonradan admin'den doldurulacak.

**Sabit bilgiler:** Adres: Beştepe, Meriç Sk. No:54/A, 06530 Yenimahalle/Ankara · Telefon: 0312 215 80 85 · Zaman dilimi: **Europe/Istanbul** · Varsayılan dil: **TR**, ikinci dil: **EN** (yeni dil eklenebilir; Arapça eklenirse **RTL** desteklenmeli).

---

## 2) Teknoloji yığını (kesin)

- **Framework:** Next.js (App Router) + **TypeScript** (strict). React Server Components + Server Actions/Route Handlers.
- **Stil:** Tailwind CSS. Tasarım token'ları (renk/tipografi/boşluk) Design promptundaki sistemle birebir; fontlar `next/font` ile (Cormorant Garamond, Manrope, IBM Plex Mono — Türkçe glif desteğiyle).
- **Veritabanı:** **PostgreSQL** (Vercel Postgres veya Neon). ORM: **Prisma**.
- **Kimlik doğrulama:** Auth.js (NextAuth) **Credentials** sağlayıcı **veya** eşdeğer güvenli özel çözüm; **TOTP 2FA** (`otplib`), yedek kodlar. Şifre hash: **argon2id** (tercih) veya bcrypt (cost ≥ 12).
- **Dosya/görsel depolama:** **Vercel Blob** (görseller). Görseller `sharp` ile yeniden kodlanır/optimize edilir.
- **Zengin metin:** Tiptap (JSON+HTML), sunucu tarafında `sanitize-html`/DOMPurify ile katı allowlist.
- **Form & doğrulama:** React Hook Form + **Zod** (şema client & server paylaşımlı).
- **CAPTCHA:** **Cloudflare Turnstile** (public formlar + admin giriş). Doğrulama sunucuda.
- **Rate limiting / anti-abuse:** Upstash Redis (Vercel uyumlu) tabanlı rate limit + login lockout.
- **Gerçek zamanlı bildirim (yeni talep sesi):** SSE (server-sent events) veya kısa polling (serverless uyumlu). Yeni okunmamış talep → istemcide rozet + ses.
- **E-posta (ileriye dönük):** `sendMail(...)` soyutlaması yaz; sağlayıcı (ör. Resend/SMTP) sonradan bağlanacak. Şimdi dev-logger + ayar; **bildirim e-postalarına yönlendirme ileride aktifleşecek şekilde hook'lu** kur.
- **i18n:** `next-intl` (veya App Router yerleşik i18n). URL prefix'li (`/tr`, `/en`). İçerik çevirisi DB'de (aşağıya bak).
- **Test/kalite:** ESLint + TypeScript strict; kritik iş mantığı (randevu slotu, izin kontrolü, sanitizasyon) için birim testleri.

---

## 3) Klasör yapısı (öneri)

```
/app
  /[locale]                      # public site (tr/en)
    /(site) …                    # ana sayfa, hakkımızda, çalışma alanları, ekip, makaleler, basında biz, sss, iletişim, randevu, yasal
  /[locale]/admin                # admin paneli (korumalı)
  /api                           # route handlers: auth, forms, appointments, sse, upload, turnstile-verify …
/components  /ui  /forms  /admin
/lib         (auth, rbac, db, i18n, mail, rate-limit, sanitize, slots, audit)
/prisma      schema.prisma  /migrations  seed.ts
/messages    tr.json  en.json          # statik arayüz metinleri
/public
middleware.ts                          # i18n + auth + güvenlik başlıkları
```

---

## 4) Ortam değişkenleri (Vercel)

`DATABASE_URL`, `DIRECT_URL` (Prisma), `AUTH_SECRET`, `AUTH_URL`, `BLOB_READ_WRITE_TOKEN`, `TURNSTILE_SECRET_KEY` + public site key, `UPSTASH_REDIS_REST_URL` + token, (ileride) `RESEND_API_KEY`/SMTP\_\*. Sırlar yalnızca sunucuda; client bundle'a asla sızmaz.

---

## 5) Veri modeli (Prisma — taslak)

Çeviri stratejisi: her çevrilebilir içerik modelinin bir `*Translation` ilişkisi olur (`locale` + alanlar). Slug'lar dile özgü ve benzersiz. Sıralama için `position: Int`.

```prisma
model User {
  id            String   @id @default(cuid())
  name          String
  email         String   @unique
  passwordHash  String
  roleId        String
  role          Role     @relation(fields: [roleId], references: [id])
  isActive      Boolean  @default(true)
  twoFAEnabled  Boolean  @default(false)
  twoFASecret   String?          // şifreli sakla
  backupCodes   BackupCode[]
  lastLoginAt   DateTime?
  createdAt     DateTime @default(now())
}
model Role {
  id          String  @id @default(cuid())
  name        String  @unique      // "Süper Admin", "Editör", "Görüntüleyici", özel…
  isSystem    Boolean @default(false) // Süper Admin silinemez
  permissions Permission[]          // modül + can(view/create/edit/delete)
}
model Permission { id String @id @default(cuid()) roleId String module String canView Boolean canCreate Boolean canEdit Boolean canDelete Boolean }
model BackupCode { id String @id @default(cuid()) userId String codeHash String usedAt DateTime? }

model PracticeArea {
  id String @id @default(cuid())
  icon String
  position Int
  status Status @default(DRAFT)     // DRAFT | PUBLISHED
  coverUrl String?
  translations PracticeAreaTranslation[]
}
model PracticeAreaTranslation {
  id String @id @default(cuid())
  areaId String
  locale String
  title String
  slug String
  excerpt String
  body String                       // sanitize edilmiş HTML
  seoTitle String? seoDescription String?
  @@unique([locale, slug])
  @@unique([areaId, locale])
}

model TeamMember {
  id String @id @default(cuid())
  photoUrl String?
  position Int
  status Status @default(DRAFT)
  isPlaceholder Boolean @default(true)
  specialties String[]
  translations TeamMemberTranslation[]  // locale, fullName, title, bio, education …
}

model Article {
  id String @id @default(cuid())
  coverUrl String?
  categoryId String?
  status Status @default(DRAFT)          // DRAFT | PUBLISHED | SCHEDULED
  publishAt DateTime?                     // zamanlanmış yayın
  isFeatured Boolean @default(false)
  authorId String?
  translations ArticleTranslation[]       // locale, title, slug, excerpt, body, seo…
  tags Tag[]
}
model Category { id String @id @default(cuid()) translations CategoryTranslation[] position Int }
model Tag { id String @id @default(cuid()) translations TagTranslation[] }

model PressItem { id String @id @default(cuid()) date DateTime position Int status Status externalUrl String? translations PressItemTranslation[] }
model Testimonial { id String @id @default(cuid()) rating Int position Int status Status practiceAreaId String? translations TestimonialTranslation[] } // clientName/alias içeride
model FaqCategory { id String @id @default(cuid()) position Int translations FaqCategoryTranslation[] items FaqItem[] }
model FaqItem { id String @id @default(cuid()) categoryId String position Int status Status translations FaqItemTranslation[] }

model LegalDocument { id String @id @default(cuid()) key String @unique  // kvkk, aydinlatma, cerez, gizlilik
  updatedAt DateTime @updatedAt sections LegalSection[] }
model LegalSection { id String @id @default(cuid()) documentId String position Int translations LegalSectionTranslation[] }

model HomeSettings { id Int @id @default(1)  // tekil satır: hero, istatistikler, öne çıkanlar (JSON + ilişkiler), CTA (çevirili)
}
model SiteSettings { id Int @id @default(1) phone String email String addressLine String mapLat Float mapLng Float workingHours String social Json  defaultLocale String activeLocales String[] siteMeta Json newRequestSound Boolean @default(true) }
model NotificationEmail { id String @id @default(cuid()) email String isActive Boolean @default(true) } // ileride yönlendirme hedefleri
model UiString { id String @id @default(cuid()) key String values Json @@unique([key]) } // statik çeviri anahtarları

// Formlar / talepler
model ContactMessage {
  id String @id @default(cuid())
  name String email String phone String? subject String message String
  locale String
  status RequestStatus @default(NEW)     // NEW | READ | REPLIED | CLOSED
  ip String? userAgent String?
  kvkkConsent Boolean kvkkTextVersion String  // onay kanıtı
  createdAt DateTime @default(now())
  notes AdminNote[]
}
model Appointment {
  id String @id @default(cuid())
  date DateTime            // gün
  startTime String         // "11:00"
  endTime String
  practiceAreaId String?
  name String email String phone String subject String?
  locale String
  status AppointmentStatus @default(PENDING) // PENDING | CONFIRMED | REJECTED | RESCHEDULED | CANCELLED
  kvkkConsent Boolean kvkkTextVersion String
  ip String? userAgent String?
  createdAt DateTime @default(now())
  @@unique([date, startTime, status])        // onaylıda çift-rezervasyon engeli (uygulama katmanında da kontrol)
}
model AvailabilityRule { id String @id @default(cuid()) weekday Int startTime String endTime String slotMinutes Int bufferMinutes Int isActive Boolean }
model BlockedDate { id String @id @default(cuid()) date DateTime reason String? }

model MediaAsset { id String @id @default(cuid()) url String type String size Int alt String? createdAt DateTime @default(now()) }
model AuditLog { id String @id @default(cuid()) actorId String? action String module String entityId String? ip String? userAgent String? createdAt DateTime @default(now()) }

enum Status { DRAFT PUBLISHED SCHEDULED }
enum RequestStatus { NEW READ REPLIED CLOSED }
enum AppointmentStatus { PENDING CONFIRMED REJECTED RESCHEDULED CANCELLED }
```
> Yukarıdaki şema yol göstericidir; Prisma'ya uygun tamamlayıp migration üret. `seed.ts` ile: Süper Admin rolü + ilk süper admin kullanıcı, 12 çalışma alanı placeholder'ı, boş HomeSettings/SiteSettings, yasal belge placeholder metinleri, örnek placeholder ekip üyeleri (isimleri yer tutucu belli olacak) oluştur.

---

## 6) Çok dilli (i18n) mimarisi

- URL: `/tr/...`, `/en/...`. `middleware.ts` locale tespiti + yönlendirme. Varsayılan `defaultLocale`.
- **Statik arayüz metinleri** `next-intl` mesaj katalogları (`/messages/*.json`) + admin'den düzenlenebilir `UiString` tablosu.
- **İçerik çevirisi** DB `*Translation` tablolarından; bir dilde çeviri yoksa admin'de "eksik" işaretlenir, public tarafta varsayılan dile fallback (ayarlanabilir).
- **SEO:** her sayfa için `hreflang` alternatif linkleri, dile özgü `metadata`, canonical.
- Yeni dil admin "Diller" ekranından eklenince tüm editörlerde dil sekmesi otomatik gelir. Arapça vb. eklenirse `dir="rtl"` uygulanır.

---

## 7) Kimlik doğrulama & yetkilendirme

- **Giriş:** e-posta + şifre + **Turnstile**. Şifre argon2id ile doğrulanır. Başarılıysa **2FA** adımı (TOTP 6 hane) veya yedek kod. Oturum: httpOnly + Secure + SameSite cookie; kısa ömür + rotation; idle + absolute timeout.
- **2FA kurulumu:** profil ekranından; `otplib` ile secret üret, QR sağla (otpauth URI), doğrula, 10 yedek kod (hash'li, bir kez göster).
- **RBAC:** Her admin route/Server Action, ilgili modül için izin (view/create/edit/delete) sunucuda kontrol edilir. İstemciye asla güvenilmez. Süper Admin tam yetkili ve silinemez. Roller ve izin matrisi admin'den yönetilir; kullanıcı oluşturma/görüntüleme/pasifleştirme burada.
- **Kullanıcı ifşası yok:** giriş/şifre-sıfırlama mesajları genel. Deneme limiti + **lockout** (IP + hesap bazlı, artan gecikme).

---

## 8) Public site route'ları

Ana Sayfa · Hakkımızda · Çalışma Alanları (liste + `[slug]` detay) · Ekibimiz (liste + `[id]` detay) · Makaleler (liste + filtre/arama + `[slug]` detay, kategori/etiket) · Basında Biz/Duyurular (liste + detay) · SSS (kategorili akordeon) · İletişim (form + harita) · **Randevu** (takvim akışı) · Müvekkil Yorumları · Yasal sayfalar (kvkk/aydınlatma/çerez/gizlilik) · 404/500. Tümü SSG/ISR uygun; içerik DB'den. Yalnızca `PUBLISHED` (ve `SCHEDULED` için `publishAt` geçmişse) içerik gösterilir.

---

## 9) Randevu sistemi (mantık)

- **Müsaitlik:** `AvailabilityRule` (haftalık gün/saat/slot süresi/buffer) + `BlockedDate`. Public takvim, seçilen gün için: kurallardan slotları üret, `BlockedDate` ve mevcut `CONFIRMED/PENDING` randevularla dolu olanları çıkar, geçmiş saatleri gizle. Zaman dilimi **Europe/Istanbul**.
- **Akış:** gün seç → müsait slot seç → form (ad, e-posta, telefon, çalışma alanı, konu/not, **KVKK onayı**, **Turnstile**) → özet → gönder. Kayıt `PENDING` olarak düşer.
- **Çift-rezervasyon engeli:** hem DB kısıtı hem uygulama kontrolü; slot son anda dolduysa net hata döndür, tekrar seçtir.
- **Admin:** onayla/reddet/yeniden planla; onayda slot kilitlenir. Bildirim: yeni randevu talebi gelen kutusuna düşer + (ayar açıksa) ses.

---

## 10) İletişim / gelen talep kutusu

- **İletişim formu:** Zod doğrulama + **Turnstile** + rate limit + honeypot. Kayıt `ContactMessage` (KVKK onay + metin versiyonu + IP/UA loglanır).
- **Gelen kutusu (admin):** Mesaj + Randevu tek yerde, sekmeli; durum yönetimi (Yeni/Okundu/Yanıtlandı/Kapandı), not ekleme, arşiv. **Yeni öğe** geldiğinde SSE/polling ile rozet artar ve **ses** çalar (SiteSettings.newRequestSound).
- **İleriye dönük e-posta yönlendirme:** `NotificationEmail` hedefleri + `sendMail()` soyutlaması hazır olsun; şimdilik gönderim kapalı/dev-logger, sonradan sağlayıcı bağlanınca "yeni talep geldiğinde bu adreslere ilet" aktifleşecek. Ayar ekranında bu adresler yönetilir.

---

## 11) Admin panel modülleri (özet — hepsi CRUD + gerektiğinde sürükle-sırala + çok dilli + SEO)

Dashboard · Gelen Talepler (mesaj+randevu) · Randevu Yönetimi (müsaitlik+takvim) · Çalışma Alanları · Ekip · Makaleler (zengin editör, kategori/etiket, taslak/zamanlı yayın) · Basında Biz/Duyurular · Müvekkil Yorumları (onay) · SSS (kategori) · Yasal Metinler (madde madde) · Ana Sayfa/Hero · Medya Kütüphanesi · Genel Ayarlar · Diller & Çeviri · Kullanıcı & Rol (RBAC) · İşlem Kayıtları (audit) · Profil/2FA.

**Ortak davranışlar:** her mutasyon audit log'a yazılır; her tabloda arama/filtre/sıralama/sayfalama; silme onay dialogu; kaydedilmemiş değişiklik uyarısı; çok dilli editörlerde dil sekmeleri + eksik çeviri rozeti; sıralanabilir listelerde `position` güncelleme.

---

## 12) Güvenlik (en üst düzey — zorunlu kontrol listesi)

1. **Şifre:** argon2id (veya bcrypt cost≥12). Düz metin asla saklanmaz/loglanmaz.
2. **2FA (TOTP)** admin için; yedek kodlar hash'li; doğrulama rate-limited.
3. **Oturum:** httpOnly + Secure + SameSite cookie; rotation; idle+absolute timeout; yetki değişince invalidasyon.
4. **RBAC** her sunucu işleminde; istemciye güven yok.
5. **Brute-force:** login/2FA/form için rate limit + artan lockout (IP+hesap). Genel hata mesajı (enumeration yok).
6. **CAPTCHA (Turnstile)** tüm public formlar + login; doğrulama sunucuda.
7. **Girdi doğrulama (Zod)** her yerde; **çıktı encoding** (XSS). Zengin metin sunucuda **sanitize** (katı allowlist).
8. **SQLi:** Prisma parametreli sorgular; ham SQL kullanılmaz (gerekirse parametreli).
9. **Güvenlik başlıkları** (middleware/next.config): **HSTS** (max-age uzun, includeSubDomains, preload), **CSP** (katı; script için nonce), `X-Content-Type-Options: nosniff`, `frame-ancestors 'none'` / `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, minimal `Permissions-Policy`, COOP/CORP.
10. **CSRF:** Server Action/route'larda token/origin kontrolü.
11. **Dosya yükleme:** MIME + sihirli-bayt doğrulama, boyut limiti, görselleri `sharp` ile yeniden kodla, rastgele isim, SVG'yi sanitize et veya inline sunma, çalıştırılabilir engelle.
12. **Sırlar** yalnızca Vercel env; client'a sızmaz; anahtarlar ayrık.
13. **Audit log**: tüm admin mutasyonları + auth olayları (aktör, eylem, entity, IP, UA, zaman); append-only.
14. **Hata yönetimi:** istemciye stack/sır sızmaz; merkezi loglama PII/sır içermez.
15. **HTTPS zorunlu** (Vercel) + HSTS; cookie `Secure`.
16. **Bağımlılık hijyeni:** lockfile, `npm audit`, güncel paketler.

---

## 13) KVKK / yasal uyum

- Form gönderimlerinde **açık rıza** kutusu zorunlu; onay + **metin versiyonu** + zaman damgası kayıt altında.
- **Çerez rızası** banner'ı; zorunlu-olmayan çerezler rıza olmadan yüklenmez.
- Yasal belgeler (KVKK/Aydınlatma/Çerez/Gizlilik) admin'den madde madde düzenlenebilir; "son güncelleme" tutulur.
- **Veri saklama/silme:** admin'de talep kayıtlarını silme/arşivleme; ileride veri sahibi talebi için silme aracı. Veriler AB/uygun bölgede tutulur (DB sağlayıcı bölge seçimi).

---

## 14) SEO & performans

- Dinamik `metadata` (title/description/OG/Twitter), dile özgü; **hreflang** alternatifleri; canonical.
- Otomatik **sitemap.xml** (diller dâhil) + **robots.txt**. Makale/alan detaylarında JSON-LD (`LegalService`, `Article`, `BreadcrumbList`).
- `next/image` (Blob kaynaklı) + boyutlandırma; font `next/font` ile; ISR ile hızlı sayfalar; Core Web Vitals gözet.

---

## 15) Faz planı (bu sırayla uygula)

1. **İskele:** Next.js + TS + Tailwind + Prisma + i18n + `middleware.ts` (i18n + güvenlik başlıkları). Tasarım token'ları ve fontlar. Design promptundaki bileşen sistemini (header/nav+dil seçici, footer, buton/form/kart/toast/modal) kur.
2. **DB & seed:** şema + migration + `seed.ts` (Süper Admin, 12 alan, ayarlar, yasal placeholder, örnek ekip).
3. **Auth & RBAC & 2FA:** giriş + Turnstile + TOTP + yedek kodlar + rol/izin altyapısı + rate limit/lockout + audit log.
4. **Admin kabuğu:** sidebar/topbar/breadcrumb, tablo/form/sürükle-sırala/dil-sekmesi ortak bileşenleri, boş/yükleme/hata durumları, kaydet çubuğu.
5. **İçerik modülleri:** Çalışma Alanları → Ekip → Makaleler (zengin editör, kategori/etiket, taslak/zamanlı) → Basında Biz → Yorumlar → SSS → Yasal (madde madde) → Ana Sayfa/Hero → Medya → Genel Ayarlar → Diller/Çeviri.
6. **Randevu sistemi:** müsaitlik kuralları + public takvim akışı + admin randevu yönetimi + çift-rezervasyon engeli.
7. **Gelen kutusu:** iletişim formu + mesaj/randevu kutusu + SSE/polling + **ses bildirimi** + `NotificationEmail` & `sendMail()` hook (ileriye dönük).
8. **Public site:** tüm sayfaları DB içerikle bağla, i18n, SEO (metadata/hreflang/sitemap/robots/JSON-LD), 404/500, çerez banner'ı, WhatsApp butonu.
9. **Sertleştirme & test:** CSP/HSTS ince ayar, upload doğrulama, izin testleri, slot mantığı ve sanitizasyon birim testleri, `npm audit`, erişilebilirlik (focus/kontrast/klavye).
10. **Deploy:** Vercel + Vercel Postgres/Neon + Vercel Blob + Turnstile + Upstash env; domain **yakahukuk.com**; migration; ilk süper admin ile giriş doğrulaması.

---

## 16) Kod kalitesi & teslim kriterleri

- TypeScript strict, ESLint temiz; paylaşılan Zod şemaları; net hata sınırları.
- Erişilebilirlik: klavye ile tam kullanım, görünür focus, AA kontrast, `prefers-reduced-motion`, mobil uyum.
- **Kabul:** Süper admin giriş + 2FA çalışır; rol/kullanıcı oluşturulabilir; her içerik tipi eklenip/düzenlenip/silinip **sıralanabilir** ve **çok dilli** girilebilir; randevu talebi uçtan uca oluşturulup admin'de yönetilebilir (çift-rezervasyon engelli); iletişim/randevu talebi gelince kutuya düşer + **ses** çıkar; tüm güvenlik kontrol listesi (Bölüm 12) uygulanır; site TR/EN çalışır ve SEO çıktıları üretir; Vercel'de yakahukuk.com üzerinde yayınlanır.
```
```
