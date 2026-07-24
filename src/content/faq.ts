import { prisma } from "@/lib/prisma";
import { safeQuery } from "@/lib/content/safe-query";
import type { Locale, Localized } from "./types";
import { pick } from "./types";

export type FaqItem = {
  slug: string;
  t: Localized<{ question: string; answer: string }>;
};

export type FaqCategory = {
  slug: string;
  t: Localized<{ name: string }>;
  items: FaqItem[];
};

// DB'ye ulaşılamazsa düşülecek statik yedek — 4 kategori, gerçek veri artık Admin İçerik'te.
const FALLBACK_FAQ: FaqCategory[] = [
  {
    slug: "genel",
    t: { tr: { name: "Genel" } },
    items: [
      {
        slug: "ilk-gorusme-ucretli-mi",
        t: {
          tr: {
            question: "İlk görüşme ücretli mi?",
            answer:
              "Ön görüşme koşulları dosya türüne göre değişir. Randevu oluştururken size net bilgi verilir; sürpriz ücret yoktur. [Yer tutucu — admin panelinden düzenlenecek.]",
          },
        },
      },
      {
        slug: "hangi-sehirlerde-hizmet",
        t: {
          tr: {
            question: "Büronuz hangi şehirlerde hizmet veriyor?",
            answer:
              "Ofisimiz Ankara Beştepe'dedir; ancak dava takibi gereken durumlarda diğer şehirlerdeki duruşmalara da katılırız. Görüntülü görüşme ile uzaktan danışmanlık da mümkündür.",
          },
        },
      },
      {
        slug: "dosya-takibi",
        t: {
          tr: {
            question: "Dosyamın durumunu nasıl takip edebilirim?",
            answer:
              "Her önemli gelişmede sizi telefon veya e-posta ile bilgilendiririz. Dilediğinizde 7/24 hattımızdan da bilgi alabilirsiniz.",
          },
        },
      },
      {
        slug: "ucretlendirme-nasil",
        t: {
          tr: {
            question: "Ücretlendirme nasıl belirleniyor?",
            answer:
              "Ücret; dosyanın niteliği, kapsamı ve tahmini süresine göre, Türkiye Barolar Birliği asgari ücret tarifesi gözetilerek belirlenir ve yazılı sözleşmeyle netleştirilir.",
          },
        },
      },
    ],
  },
  {
    slug: "randevu",
    t: { tr: { name: "Randevu" } },
    items: [
      {
        slug: "randevu-nasil-olusturulur",
        t: {
          tr: {
            question: "Randevuyu nasıl oluşturabilirim?",
            answer:
              "Sitedeki \"Randevu Al\" adımlarını izleyerek takvimden uygun gün ve saati seçebilirsiniz. Telefonla da randevu oluşturabiliriz.",
          },
        },
      },
      {
        slug: "randevu-iptal-erteleme",
        t: {
          tr: {
            question: "Randevumu iptal edebilir veya erteleyebilir miyim?",
            answer:
              "Evet. Randevu saatinizden en az 24 saat önce bize ulaşmanız yeterlidir; yeni bir slot birlikte belirlenir.",
          },
        },
      },
      {
        slug: "gorusmeye-ne-getirmeliyim",
        t: {
          tr: {
            question: "Görüşmeye gelirken ne getirmeliyim?",
            answer:
              "Dosyanızla ilgili tüm belgelerin (sözleşme, tebligat, yazışma, dava evrakı) asıl veya kopyalarını getirmeniz değerlendirmeyi hızlandırır.",
          },
        },
      },
    ],
  },
  {
    slug: "dava-sureci",
    t: { tr: { name: "Dava Süreci" } },
    items: [
      {
        slug: "davam-ne-kadar-surer",
        t: {
          tr: {
            question: "Davam ne kadar sürer?",
            answer:
              "Süre; mahkemenin iş yükü, dosyanın niteliği ve delil durumuna göre değişir. İlk değerlendirmede size gerçekçi bir tahmin sunar, süreci şeffaf yürütürüz.",
          },
        },
      },
      {
        slug: "durusmalara-katilim-zorunlu-mu",
        t: {
          tr: {
            question: "Duruşmalara katılmam zorunlu mu?",
            answer:
              "Çoğu duruşmada vekiliniz olarak biz hazır bulunuruz; hâkimin bizzat dinlemek istediği hâller (ör. anlaşmalı boşanma) ayrıca bildirilir.",
          },
        },
      },
      {
        slug: "arabuluculuk-nedir",
        t: {
          tr: {
            question: "Arabuluculuk nedir, zorunlu mu?",
            answer:
              "Bazı uyuşmazlıklarda (işçi-işveren, ticari, tüketici) dava açmadan önce arabulucuya başvurmak zorunludur. Süreci sizin adınıza yönetiriz.",
          },
        },
      },
    ],
  },
  {
    slug: "gizlilik-kvkk",
    t: { tr: { name: "Gizlilik & KVKK" } },
    items: [
      {
        slug: "bilgilerim-guvende-mi",
        t: {
          tr: {
            question: "Paylaştığım bilgiler güvende mi?",
            answer:
              "Evet. Tüm bilgileriniz avukat-müvekkil gizliliği ve meslek sırrı kapsamında korunur; üçüncü kişilerle paylaşılmaz.",
          },
        },
      },
      {
        slug: "kisisel-verilerim-nasil-isleniyor",
        t: {
          tr: {
            question: "Kişisel verilerim nasıl işleniyor?",
            answer:
              "Verileriniz KVKK'ya uygun olarak, yalnızca hukuki hizmetin gerektirdiği ölçüde işlenir. Ayrıntılar Aydınlatma Metni'nde yer alır.",
          },
        },
      },
    ],
  },
];

/** Ham (locale seçilmemiş) SSS kategorileri (iç içe maddelerle) — DB'den, başarısız olursa yedekten. */
export const getFaqCategoriesRaw = safeQuery(async (): Promise<FaqCategory[]> => {
  const rows = await prisma.faqCategory.findMany({
    orderBy: { order: "asc" },
    include: { items: { where: { published: true }, orderBy: { order: "asc" } } },
  });
  return rows.map((cat) => ({
    slug: cat.slug,
    t: cat.t as FaqCategory["t"],
    items: cat.items.map((item) => ({ slug: item.slug, t: item.t as FaqItem["t"] })),
  }));
}, FALLBACK_FAQ);

export type LocalizedFaqCategory = {
  slug: string;
  name: string;
  items: { slug: string; question: string; answer: string }[];
};

export async function localizedFaq(locale: Locale): Promise<LocalizedFaqCategory[]> {
  const faqCategories = await getFaqCategoriesRaw();
  return faqCategories.map((cat) => ({
    slug: cat.slug,
    name: pick(cat.t, locale).name,
    items: cat.items.map((item) => ({
      slug: item.slug,
      ...pick(item.t, locale),
    })),
  }));
}
