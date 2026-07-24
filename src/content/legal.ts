import { prisma } from "@/lib/prisma";
import { safeQuery } from "@/lib/content/safe-query";
import type { Locale, Localized } from "./types";
import { pick } from "./types";

export type LegalSection = { no: string; title: string; text: string };

export type LegalDocument = {
  slug: "kvkk" | "aydinlatma" | "cerez";
  updatedAt: Date;
  t: Localized<{ tabLabel: string; tag: string; title: string; intro: string; sections: LegalSection[] }>;
};

// DB'ye ulaşılamazsa düşülecek statik yedek — 3 belge, gerçek veri artık Admin İçerik'te.
const FALLBACK_UPDATED_AT = new Date("2026-07-01T00:00:00Z");
const FALLBACK_LEGAL: LegalDocument[] = [
  {
    slug: "kvkk",
    updatedAt: FALLBACK_UPDATED_AT,
    t: {
      tr: {
        tabLabel: "KVKK Politikası",
        tag: "KVKK",
        title: "Kişisel Verilerin Korunması Politikası",
        intro:
          "YAKA Hukuk & Danışmanlık olarak kişisel verilerinizi 6698 sayılı Kişisel Verilerin Korunması Kanunu (\"KVKK\") ve ilgili mevzuata uygun olarak işliyoruz. Bu politika; hangi verileri, hangi amaçla ve ne kadar süreyle işlediğimizi açıklar.",
        sections: [
          {
            no: "01",
            title: "Veri sorumlusu",
            text: "Veri sorumlusu, Beştepe, Meriç Sk. No:54/A Yenimahalle/Ankara adresinde faaliyet gösteren YAKA Hukuk & Danışmanlık'tır. [Ticari unvan ve sicil bilgileri — yer tutucu.]",
          },
          {
            no: "02",
            title: "İşlenen veri kategorileri",
            text: "Kimlik, iletişim, hukuki işlem ve müvekkil işlem verileri; randevu ve iletişim formları aracılığıyla paylaştığınız bilgiler. [Detay tablo — yer tutucu.]",
          },
          {
            no: "03",
            title: "İşleme amaçları ve hukuki sebep",
            text: "Hukuki hizmetin sunulması, randevu süreçlerinin yürütülmesi, yasal yükümlülüklerin yerine getirilmesi. KVKK m.5/2 kapsamındaki hukuki sebeplere dayanılır. [Yer tutucu.]",
          },
          {
            no: "04",
            title: "Saklama süreleri ve haklarınız",
            text: "Veriler, mevzuatın öngördüğü asgari süreler boyunca saklanır. KVKK m.11 kapsamındaki haklarınız için info@yakahukuk.com adresine başvurabilirsiniz. [Yer tutucu.]",
          },
        ],
      },
    },
  },
  {
    slug: "aydinlatma",
    updatedAt: FALLBACK_UPDATED_AT,
    t: {
      tr: {
        tabLabel: "Aydınlatma Metni",
        tag: "AYDINLATMA",
        title: "Kişisel Verilere İlişkin Aydınlatma Metni",
        intro:
          "Bu aydınlatma metni, KVKK m.10 uyarınca; web sitemizi ziyaret eden, form dolduran veya randevu oluşturan kişileri kişisel verilerinin işlenmesi konusunda bilgilendirmek amacıyla hazırlanmıştır.",
        sections: [
          {
            no: "01",
            title: "Toplanan veriler ve yöntem",
            text: "Ad-soyad, telefon, e-posta ve mesaj içerikleri; web formları ve telefon aracılığıyla, otomatik ve kısmen otomatik yollarla toplanır. [Yer tutucu.]",
          },
          {
            no: "02",
            title: "İşleme amacı",
            text: "Talebinizin yanıtlanması, randevunuzun oluşturulması ve ön görüşme sürecinin yürütülmesi amacıyla işlenir. [Yer tutucu.]",
          },
          {
            no: "03",
            title: "Aktarım",
            text: "Verileriniz, yasal zorunluluklar dışında üçüncü kişilerle paylaşılmaz. Barındırma hizmeti aldığımız sunucular yurt içindedir. [Yer tutucu.]",
          },
          {
            no: "04",
            title: "Başvuru hakkı",
            text: "KVKK m.11 kapsamındaki taleplerinizi yazılı olarak veya kayıtlı e-posta ile iletebilirsiniz; başvurular en geç 30 gün içinde sonuçlandırılır. [Yer tutucu.]",
          },
        ],
      },
    },
  },
  {
    slug: "cerez",
    updatedAt: FALLBACK_UPDATED_AT,
    t: {
      tr: {
        tabLabel: "Çerez Politikası",
        tag: "ÇEREZ",
        title: "Çerez (Cookie) Politikası",
        intro:
          "Web sitemiz; deneyiminizi iyileştirmek, tercihlerinizi hatırlamak ve site trafiğini analiz etmek amacıyla çerezler kullanır. Zorunlu olmayan çerezler yalnızca açık rızanızla çalışır.",
        sections: [
          {
            no: "01",
            title: "Zorunlu çerezler",
            text: "Oturum güvenliği ve dil tercihi gibi sitenin çalışması için gerekli çerezlerdir; devre dışı bırakılamaz. [Çerez tablosu — yer tutucu.]",
          },
          {
            no: "02",
            title: "Analitik çerezler",
            text: "Sayfa ziyaretleri ve kullanım istatistiklerini anonim olarak ölçer; yalnızca onay vermeniz hâlinde etkinleşir. [Yer tutucu.]",
          },
          {
            no: "03",
            title: "Tercih yönetimi",
            text: "Çerez tercihlerinizi sayfa altındaki çerez banner'ından veya tarayıcı ayarlarınızdan dilediğiniz zaman değiştirebilirsiniz. [Yer tutucu.]",
          },
          {
            no: "04",
            title: "Üçüncü taraf çerezleri",
            text: "Gömülü harita ve video içerikleri kendi çerezlerini kullanabilir; bu hizmetlerin politikaları ilgili sağlayıcılara aittir. [Yer tutucu.]",
          },
        ],
      },
    },
  },
];

/** Ham (locale seçilmemiş) yasal belge listesi — DB'den, başarısız olursa statik yedekten. */
export const getLegalDocumentsRaw = safeQuery(async (): Promise<LegalDocument[]> => {
  const rows = await prisma.legalDocument.findMany({ orderBy: { order: "asc" } });
  return rows.map((r) => ({
    slug: r.slug as LegalDocument["slug"],
    updatedAt: r.updatedAt,
    t: r.t as LegalDocument["t"],
  }));
}, FALLBACK_LEGAL);

export type LocalizedLegalDocument = {
  slug: LegalDocument["slug"];
  tabLabel: string;
  tag: string;
  title: string;
  intro: string;
  sections: LegalSection[];
  lastUpdated: string; // "12 TEM 2026" — belgenin kendi updatedAt'inden formatlanır
};

export async function localizedLegal(locale: Locale): Promise<LocalizedLegalDocument[]> {
  const legalDocuments = await getLegalDocumentsRaw();
  const dateFmt = new Intl.DateTimeFormat("tr-TR", {
    timeZone: "Europe/Istanbul",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  return legalDocuments.map((doc) => ({
    slug: doc.slug,
    lastUpdated: dateFmt.format(doc.updatedAt).toUpperCase(),
    ...pick(doc.t, locale),
  }));
}
