import type { SeoAnalysis } from "@/lib/seo/score";

/**
 * Sohbet asistanının açılışında gösterilen, O YAZIYA ÖZEL talimat önerileri.
 *
 * Neden burada: öneriler makalenin gerçek durumundan türetiliyor — `analyzeSeo`'nun denetim
 * listesi ve doğrulanacak bilgi sayısı. Denetim `ok` ise o öneri hiç üretilmiyor; yani liste
 * her makalede farklı çıkıyor ve "yapılacak bir şey kalmadıysa" boşalıyor.
 *
 * Ek AI çağrısı YOK: saf fonksiyon, anında ve ücretsiz. Ücretsiz katman kotası yalnızca
 * kullanıcı gerçekten bir talimat gönderdiğinde harcanır.
 */

export type ChatSuggestion = {
  /** Denetim id'siyle aynı — testlerde ve React anahtarında kullanılır. */
  id: string;
  /** Düğmede görünen kısa etiket. */
  label: string;
  /** Tıklanınca giriş kutusuna yazılacak tam talimat. */
  prompt: string;
};

export type SuggestionInput = {
  analysis: SeoAnalysis;
  /** [DOĞRULANACAK] işaretçisi sayısı (bkz. lib/ai/citations.ts). */
  placeholderCount: number;
  faqCount: number;
};

/** Aynı anda gösterilecek en fazla öneri — daha fazlası seçim yapmayı zorlaştırıyor. */
const MAX_SUGGESTIONS = 5;

/**
 * Sıra ÖNEMLİ: liste bu diziye göre kuruluyor, yani en üstteki öneri o makalede etkisi en
 * büyük olan iş. Yayını bloklayan doğrulama en başta; üslup işleri en sonda.
 */
const RULES: {
  /** Hangi `SeoCheck.id`'ye bakılacak. */
  checkId: string;
  /** Denetim bu durumlardaysa öneri üretilir. */
  when: ("fail" | "warn")[];
  build: (input: SuggestionInput) => { label: string; prompt: string };
}[] = [
  {
    checkId: "verification",
    when: ["fail"],
    build: ({ placeholderCount }) => ({
      label: `${placeholderCount} doğrulanacak bilgiyi listele`,
      prompt:
        placeholderCount > 0
          ? `Metindeki ${placeholderCount} adet [DOĞRULANACAK] işaretçisini tek tek listele; her biri için hangi kaynaktan teyit etmem gerektiğini söyle. Metni değiştirme.`
          : "Metinde doğrulanması gereken somut iddiaları (süre, oran, tutar, madde numarası) listele. Metni değiştirme.",
    }),
  },
  {
    checkId: "meta-description",
    when: ["fail", "warn"],
    build: () => ({
      label: "Meta açıklama yaz",
      prompt:
        "Meta açıklamayı 120-158 karakter arasında, okuyucuyu tıklamaya ikna eden ve odak kelimeyi doğal biçimde içeren bir metinle yeniden yaz.",
    }),
  },
  {
    checkId: "faq",
    when: ["fail", "warn"],
    build: ({ faqCount }) => ({
      label: faqCount === 0 ? "4 SSS ekle" : "SSS'leri tamamla",
      prompt:
        faqCount === 0
          ? "Bu makale için okuyucunun Google'a yazacağı 4 soru ve her birine 2-3 cümlelik doğrudan cevap hazırla; faq alanına ekle."
          : `SSS bölümünde ${faqCount} soru var; 3-6 aralığına tamamla ve mevcut cevapları daha doğrudan hale getir.`,
    }),
  },
  {
    checkId: "focus-missing",
    when: ["fail"],
    build: () => ({
      label: "Odak anahtar kelime öner",
      prompt:
        "Bu makale için odak anahtar kelime öner: okuyucunun aramaya yazacağı ifade olsun. Seçtiğin kelimeyi focusKeyword alanına yaz.",
    }),
  },
  {
    checkId: "focus-first-paragraph",
    when: ["fail", "warn"],
    build: () => ({
      label: "Odak kelimeyi girişe yerleştir",
      prompt:
        "Odak anahtar kelime ilk paragrafta geçmiyor. Girişi, kelimeyi zorlamadan ve doğal bir cümle içinde geçecek şekilde yeniden yaz.",
    }),
  },
  {
    checkId: "internal-links",
    when: ["fail", "warn"],
    build: () => ({
      label: "İç bağlantı ekle",
      prompt:
        "Metinde geçen ifadelerden uygun olanları sitemizdeki çalışma alanı ve makale sayfalarına bağla. Yalnızca gerçekten ilgili olanları öner.",
    }),
  },
  {
    checkId: "readability",
    when: ["fail", "warn"],
    build: ({ analysis }) => ({
      label: "Dili sadeleştir",
      prompt: `Okunabilirlik puanı ${analysis.readability.score}. Uzun cümleleri böl, hukuk jargonunu günlük dile çevir; anlamı değiştirme.`,
    }),
  },
  {
    checkId: "word-count",
    when: ["fail", "warn"],
    build: ({ analysis }) => ({
      label: "Metni derinleştir",
      prompt: `Metin ${analysis.wordCount} kelime. Hangi bölümlerin eksik kaldığını söyle ve okuyucunun sorabileceği somut sorulara cevap veren bölümler öner.`,
    }),
  },
  {
    checkId: "headings",
    when: ["fail", "warn"],
    build: () => ({
      label: "Ara başlık ekle",
      prompt:
        "Metni ara başlıklarla bölümle: her başlık okuyucunun aradığı bir soruya karşılık gelsin.",
    }),
  },
  {
    checkId: "excerpt",
    when: ["fail", "warn"],
    build: () => ({
      label: "Özeti yeniden yaz",
      prompt:
        "Özeti 80-200 karakter arasında, makalenin ne vaat ettiğini tek cümlede söyleyen bir metinle yeniden yaz.",
    }),
  },
  {
    checkId: "meta-title",
    when: ["fail", "warn"],
    build: () => ({
      label: "Meta başlığı düzelt",
      prompt:
        "Meta başlığı 60 karakterin altında, odak kelimeyi başa alan ve tıklanmayı artıran bir başlıkla değiştir.",
    }),
  },
];

export function buildChatSuggestions(input: SuggestionInput): ChatSuggestion[] {
  // Gövde boşken öneri üretmek anlamsız: her denetim "fail" döner ve liste alakasız işlerle
  // dolar. Önce metnin var olması gerekiyor.
  if (input.analysis.wordCount === 0) return [];

  const byId = new Map(input.analysis.checks.map((c) => [c.id, c]));
  const out: ChatSuggestion[] = [];

  for (const rule of RULES) {
    if (out.length >= MAX_SUGGESTIONS) break;
    const check = byId.get(rule.checkId);
    if (!check || !rule.when.includes(check.status as "fail" | "warn")) continue;
    const { label, prompt } = rule.build(input);
    out.push({ id: rule.checkId, label, prompt });
  }

  return out;
}
