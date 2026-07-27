/**
 * Bülten rıza metni ve sürümü.
 *
 * Neden sürüm: 6563 sayılı Kanun kapsamında ticari elektronik ileti için önceden onay şart ve
 * onayın ispatı gönderene ait. Metin sonradan değişse bile kimin neye onay verdiği
 * kanıtlanabilir olmalı — bu yüzden abonenin kaydına o anki metnin sürümü yazılıyor.
 *
 * ÖNEMLİ: Gönderim şu an KAPALI. Halka açık bülten ticari elektronik ileti sayıldığı için
 * İYS (İleti Yönetim Sistemi) kaydı tamamlanmadan tek bir e-posta bile gönderilmemeli.
 * Toplanan onaylar İYS'ye yüklenmek üzere admin panelinden dışa aktarılabiliyor.
 */

export const NEWSLETTER_CONSENT_VERSION = "v1-2026";

export const NEWSLETTER_CONSENT_TEXT =
  "YAKA Hukuk & Danışmanlık'ın yayımladığı makale ve bilgilendirme içeriklerinin e-posta " +
  "adresime gönderilmesine onay veriyorum. Onayımı dilediğim zaman geri çekebileceğimi " +
  "biliyorum.";

/** Gönderim açılmadan önce yapılması gerekenler — admin ekranında da gösterilir. */
export const NEWSLETTER_SENDING_ENABLED = false;
