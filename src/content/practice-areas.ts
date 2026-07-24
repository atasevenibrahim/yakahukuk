import type { IconName } from "@/lib/icons";
import { getPathname } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { safeQuery } from "@/lib/content/safe-query";
import type { Locale, Localized } from "./types";
import { pick } from "./types";
import { getTeamRaw } from "./team";

export type PracticeArea = {
  slug: string;
  icon: IconName;
  featured: boolean;
  t: Localized<{
    title: string;
    excerpt: string;
    whatWeDo: string[];
    typicalCases: string[];
  }>;
};

// DB'ye ulaşılamazsa (ör. build anında) düşülecek statik yedek — 12 çalışma alanı, mega menü
// sırasıyla aynı. Gerçek veri artık Admin İçerik üzerinden `PracticeArea` tablosunda yönetilir.
const FALLBACK_PRACTICE_AREAS: PracticeArea[] = [
  {
    slug: "aile-hukuku",
    icon: "heart",
    featured: true,
    t: {
      tr: {
        title: "Aile Hukuku",
        excerpt:
          "Boşanma, velayet, nafaka ve mal paylaşımında sakin ve koruyucu temsil.",
        whatWeDo: [
          "Aile hukuku, hukukun en hassas alanıdır; çünkü dosyanın öbür tarafında hayatınız vardır. Süreci hızlandırmak kadar, sizi ve varsa çocuklarınızı korumak da önceliğimizdir. [Yer tutucu — alan açıklaması admin panelinden düzenlenecektir.]",
          "Her dosyada önce uzlaşma zeminini yoklar, dava kaçınılmazsa hakkınızı sonuna kadar savunuruz.",
        ],
        typicalCases: [
          "Anlaşmalı ve çekişmeli boşanma davaları",
          "Velayet, kişisel ilişki ve iştirak nafakası",
          "Mal rejimi tasfiyesi ve katılma alacağı",
          "Ailenin korunmasına yönelik tedbir kararları (6284)",
          "Nişan, evlat edinme, soybağı ve vesayet işleri",
        ],
      },
    },
  },
  {
    slug: "ceza-hukuku",
    icon: "gavel",
    featured: true,
    t: {
      tr: {
        title: "Ceza Hukuku",
        excerpt:
          "Soruşturmadan istinafa, savunmanızın her aşamasında yanınızdayız.",
        whatWeDo: [
          "Ceza yargılaması, haklarınızın en dikkatli şekilde korunması gereken alandır; soruşturma aşamasındaki her adım, davanın sonucunu doğrudan etkiler. [Yer tutucu — alan açıklaması admin panelinden düzenlenecektir.]",
          "Savunma stratejisini dosyanın özelliklerine göre kurar, sürecin her duruşmasında hazır bulunuruz.",
        ],
        typicalCases: [
          "İfade ve sorgu süreçlerinde müdafilik",
          "Tutuklama ve adli kontrol itirazları",
          "Ağır ceza ve asliye ceza davalarında savunma",
          "İstinaf ve temyiz başvuruları",
          "Uzlaştırma ve etkin pişmanlık süreçleri",
        ],
      },
    },
  },
  {
    slug: "fikri-mulkiyet-hukuku",
    icon: "lightbulb",
    featured: false,
    t: {
      tr: {
        title: "Fikri Mülkiyet Hukuku",
        excerpt:
          "Marka, patent ve telif haklarının tescili ile ihlallere karşı korunması.",
        whatWeDo: [
          "Markanız, tasarımınız ya da eseriniz emeğinizin karşılığıdır. Tescilden ihlale karşı korunmaya kadar fikri mülkiyet haklarınızın güvence altında olmasını sağlarız. [Yer tutucu — alan açıklaması admin panelinden düzenlenecektir.]",
          "Tescil sürecini baştan doğru kurgular, olası itiraz ve ihlal risklerine karşı önceden önlem alırız.",
        ],
        typicalCases: [
          "Marka ve tasarım tescil başvuruları",
          "Marka ve patent ihlali davaları",
          "Telif hakkı ihlallerine karşı hukuki takip",
          "Lisans ve devir sözleşmeleri",
          "Haksız rekabet davaları",
        ],
      },
    },
  },
  {
    slug: "gocmenlik-ve-vatandaslik-hukuku",
    icon: "globe",
    featured: false,
    t: {
      tr: {
        title: "Göçmenlik ve Vatandaşlık Hukuku",
        excerpt:
          "Oturma izni, vatandaşlık ve çalışma izni süreçlerinde uçtan uca danışmanlık.",
        whatWeDo: [
          "Türkiye'de yaşamak, çalışmak ya da vatandaşlık kazanmak isteyen herkes için süreç, doğru evrak ve doğru zamanlama kadar sabır da ister. [Yer tutucu — alan açıklaması admin panelinden düzenlenecektir.]",
          "Dosyanızı baştan uca planlar, olası ret risklerine karşı önceden hazırlıklı ilerleriz.",
        ],
        typicalCases: [
          "Oturma ve çalışma izni başvuruları",
          "İstisnai yolla Türk vatandaşlığı başvuruları",
          "Yabancılara mülk edinimi danışmanlığı",
          "Sınır dışı etme kararlarına itiraz",
          "Uluslararası koruma (sığınma) başvuruları",
        ],
      },
    },
  },
  {
    slug: "idari-hukuk",
    icon: "landmark",
    featured: true,
    t: {
      tr: {
        title: "İdari Hukuk",
        excerpt:
          "İptal ve tam yargı davalarında idare karşısında dengeyi kurarız.",
        whatWeDo: [
          "İdarenin işlem ve eylemleri karşısında hakkınızı aramak, doğru süre ve doğru dilekçeyle mümkündür. İdari yargıda dengeyi sizin lehinize kurarız. [Yer tutucu — alan açıklaması admin panelinden düzenlenecektir.]",
          "Süreci başından takip eder, idari başvuru aşamasını atlamadan doğru stratejiyle ilerleriz.",
        ],
        typicalCases: [
          "İptal ve tam yargı davaları",
          "İdari para cezalarına itiraz",
          "Kamulaştırma ve kamulaştırmasız el atma davaları",
          "İhale ve kamu sözleşmeleri uyuşmazlıkları",
          "Memur disiplin işlemlerine itiraz",
        ],
      },
    },
  },
  {
    slug: "iflas-hukuku",
    icon: "trendingDown",
    featured: false,
    t: {
      tr: {
        title: "İflas Hukuku",
        excerpt:
          "Konkordato, yeniden yapılandırma ve tasfiye süreçlerinde stratejik yönetim.",
        whatWeDo: [
          "Finansal zorluk, doğru yönetildiğinde bir sona değil, yeniden yapılanmaya giden bir sürece dönüşebilir. Konkordato ve iflas süreçlerinde stratejik destek sunarız. [Yer tutucu — alan açıklaması admin panelinden düzenlenecektir.]",
          "Alacaklı ya da borçlu tarafında, dosyanızın hukuki ve mali boyutunu birlikte değerlendiririz.",
        ],
        typicalCases: [
          "Konkordato başvurusu ve süreç yönetimi",
          "İflas ve iflasın ertelenmesi davaları",
          "İcra takibi ve haciz işlemleri",
          "Alacaklılar toplantısı temsili",
          "Yeniden yapılandırma sözleşmeleri",
        ],
      },
    },
  },
  {
    slug: "istinaf-hukuku",
    icon: "layers",
    featured: false,
    t: {
      tr: {
        title: "İstinaf Hukuku",
        excerpt:
          "Kararların istinaf ve temyiz incelemesinde titiz dilekçe ve takip.",
        whatWeDo: [
          "İlk derece mahkemesi kararı, dosyanın son sözü olmak zorunda değildir. İstinaf ve temyiz aşamasında dosyanızı titizlikle yeniden değerlendiririz. [Yer tutucu — alan açıklaması admin panelinden düzenlenecektir.]",
          "Kanun yolu dilekçelerini, ilk derece dosyasındaki her ayrıntıyı gözden geçirerek hazırlarız.",
        ],
        typicalCases: [
          "İstinaf başvurusu ve dilekçe hazırlığı",
          "Yargıtay temyiz süreçleri",
          "Duruşmalı istinaf incelemesi talepleri",
          "Kanun yararına bozma başvuruları",
          "İcranın geri bırakılması talepleri",
        ],
      },
    },
  },
  {
    slug: "kisisel-yaralanma-ve-mulk-hasari",
    icon: "heartPulse",
    featured: false,
    t: {
      tr: {
        title: "Kişisel Yaralanma ve Mülk Hasarı",
        excerpt:
          "Kaza, yaralanma ve mal hasarı tazminatlarında hakkınızın peşindeyiz.",
        whatWeDo: [
          "Bir kaza ya da olay sonucu yaşadığınız yaralanma veya maddi kayıp, hakkınız olan tazminatla telafi edilmelidir. Sürecin her aşamasında hakkınızın takipçisi oluruz. [Yer tutucu — alan açıklaması admin panelinden düzenlenecektir.]",
          "Zarar tespitinden tazminat hesaplamasına, dosyanızı bilirkişi süreciyle birlikte yönetiriz.",
        ],
        typicalCases: [
          "Trafik kazası tazminat davaları",
          "İş kazası ve meslek hastalığı tazminatları",
          "Malpraktis (hekim hatası) davaları",
          "Mülk hasarı ve sigorta rücu davaları",
          "Manevi tazminat talepleri",
        ],
      },
    },
  },
  {
    slug: "sigorta-hukuku",
    icon: "umbrella",
    featured: true,
    t: {
      tr: {
        title: "Sigorta Hukuku",
        excerpt:
          "Poliçe uyuşmazlıkları ve tazminat süreçlerinde hakkınızın takipçisiyiz.",
        whatWeDo: [
          "Poliçenizin kapsamı kadar, hak talebinizin doğru ileri sürülmesi de önemlidir. Sigorta şirketleri karşısında hakkınızın takipçisi oluruz. [Yer tutucu — alan açıklaması admin panelinden düzenlenecektir.]",
          "Ret gerekçesini hukuki ve teknik açıdan değerlendirir, itiraz ve dava sürecini birlikte yürütürüz.",
        ],
        typicalCases: [
          "Poliçe ret kararlarına itiraz",
          "Kasko ve trafik sigortası tazminat davaları",
          "Hayat ve sağlık sigortası uyuşmazlıkları",
          "Sigorta tahkim komisyonu başvuruları",
          "Rücu davalarına karşı savunma",
        ],
      },
    },
  },
  {
    slug: "ticaret-hukuku",
    icon: "briefcase",
    featured: true,
    t: {
      tr: {
        title: "Ticaret Hukuku",
        excerpt:
          "Şirket kuruluşu, sözleşmeler ve ticari uyuşmazlıklarda güvenli zemin.",
        whatWeDo: [
          "Şirketinizin kuruluşundan günlük ticari ilişkilerine kadar, sağlam bir hukuki zemin güven verir. Sözleşmelerinizi ve uyuşmazlıklarınızı aynı titizlikle ele alırız. [Yer tutucu — alan açıklaması admin panelinden düzenlenecektir.]",
          "Ticari ilişkinin niteliğine göre önce sözleşmesel çözüm arar, gerektiğinde dava sürecini yönetiriz.",
        ],
        typicalCases: [
          "Şirket kuruluşu ve ortaklık sözleşmeleri",
          "Ticari sözleşme hazırlığı ve müzakeresi",
          "Alacak ve tazminat davaları",
          "Şirketler arası uyuşmazlıklar",
          "Birleşme ve devralma danışmanlığı",
        ],
      },
    },
  },
  {
    slug: "tuketici-hukuku",
    icon: "shoppingBag",
    featured: false,
    t: {
      tr: {
        title: "Tüketici Hukuku",
        excerpt:
          "Ayıplı mal ve hizmet, cayma hakkı ve hakem heyeti süreçlerinde destek.",
        whatWeDo: [
          "Aldığınız mal ya da hizmetin ayıplı çıkması, hakkınızı aramaktan vazgeçmenizi gerektirmez. Tüketici olarak haklarınızı sonuna kadar savunuruz. [Yer tutucu — alan açıklaması admin panelinden düzenlenecektir.]",
          "Hakem heyeti başvurusundan tüketici mahkemesi sürecine, dosyanızı en hızlı yoldan sonuca taşırız.",
        ],
        typicalCases: [
          "Ayıplı mal ve hizmet talepleri",
          "Tüketici hakem heyeti başvuruları",
          "Abonelik ve mesafeli satış uyuşmazlıkları",
          "Kapıdan satış ve cayma hakkı süreçleri",
          "Tüketici kredisi ve banka uyuşmazlıkları",
        ],
      },
    },
  },
  {
    slug: "vergi-hukuku",
    icon: "receipt",
    featured: true,
    t: {
      tr: {
        title: "Vergi Hukuku",
        excerpt:
          "Vergi incelemesi, uzlaşma ve davalarda mükellef haklarını savunuruz.",
        whatWeDo: [
          "Vergi incelemesi karşısında mükellef olarak haklarınızı bilmek, sürecin seyrini değiştirir. İncelemeden uzlaşmaya, her aşamada yanınızdayız. [Yer tutucu — alan açıklaması admin panelinden düzenlenecektir.]",
          "Vergi/ceza ihbarnamesi sonrası süreci; uzlaşma, dava ya da düzeltme yollarından size en uygun olanla yürütürüz.",
        ],
        typicalCases: [
          "Vergi incelemesi ve tarhiyat öncesi/sonrası uzlaşma",
          "Vergi ve ceza davalarında dava açma",
          "Vergi cezalarına karşı itiraz",
          "Şirket birleşme/devirlerinde vergisel danışmanlık",
          "Gümrük vergisi uyuşmazlıkları",
        ],
      },
    },
  },
];

/** Ham (locale seçilmemiş) çalışma alanı listesi — DB'den, başarısız olursa statik yedekten. */
export const getPracticeAreasRaw = safeQuery(async (): Promise<PracticeArea[]> => {
  const rows = await prisma.practiceArea.findMany({
    where: { published: true },
    orderBy: { order: "asc" },
  });
  return rows.map((r) => ({
    slug: r.slug,
    icon: r.icon as IconName,
    featured: r.featured,
    t: r.t as PracticeArea["t"],
  }));
}, FALLBACK_PRACTICE_AREAS);

export type LocalizedPracticeArea = {
  slug: string;
  icon: IconName;
  featured: boolean;
  title: string;
  excerpt: string;
  whatWeDo: string[];
  typicalCases: string[];
  href: string;
};

function localizeArea(area: PracticeArea, locale: Locale): LocalizedPracticeArea {
  return {
    slug: area.slug,
    icon: area.icon,
    featured: area.featured,
    href: getPathname({
      href: { pathname: "/calisma-alanlari/[slug]", params: { slug: area.slug } },
      locale,
    }),
    ...pick(area.t, locale),
  };
}

export async function localizedPracticeAreas(locale: Locale): Promise<LocalizedPracticeArea[]> {
  const areas = await getPracticeAreasRaw();
  return areas.map((area) => localizeArea(area, locale));
}

export async function practiceAreaBySlug(slug: string, locale: Locale) {
  const areas = await getPracticeAreasRaw();
  const area = areas.find((a) => a.slug === slug);
  return area ? localizeArea(area, locale) : undefined;
}

export async function practiceAreaSlugs(): Promise<string[]> {
  const areas = await getPracticeAreasRaw();
  return areas.map((a) => a.slug);
}

/** Bir çalışma alanının (TR başlığı üzerinden) ilgili ekip üyesi slug'ları. */
export async function relatedTeamSlugsForArea(areaSlug: string): Promise<string[]> {
  const [areas, team] = await Promise.all([getPracticeAreasRaw(), getTeamRaw()]);
  const area = areas.find((a) => a.slug === areaSlug);
  if (!area) return [];
  const trTitle = area.t.tr.title;
  return team.filter((m) => m.areas.includes(trTitle)).map((m) => m.slug);
}
