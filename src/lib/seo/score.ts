import { parseMarkdown, markdownToPlainText, type InlineSpan } from "@/lib/markdown";
import { slugify } from "@/lib/admin/slugify";
import { buildVerificationReport } from "@/lib/ai/citations";

/**
 * Makale SEO analizi — tamamı saf fonksiyon, birim test edilebilir, AI çağrısı yok.
 *
 * Amaç: uzman olmayan birinin tek bir sayıya ve renkli satırlara bakarak "bu makale yayına
 * hazır mı?" sorusunu yanıtlayabilmesi. Bu yüzden her denetim somut ve düzeltilebilir bir
 * eylem söyler ("odak kelime ilk paragrafta geçmiyor"), soyut bir puan değil.
 *
 * Gövde markdown olarak geldiği için yapı analizi `parseMarkdown` üzerinden yapılıyor —
 * başlıklar ve bağlantılar metin eşlemesiyle tahmin edilmiyor, gerçek AST'ten okunuyor.
 */

// Google'ın masaüstü arama sonucunda pratikte kestiği yaklaşık karakter sınırları.
export const SERP_TITLE_LIMIT = 60;
export const SERP_DESCRIPTION_LIMIT = 158;

/** Ortalama okuma hızı (kelime/dakika) — okuma süresi bundan hesaplanır. */
const WORDS_PER_MINUTE = 200;

const TR_VOWELS = "aeıioöuüAEIİOÖUÜ";

export type CheckStatus = "ok" | "warn" | "fail";

export type SeoCheck = {
  id: string;
  label: string;
  status: CheckStatus;
  /** Ne yapılması gerektiğini söyleyen kısa açıklama. */
  detail: string;
  weight: number;
  earned: number;
};

export type SeoAnalysis = {
  /** 0-100 ağırlıklı skor. */
  score: number;
  checks: SeoCheck[];
  wordCount: number;
  /** Kelime sayısından hesaplanan okuma süresi (dakika, en az 1). */
  readMinutes: number;
  /** Ateşman okunabilirlik puanı (Türkçe Flesch karşılığı) ve etiketi. */
  readability: { score: number; label: string };
  internalLinks: number;
  externalLinks: number;
  headings: { level: 2 | 3; text: string }[];
  placeholderCount: number;
  citationCount: number;
  serp: { title: string; description: string; url: string; titleTruncated: boolean; descriptionTruncated: boolean };
};

export type SeoInput = {
  title: string;
  slug: string;
  body: string;
  excerpt: string;
  metaTitle: string;
  metaDescription: string;
  focusKeyword: string;
  /** Yayınlanacak adres için taban — SERP önizlemesinde gösterilir. */
  baseUrl: string;
  /** Makale yolunun locale önekiyle birlikte hâli, ör. "/makaleler". */
  pathPrefix?: string;
};

// ---------------------------------------------------------------------------
// Metin ölçümleri
// ---------------------------------------------------------------------------

function normalize(text: string): string {
  return text.toLocaleLowerCase("tr").replace(/\s+/g, " ").trim();
}

export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

export function countSentences(text: string): number {
  const matches = text.match(/[^.!?…]+[.!?…]+/g);
  const count = matches ? matches.length : 0;
  // Noktalama olmadan yazılmış tek bir blok da bir cümle sayılır (bölme sıfır olmasın).
  return count > 0 ? count : text.trim() ? 1 : 0;
}

/** Türkçede hece sayısı sesli harf sayısına eşittir — bu dilde güvenilir bir kestirim. */
export function countSyllables(text: string): number {
  let total = 0;
  for (const ch of text) {
    if (TR_VOWELS.includes(ch)) total += 1;
  }
  return total;
}

/**
 * Ateşman okunabilirlik formülü (Türkçe için Flesch uyarlaması):
 *   198.825 − 40.175·(hece/kelime) − 2.610·(kelime/cümle)
 * Sonuç 0-100 aralığına kırpılır.
 */
export function atesmanScore(plainText: string): number {
  const words = countWords(plainText);
  const sentences = countSentences(plainText);
  if (words === 0 || sentences === 0) return 0;

  const syllables = countSyllables(plainText);
  const raw = 198.825 - 40.175 * (syllables / words) - 2.61 * (words / sentences);
  return Math.max(0, Math.min(100, Math.round(raw * 10) / 10));
}

export function readabilityLabel(score: number): string {
  if (score >= 90) return "Çok kolay";
  if (score >= 70) return "Kolay";
  if (score >= 50) return "Orta";
  if (score >= 30) return "Zor";
  return "Çok zor";
}

// ---------------------------------------------------------------------------
// Yapı analizi
// ---------------------------------------------------------------------------

function spansToText(spans: InlineSpan[]): string {
  return spans.map((s) => s.text).join("");
}

type Structure = {
  headings: { level: 2 | 3; text: string }[];
  internalLinks: number;
  externalLinks: number;
  firstParagraph: string;
  /** h3'ten önce hiç h2 gelmemişse başlık hiyerarşisi bozuktur. */
  hierarchyValid: boolean;
  hasList: boolean;
};

export function analyzeStructure(body: string): Structure {
  const nodes = parseMarkdown(body);
  const headings: Structure["headings"] = [];
  let internalLinks = 0;
  let externalLinks = 0;
  let firstParagraph = "";
  let seenH2 = false;
  let hierarchyValid = true;
  let hasList = false;

  for (const node of nodes) {
    if (node.type === "heading") {
      headings.push({ level: node.level, text: spansToText(node.spans) });
      if (node.level === 2) seenH2 = true;
      else if (!seenH2) hierarchyValid = false;
    }

    if (node.type === "list") {
      hasList = true;
      for (const item of node.items) countLinks(item);
      continue;
    }

    if (node.type === "paragraph" && !firstParagraph) {
      firstParagraph = spansToText(node.spans);
    }
    countLinks(node.spans);
  }

  function countLinks(spans: InlineSpan[]) {
    for (const span of spans) {
      if (span.type !== "link") continue;
      if (/^https?:\/\//i.test(span.href)) externalLinks += 1;
      else internalLinks += 1;
    }
  }

  return { headings, internalLinks, externalLinks, firstParagraph, hierarchyValid, hasList };
}

// ---------------------------------------------------------------------------
// Denetimler
// ---------------------------------------------------------------------------

function check(
  id: string,
  label: string,
  weight: number,
  outcome: { status: CheckStatus; detail: string; ratio?: number },
): SeoCheck {
  const ratio = outcome.ratio ?? (outcome.status === "ok" ? 1 : outcome.status === "warn" ? 0.5 : 0);
  return {
    id,
    label,
    status: outcome.status,
    detail: outcome.detail,
    weight,
    earned: Math.round(weight * ratio * 100) / 100,
  };
}

function lengthCheck(
  id: string,
  label: string,
  weight: number,
  value: string,
  min: number,
  max: number,
): SeoCheck {
  const len = value.trim().length;
  if (len === 0) {
    return check(id, label, weight, { status: "fail", detail: "Boş — doldurulmalı." });
  }
  if (len < min) {
    return check(id, label, weight, {
      status: "warn",
      detail: `${len} karakter — kısa. ${min}-${max} arası ideal.`,
      ratio: 0.5,
    });
  }
  if (len > max) {
    return check(id, label, weight, {
      status: "warn",
      detail: `${len} karakter — Google sonuçta kesebilir. ${min}-${max} arası ideal.`,
      ratio: 0.5,
    });
  }
  return check(id, label, weight, { status: "ok", detail: `${len} karakter — ideal aralıkta.` });
}

export function analyzeSeo(input: SeoInput): SeoAnalysis {
  const plain = markdownToPlainText(input.body);
  const structure = analyzeStructure(input.body);
  const wordCount = countWords(plain);
  const readMinutes = Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE));
  const readabilityScore = atesmanScore(plain);
  const verification = buildVerificationReport(input.body);

  const keyword = input.focusKeyword.trim();
  const nk = normalize(keyword);
  const hasBody = wordCount > 0;
  const checks: SeoCheck[] = [];

  // --- Odak kelime (toplam 25) ---------------------------------------------
  if (!keyword) {
    checks.push(
      check("focus-missing", "Odak anahtar kelime", 25, {
        status: "fail",
        detail: "Belirlenmemiş. Okuyucunun Google'a yazacağı ifadeyi girin — denetimlerin çoğu buna bağlı.",
      }),
    );
  } else {
    const inTitle = normalize(input.title).includes(nk);
    const inSlug = input.slug ? slugify(input.slug).includes(slugify(keyword)) : false;
    const inFirst = normalize(structure.firstParagraph).includes(nk);
    const inHeading = structure.headings.some((h) => normalize(h.text).includes(nk));
    const inMeta = normalize(input.metaDescription).includes(nk);

    checks.push(
      check("focus-title", "Odak kelime başlıkta", 8, {
        status: inTitle ? "ok" : "fail",
        detail: inTitle ? "Başlıkta geçiyor." : "Başlıkta geçmiyor — en güçlü sinyal budur.",
      }),
      check("focus-slug", "Odak kelime adreste", 5, {
        status: inSlug ? "ok" : "warn",
        detail: inSlug ? "Adreste geçiyor." : "Adreste geçmiyor. Yayınlanmış bir makalenin adresini değiştirmeyin.",
        ratio: inSlug ? 1 : 0.3,
      }),
      check("focus-first-paragraph", "Odak kelime ilk paragrafta", 6, {
        status: inFirst ? "ok" : "fail",
        detail: inFirst
          ? "İlk paragrafta geçiyor."
          : "İlk paragrafta geçmiyor — konuyu ilk cümlelerde adıyla söyleyin.",
      }),
      check("focus-heading", "Odak kelime bir ara başlıkta", 3, {
        status: inHeading ? "ok" : "warn",
        detail: inHeading ? "Ara başlıkta geçiyor." : "Hiçbir ara başlıkta geçmiyor.",
      }),
      check("focus-meta", "Odak kelime meta açıklamada", 3, {
        status: inMeta ? "ok" : "warn",
        detail: inMeta ? "Meta açıklamada geçiyor." : "Meta açıklamada geçmiyor.",
      }),
    );
  }

  // --- Meta alanlar (toplam 20) --------------------------------------------
  checks.push(
    lengthCheck("meta-title", "Meta başlık uzunluğu", 7, input.metaTitle || input.title, 30, SERP_TITLE_LIMIT),
    lengthCheck("meta-description", "Meta açıklama uzunluğu", 7, input.metaDescription, 120, SERP_DESCRIPTION_LIMIT),
    lengthCheck("excerpt", "Özet uzunluğu", 6, input.excerpt, 80, 200),
  );

  // --- Yapı (toplam 20) -----------------------------------------------------
  const h2Count = structure.headings.filter((h) => h.level === 2).length;
  checks.push(
    check("word-count", "Metin uzunluğu", 8, {
      status: wordCount >= 600 ? "ok" : wordCount >= 350 ? "warn" : "fail",
      detail:
        wordCount >= 600
          ? `${wordCount} kelime — yeterli.`
          : `${wordCount} kelime. Konuyu gerçekten kapsamak için 600+ hedefleyin.`,
      ratio: wordCount >= 600 ? 1 : wordCount >= 350 ? 0.5 : 0,
    }),
    check("headings", "Ara başlıklar", 6, {
      status: h2Count >= 3 ? "ok" : h2Count >= 1 ? "warn" : "fail",
      detail:
        h2Count >= 3
          ? `${h2Count} ara başlık — okunabilir bölümlenmiş.`
          : `${h2Count} ara başlık. Metni "## " ile 3-5 bölüme ayırın.`,
      ratio: h2Count >= 3 ? 1 : h2Count >= 1 ? 0.5 : 0,
    }),
    // `hasBody` gateleri kasıtlı: boş bir makalede "hiyerarşi bozuk değil" ya da "işaretçi
    // yok" teknik olarak doğru ama yokluktan puan kazandırmak yanıltıcı olurdu — boş makale
    // 0 almalı.
    check("hierarchy", "Başlık hiyerarşisi", 3, {
      status: !hasBody ? "fail" : structure.hierarchyValid ? "ok" : "fail",
      detail: !hasBody
        ? "Metin yok."
        : structure.hierarchyValid
          ? "Geçerli."
          : "Bir alt başlık (###) kendisinden önce gelen bir ana başlık (##) olmadan kullanılmış.",
    }),
    check("list", "Liste kullanımı", 3, {
      status: !hasBody ? "fail" : structure.hasList ? "ok" : "warn",
      detail: !hasBody
        ? "Metin yok."
        : structure.hasList
          ? "Metinde liste var."
          : "Liste yok. Adımları veya gerekenleri madde madde yazmak okunurluğu artırır.",
    }),
  );

  // --- Bağlantı (toplam 15) -------------------------------------------------
  checks.push(
    check("internal-links", "İç bağlantı", 15, {
      status: structure.internalLinks >= 2 ? "ok" : structure.internalLinks === 1 ? "warn" : "fail",
      detail:
        structure.internalLinks >= 2
          ? `${structure.internalLinks} iç bağlantı var.`
          : structure.internalLinks === 1
            ? "1 iç bağlantı var. 2-4 arası ideal."
            : "Hiç iç bağlantı yok. İlgili çalışma alanı veya makalelere bağlantı verin.",
      ratio: structure.internalLinks >= 2 ? 1 : structure.internalLinks === 1 ? 0.5 : 0,
    }),
  );

  // --- Okunabilirlik (toplam 10) -------------------------------------------
  checks.push(
    check("readability", "Okunabilirlik (Ateşman)", 10, {
      status: readabilityScore >= 50 ? "ok" : readabilityScore >= 35 ? "warn" : "fail",
      detail: `${readabilityScore} — ${readabilityLabel(readabilityScore)}. ${
        readabilityScore >= 50
          ? "Hukukçu olmayan bir okuyucu için uygun."
          : "Cümleleri kısaltın; bir cümlede tek fikir olsun."
      }`,
      ratio: readabilityScore >= 50 ? 1 : readabilityScore >= 35 ? 0.5 : 0,
    }),
  );

  // --- Doğrulama (toplam 10) -----------------------------------------------
  checks.push(
    check("verification", "Doğrulanmamış bilgi", 10, {
      status: !hasBody || verification.placeholders.length > 0 ? "fail" : "ok",
      detail: !hasBody
        ? "Metin yok."
        : verification.placeholders.length > 0
          ? `${verification.placeholders.length} adet [DOĞRULANACAK] işaretçisi var — bu makale yayınlanamaz.`
          : "Eksik bilgi işaretçisi yok.",
    }),
  );

  const totalWeight = checks.reduce((sum, c) => sum + c.weight, 0);
  const earned = checks.reduce((sum, c) => sum + c.earned, 0);
  const score = totalWeight === 0 ? 0 : Math.round((earned / totalWeight) * 100);

  const serpTitle = (input.metaTitle || input.title).trim();
  const serpDescription = (input.metaDescription || input.excerpt).trim();
  const prefix = input.pathPrefix ?? "/makaleler";

  return {
    score,
    checks,
    wordCount,
    readMinutes,
    readability: { score: readabilityScore, label: readabilityLabel(readabilityScore) },
    internalLinks: structure.internalLinks,
    externalLinks: structure.externalLinks,
    headings: structure.headings,
    placeholderCount: verification.placeholders.length,
    citationCount: verification.citations.length,
    serp: {
      title: serpTitle,
      description: serpDescription,
      url: `${input.baseUrl}${prefix}/${input.slug || slugify(input.title)}`,
      titleTruncated: serpTitle.length > SERP_TITLE_LIMIT,
      descriptionTruncated: serpDescription.length > SERP_DESCRIPTION_LIMIT,
    },
  };
}

/**
 * Markdown gövdesinden okuma süresini hesaplar. Biçimlendirme karakterleri (`##`, `**`,
 * bağlantı yolları) sayıma girmesin diye önce düz metne çevrilir.
 */
export function readMinutesOf(body: string): number {
  return Math.max(1, Math.ceil(countWords(markdownToPlainText(body)) / WORDS_PER_MINUTE));
}

/** Skor bandı — halka rengini ve etiketi belirler. */
export function scoreBand(score: number): { label: string; color: string } {
  if (score >= 80) return { label: "İyi", color: "#3F7A5B" };
  if (score >= 55) return { label: "Geliştirilebilir", color: "#9C7C4A" };
  return { label: "Zayıf", color: "#A23A32" };
}
