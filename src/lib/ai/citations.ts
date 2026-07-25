/**
 * Atıf dedektörü — saf fonksiyonlar, hiçbir dış bağımlılık yok.
 *
 * Neden var: makaleler avukat imzasıyla yayınlanıyor ve dil modelleri tam olarak madde
 * numarası, süre ve oran uydurur. Sistem promptu bunu yasaklıyor ama bir kural promptla
 * garanti edilemez — özellikle Flash sınıfı bir modelde. Bu yüzden koruma modele değil koda
 * yüklenir: üretilen her metin buradan geçer ve somut hukuki/sayısal iddialar kullanıcıya
 * tek tek gösterilir.
 *
 * İki farklı mekanizma var, karıştırılmamalı:
 * - `placeholders`: AI'ın kendi bıraktığı `[DOĞRULANACAK: …]` işaretçileri. Model orada
 *   bilmediğini söylüyor → **sert blok**, metinden çıkarılmadan yayınlanamaz.
 * - `citations`: regex'in yakaladığı somut iddialar. Meşru olabilirler ("6284 sayılı Kanun
 *   kapsamında koruma kararı" gibi bir başlık gerçek bir konudur) → **yumuşak blok**, her
 *   bulgu için insan onayı istenir.
 */

export type CitationKind = "madde" | "kanun" | "karar" | "oran" | "sure" | "para";

export type CitationFinding = {
  kind: CitationKind;
  /** Yakalanan ham metin, ör. "6284 sayılı". */
  match: string;
  /** Metindeki 0-tabanlı karakter konumu. */
  index: number;
  /** 1-tabanlı satır numarası. */
  line: number;
  /** Bulguyu içeren satırın tamamı — kullanıcı bağlamı görebilsin diye. */
  context: string;
  /**
   * Onay kutularını eşlemek için kararlı kimlik: konuma değil iddianın kendisine bağlı.
   * Metin düzenlenip aynı iddia yerinde kalırsa onay korunur; iddia silinirse bulgu kaybolur.
   */
  key: string;
};

export type VerificationReport = {
  placeholders: string[];
  citations: CitationFinding[];
};

export const CITATION_LABELS: Record<CitationKind, string> = {
  madde: "Madde numarası",
  kanun: "Kanun / mevzuat atfı",
  karar: "Mahkeme kararı atfı",
  oran: "Oran",
  sure: "Süre",
  para: "Tutar",
};

/** Kullanıcıya "neden soruluyor" açıklaması — panelde bulgunun yanında gösterilir. */
export const CITATION_HINTS: Record<CitationKind, string> = {
  madde: "Madde numaraları en sık uydurulan bilgidir. Mevzuattan teyit edin.",
  kanun: "Kanun numarası ve adının doğru eşleştiğini teyit edin.",
  karar: "Karar esas/karar numaralarını mutlaka kaynaktan doğrulayın.",
  oran: "Oranlar sık değişir. Güncel değeri teyit edin.",
  sure: "Süreler ve hak düşürücü süreler kritik. Mevzuattan teyit edin.",
  para: "Tutarlar ve parasal sınırlar her yıl güncellenir. Güncel değeri teyit edin.",
};

// Türkçe harfleri de kapsayan sınır kontrolü. JS'te `\b` yalnızca [A-Za-z0-9_] üzerinden
// çalıştığı için "İİK" ya da "yüzde" gibi kelimelerde yanlış davranıyor; bu yüzden açık
// lookaround kullanılıyor.
const TR = "A-Za-zÇĞİıÖŞÜçğöşü";
const L = `(?<![${TR}0-9])`;
const R = `(?![${TR}0-9])`;

type Pattern = { kind: CitationKind; re: RegExp };

/**
 * Kanun numarası için "sayılı"/"Kanun" bağlamı ZORUNLU tutuluyor. Çıplak 4 haneli sayıyı
 * kanun saymak yıl ("2026 yılında") ve tutarları da yakalayıp raporu kullanılamaz hale
 * getirirdi; oysa gerçek risk kanuna atıf yapılması.
 */
const PATTERNS: Pattern[] = [
  {
    kind: "madde",
    re: new RegExp(
      `${L}(?:(?:madde|md\\.?|m\\.)\\s*\\d+(?:\\s*/\\s*\\d+)?(?:\\s*-\\s*[a-z]\\)?)?` +
        `|\\d+\\s*\\.\\s*madde(?:si|sinde|sine|sinin|ler|leri)?)`,
      "giu",
    ),
  },
  {
    kind: "kanun",
    re: new RegExp(`${L}\\d{3,5}\\s*say[ıi]l[ıi]${R}`, "giu"),
  },
  {
    kind: "kanun",
    re: new RegExp(
      `${L}(?:TMK|TBK|TCK|HMK|CMK|İİK|IIK|KVKK|İYUK|IYUK|TTK|IYUK|SGK|TKHK)` +
        `\\s*(?:m\\.?|md\\.?|madde)?\\s*\\d+`,
      "giu",
    ),
  },
  {
    kind: "karar",
    re: new RegExp(`${L}(?:E|K)\\.\\s*\\d{4}\\s*/\\s*\\d+`, "giu"),
  },
  {
    kind: "karar",
    re: new RegExp(`${L}\\d+\\s*\\.\\s*(?:Hukuk|Ceza)\\s+Dairesi`, "giu"),
  },
  {
    kind: "oran",
    re: new RegExp(`${L}(?:%\\s*\\d+(?:[.,]\\d+)?|\\d+(?:[.,]\\d+)?\\s*%|yüzde\\s+\\d+(?:[.,]\\d+)?)`, "giu"),
  },
  {
    kind: "sure",
    re: new RegExp(
      `${L}\\d+\\s*(?:iş\\s+günü|gün|hafta|ay|yıl|sene|saat)${R}`,
      "giu",
    ),
  },
  {
    kind: "para",
    re: new RegExp(
      `${L}\\d[\\d.,]*\\s*(?:TL|₺|lira|EUR|Euro|avro|USD|dolar|sterlin)${R}`,
      "giu",
    ),
  },
];

const PLACEHOLDER_RE = /\[DOĞRULANACAK:?([^\]]*)\]/giu;

/** AI'ın kendi bıraktığı doğrulama işaretçilerini döner (sert blok sebebi). */
export function findPlaceholders(text: string): string[] {
  const found: string[] = [];
  for (const m of text.matchAll(PLACEHOLDER_RE)) {
    found.push(m[1].trim() || "(açıklama yok)");
  }
  return found;
}

/** Metni satır başlangıç konumlarına çevirir — bir indeksin hangi satırda olduğunu bulmak için. */
function lineIndex(text: string): { starts: number[]; lines: string[] } {
  const lines = text.split("\n");
  const starts: number[] = [];
  let pos = 0;
  for (const line of lines) {
    starts.push(pos);
    pos += line.length + 1; // +1: "\n"
  }
  return { starts, lines };
}

function lineOf(starts: number[], index: number): number {
  // starts artan sırada; index'i içeren son satırı bul.
  let lo = 0;
  let hi = starts.length - 1;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (starts[mid] <= index) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

function normalizeKey(kind: CitationKind, match: string): string {
  const compact = match.replace(/\s+/g, " ").trim().toLocaleLowerCase("tr");
  return `${kind}:${compact}`;
}

/**
 * Somut hukuki/sayısal iddiaları bulur. `[DOĞRULANACAK: …]` işaretçilerinin İÇİ taranmaz —
 * orası zaten "bilinmiyor" olarak işaretlenmiş, iki kez uyarmak gürültü olur.
 */
export function findCitations(text: string): CitationFinding[] {
  // İşaretçi aralıklarını çıkar, bulguları bunların dışında ara.
  const masked: Array<[number, number]> = [];
  for (const m of text.matchAll(PLACEHOLDER_RE)) {
    if (m.index !== undefined) masked.push([m.index, m.index + m[0].length]);
  }
  const isMasked = (i: number) => masked.some(([s, e]) => i >= s && i < e);

  const { starts, lines } = lineIndex(text);
  const byIndex = new Map<string, CitationFinding>();

  for (const { kind, re } of PATTERNS) {
    for (const m of text.matchAll(re)) {
      if (m.index === undefined || isMasked(m.index)) continue;
      const line = lineOf(starts, m.index);
      const finding: CitationFinding = {
        kind,
        match: m[0].trim(),
        index: m.index,
        line: line + 1,
        context: lines[line].trim(),
        key: normalizeKey(kind, m[0]),
      };
      // Aynı konumda birden fazla desen eşleşirse (ör. "KVKK m.11" hem kanun hem madde)
      // ikisini de tutmak istiyoruz, ama aynı desen aynı konumda iki kez sayılmasın.
      byIndex.set(`${kind}@${m.index}`, finding);
    }
  }

  return [...byIndex.values()].sort((a, b) => a.index - b.index);
}

export function buildVerificationReport(text: string): VerificationReport {
  return { placeholders: findPlaceholders(text), citations: findCitations(text) };
}

/** Onay kutuları için tekilleştirilmiş bulgu listesi (aynı iddia iki yerde geçiyorsa tek satır). */
export function uniqueCitations(citations: CitationFinding[]): CitationFinding[] {
  const seen = new Map<string, CitationFinding>();
  for (const c of citations) {
    if (!seen.has(c.key)) seen.set(c.key, c);
  }
  return [...seen.values()];
}

export type PublishGate = { ok: true } | { ok: false; reason: string };

/**
 * İki kademeli yayın kapısı. Aşama 3'te hem istemci hem `saveArticle` bunu çağırır —
 * Server Action'lar ağdan doğrudan çağrılabildiği için istemci kilidi tek başına güvenlik değil.
 */
export function checkPublishGate(text: string, confirmedKeys: Iterable<string>): PublishGate {
  const report = buildVerificationReport(text);

  if (report.placeholders.length > 0) {
    return {
      ok: false,
      reason:
        `Metinde ${report.placeholders.length} adet [DOĞRULANACAK] işaretçisi var. ` +
        "Yapay zeka bu bilgileri bilmediğini belirtmiş; doğru değerleri yazıp işaretçileri kaldırmadan yayınlanamaz.",
    };
  }

  const confirmed = new Set(confirmedKeys);
  const pending = uniqueCitations(report.citations).filter((c) => !confirmed.has(c.key));
  if (pending.length > 0) {
    return {
      ok: false,
      reason:
        `${pending.length} adet doğrulanmamış bilgi var (${pending
          .slice(0, 3)
          .map((c) => c.match)
          .join(", ")}${pending.length > 3 ? "…" : ""}). ` +
        "Her birini kaynaktan teyit edip işaretlemeniz gerekiyor.",
    };
  }

  return { ok: true };
}
