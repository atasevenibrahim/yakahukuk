import { prisma } from "@/lib/prisma";
import { safeQuery } from "@/lib/content/safe-query";
import type { Locale, Localized } from "./types";
import { pick } from "./types";

export type EducationEntry = { period: string; text: string };

export type TeamMember = {
  slug: string;
  name: string; // özel isim — yer tutucu, dile göre değişmez
  bar: string; // "Ankara Barosu"
  tags: string[]; // kart üstü kısa etiketler (büyük harf)
  areas: string[]; // detay: çalışma alanı başlıkları
  languages: string[]; // detay: konuşulan diller (büyük harf)
  articleSlugs: string[]; // detay: ilişkili makaleler
  portraitUrl?: string | null;
  t: Localized<{
    role: string; // eyebrow (büyük harf) — "KURUCU AVUKAT"
    roleShort: string; // kartta görünen kısa unvan
    bio: string[]; // biyografi paragrafları
    education: EducationEntry[];
  }>;
};

// Tüm üyeler için ortak yer tutucu biyografi/eğitim (admin panelinden doldurulacak).
const placeholderBio = [
  "Bu alan yer tutucudur; avukatın biyografisi admin panelinden düzenlenecektir. Eğitim geçmişi, baroya kabul yılı, uzmanlaştığı dava türleri ve mesleki yaklaşımı burada yer alır.",
  "İkinci paragraf: mesleki deneyim, üyelikler ve yayınlar için ayrılmıştır. [Yer tutucu metin.]",
];

const placeholderEducation: EducationEntry[] = [
  { period: "[YIL–YIL]", text: "Hukuk Fakültesi, Lisans — [Üniversite adı, yer tutucu]" },
  { period: "[YIL–YIL]", text: "Özel Hukuk, Yüksek Lisans — [Üniversite adı, yer tutucu]" },
];

// DB'ye ulaşılamazsa düşülecek statik yedek — 6 ekip üyesi, gerçek veri artık Admin İçerik'te.
const FALLBACK_TEAM: TeamMember[] = [
  {
    slug: "av-yer-tutucu-bir",
    name: "Av. Yer Tutucu Bir",
    bar: "Ankara Barosu",
    tags: ["AİLE", "TİCARET"],
    areas: ["Aile Hukuku", "Ticaret Hukuku", "Sigorta Hukuku"],
    languages: ["TÜRKÇE", "İNGİLİZCE"],
    articleSlugs: [
      "anlasmali-bosanmada-surec",
      "sirket-kurulusunda-sozlesme-titizligi",
      "police-reddinde-sigortalinin-yol-haritasi",
    ],
    t: {
      tr: {
        role: "KURUCU AVUKAT",
        roleShort: "— Yer Tutucu — Kurucu Avukat",
        bio: placeholderBio,
        education: placeholderEducation,
      },
    },
  },
  {
    slug: "av-ornek-isim-iki",
    name: "Av. Örnek İsim İki",
    bar: "Ankara Barosu",
    tags: ["CEZA", "İDARİ"],
    areas: ["Ceza Hukuku", "İdari Hukuk"],
    languages: ["TÜRKÇE", "İNGİLİZCE"],
    articleSlugs: ["vergi-incelemesinde-mukellefin-haklari"],
    t: {
      tr: {
        role: "AVUKAT",
        roleShort: "— Yer Tutucu — Avukat",
        bio: placeholderBio,
        education: placeholderEducation,
      },
    },
  },
  {
    slug: "av-ornek-isim-uc",
    name: "Av. Örnek İsim Üç",
    bar: "Ankara Barosu",
    tags: ["SİGORTA", "TÜKETİCİ"],
    areas: ["Sigorta Hukuku", "Tüketici Hukuku"],
    languages: ["TÜRKÇE"],
    articleSlugs: ["police-reddinde-sigortalinin-yol-haritasi"],
    t: {
      tr: {
        role: "AVUKAT",
        roleShort: "— Yer Tutucu — Avukat",
        bio: placeholderBio,
        education: placeholderEducation,
      },
    },
  },
  {
    slug: "av-yer-tutucu-dort",
    name: "Av. Yer Tutucu Dört",
    bar: "Ankara Barosu",
    tags: ["VERGİ", "İFLAS"],
    areas: ["Vergi Hukuku", "İflas Hukuku"],
    languages: ["TÜRKÇE", "İNGİLİZCE"],
    articleSlugs: ["vergi-incelemesinde-mukellefin-haklari"],
    t: {
      tr: {
        role: "AVUKAT",
        roleShort: "— Yer Tutucu — Avukat",
        bio: placeholderBio,
        education: placeholderEducation,
      },
    },
  },
  {
    slug: "dan-ornek-isim-bes",
    name: "Dan. Örnek İsim Beş",
    bar: "Ankara Barosu",
    tags: ["GÖÇMENLİK", "VATANDAŞLIK"],
    areas: ["Göçmenlik ve Vatandaşlık Hukuku"],
    languages: ["TÜRKÇE", "İNGİLİZCE"],
    articleSlugs: [],
    t: {
      tr: {
        role: "DANIŞMAN",
        roleShort: "— Yer Tutucu — Danışman",
        bio: placeholderBio,
        education: placeholderEducation,
      },
    },
  },
  {
    slug: "dan-yer-tutucu-alti",
    name: "Dan. Yer Tutucu Altı",
    bar: "Ankara Barosu",
    tags: ["FİKRİ MÜLKİYET"],
    areas: ["Fikri Mülkiyet Hukuku"],
    languages: ["TÜRKÇE"],
    articleSlugs: [],
    t: {
      tr: {
        role: "DANIŞMAN",
        roleShort: "— Yer Tutucu — Danışman",
        bio: placeholderBio,
        education: placeholderEducation,
      },
    },
  },
];

/** Ham (locale seçilmemiş) ekip listesi — DB'den, başarısız olursa statik yedekten. */
export const getTeamRaw = safeQuery(async (): Promise<TeamMember[]> => {
  const rows = await prisma.teamMember.findMany({
    where: { published: true },
    orderBy: { order: "asc" },
  });
  return rows.map((r) => ({
    slug: r.slug,
    name: r.name,
    bar: r.bar,
    tags: r.tags,
    areas: r.areas,
    languages: r.languages,
    articleSlugs: r.articleSlugs,
    portraitUrl: r.portraitUrl,
    t: r.t as TeamMember["t"],
  }));
}, FALLBACK_TEAM);

export type LocalizedTeamMember = {
  slug: string;
  name: string;
  bar: string;
  tags: string[];
  areas: string[];
  languages: string[];
  articleSlugs: string[];
  portraitUrl?: string | null;
  role: string;
  roleShort: string;
  bio: string[];
  education: EducationEntry[];
};

function localizeMember(member: TeamMember, locale: Locale): LocalizedTeamMember {
  return {
    slug: member.slug,
    name: member.name,
    bar: member.bar,
    tags: member.tags,
    areas: member.areas,
    languages: member.languages,
    articleSlugs: member.articleSlugs,
    portraitUrl: member.portraitUrl,
    ...pick(member.t, locale),
  };
}

export async function localizedTeam(locale: Locale): Promise<LocalizedTeamMember[]> {
  const team = await getTeamRaw();
  return team.map((member) => localizeMember(member, locale));
}

export async function teamMemberBySlug(slug: string, locale: Locale) {
  const team = await getTeamRaw();
  const member = team.find((m) => m.slug === slug);
  return member ? localizeMember(member, locale) : undefined;
}

export async function teamSlugs(): Promise<string[]> {
  const team = await getTeamRaw();
  return team.map((m) => m.slug);
}
