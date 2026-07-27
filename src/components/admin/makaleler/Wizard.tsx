"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { suggestSeo, suggestTitles, translateToEn } from "@/lib/ai/article";
import type { SeoSuggestions, TitleSuggestion } from "@/lib/ai/article";
import { saveArticle } from "@/app/admin/(panel)/makaleler/actions";
import type { ArticleFormData, FaqItem } from "@/app/admin/(panel)/makaleler/types";
import { faqToText, textToFaq } from "@/lib/ai/faq-text";
import { buildChatSuggestions } from "@/lib/ai/chat-suggestions";
import { buildVerificationReport } from "@/lib/ai/citations";
import { BASE_URL } from "@/lib/metadata";
import { analyzeSeo, readMinutesOf } from "@/lib/seo/score";
import { slugify } from "@/lib/admin/slugify";
import { ArticleEditor } from "./ArticleEditor";
import { ChatPanel } from "./ChatPanel";
import type { LinkTargetOption } from "./LinkDialog";
import { SeoPanel } from "./SeoPanel";
import { SuggestionList, type PreviewContext, type PreviewKind } from "./SuggestionList";
import { VerificationPanel } from "./VerificationPanel";
import { useBodyStream } from "./useBodyStream";

/**
 * 5 adımlı makale sihirbazı — "bir çocuğun bile yönetebileceği" yüzey.
 *
 * Editörden (MakalelerBrowser) farkı: burada tek seferde tek bir soru var ve her adımın çıktısı
 * bir sonrakinin girdisi. Tüm alanları aynı ekranda görmek isteyen kullanıcı için editör var;
 * ikisi de aynı AI servisini (`lib/ai/article.ts`) çağırıyor.
 *
 * Durum daima DRAFT: yapay zeka üretimi insan denetiminden geçmeden yayına gitmez.
 */

const inputClass =
  "h-11 w-full rounded border border-line bg-surface px-3.5 text-[14px] text-ink outline-none focus:border-gold";
const textareaClass =
  "w-full rounded border border-line bg-surface px-3.5 py-3 text-[14px] leading-relaxed text-ink outline-none focus:border-gold resize-y";
const cardClass =
  "rounded-md border border-line bg-surface p-6 shadow-[0_1px_2px_rgba(28,34,48,0.05)]";

const STEPS = ["Konu", "Başlık", "Metin", "SEO", "Denetim"] as const;
type Step = 0 | 1 | 2 | 3 | 4;

function emptySeo(): SeoSuggestions {
  return { metaTitle: [], metaDescription: [], excerpt: [], tags: [], focusKeyword: [] };
}

export function Wizard({
  practiceAreaOptions,
  linkTargets,
}: {
  practiceAreaOptions: { value: string; label: string }[];
  linkTargets: LinkTargetOption[];
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // 1. adım
  const [topic, setTopic] = useState("");
  const [areaSlug, setAreaSlug] = useState("");

  // 2. adım
  const [titleOptions, setTitleOptions] = useState<TitleSuggestion[]>([]);
  const [title, setTitle] = useState("");

  // 3. adım
  const body = useBodyStream();
  /** Üretim tamamlanınca buraya düşer; kullanıcı bundan sonra editörde düzenler. */
  const [draftBody, setDraftBody] = useState("");
  const [instruction, setInstruction] = useState("");
  const [selection, setSelection] = useState("");

  // 4. adım
  const [seo, setSeo] = useState<SeoSuggestions>(emptySeo());
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [tags, setTags] = useState("");
  const [focusKeyword, setFocusKeyword] = useState("");
  /** Sohbet asistanı SSS de önerebilir; sihirbazdan çıkan taslak onlarla birlikte kaydedilir. */
  const [faq, setFaq] = useState<FaqItem[]>([]);

  const chatFields = useMemo(
    () => ({
      body: draftBody,
      title,
      excerpt,
      metaTitle,
      metaDescription,
      tags,
      focusKeyword,
      faq: faqToText(faq),
    }),
    [draftBody, title, excerpt, metaTitle, metaDescription, tags, focusKeyword, faq],
  );

  /** Onaylanan sohbet düzenlemesini sihirbazın state'lerine dağıtır. */
  function applyChatEdit(next: typeof chatFields) {
    setDraftBody(next.body);
    setTitle(next.title);
    setExcerpt(next.excerpt);
    setMetaTitle(next.metaTitle);
    setMetaDescription(next.metaDescription);
    setTags(next.tags);
    setFocusKeyword(next.focusKeyword);
    setFaq(textToFaq(next.faq));
  }

  // 5. adım
  const [translating, setTranslating] = useState(false);
  const [en, setEn] = useState<ArticleFormData["en"] | null>(null);

  const areaLabel = practiceAreaOptions.find((o) => o.value === areaSlug)?.label ?? "";

  /** Sohbet açılışındaki brifing ve öneriler — editördekiyle aynı saf fonksiyonlardan. */
  const wizardAnalysis = useMemo(
    () =>
      analyzeSeo({
        title,
        slug: "",
        body: draftBody,
        excerpt,
        metaTitle,
        metaDescription,
        focusKeyword,
        baseUrl: BASE_URL,
        pathPrefix: "/makaleler",
        faqCount: faq.length,
        // Sihirbaz taslak kaydeder; yazar seçimi editörde yapılır.
        hasAuthor: false,
      }),
    [title, draftBody, excerpt, metaTitle, metaDescription, focusKeyword, faq.length],
  );

  const wizardStats = useMemo(
    () => ({
      words: wizardAnalysis.wordCount,
      readMinutes: wizardAnalysis.readMinutes,
      readability: wizardAnalysis.readability.score,
      seoScore: wizardAnalysis.score,
    }),
    [wizardAnalysis],
  );

  const wizardSuggestions = useMemo(
    () =>
      buildChatSuggestions({
        analysis: wizardAnalysis,
        placeholderCount: buildVerificationReport(draftBody).placeholders.length,
        faqCount: faq.length,
      }),
    [wizardAnalysis, draftBody, faq.length],
  );

  /** Seçenek önizlemelerinin sabit bağlamı — slug henüz yok, başlıktan türetiliyor. */
  const previewContext = useMemo(
    () => ({
      url: `${BASE_URL}/makaleler/${slugify(title || "makale")}`,
      title: metaTitle || title,
      description: metaDescription,
      category: areaLabel.toLocaleUpperCase("tr"),
      readMinutes: readMinutesOf(draftBody),
    }),
    [title, metaTitle, metaDescription, areaLabel, draftBody],
  );

  async function runTitles() {
    setError(null);
    setBusy(true);
    const result = await suggestTitles(topic, areaSlug);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setTitleOptions(result.data);
    setStep(1);
  }

  async function runBody(extra?: string) {
    setError(null);
    setStep(2);
    await body.start(
      { title, areaSlug, instruction: extra },
      { onComplete: setDraftBody },
    );
  }

  async function runSeo() {
    setError(null);
    setBusy(true);
    const result = await suggestSeo(title, draftBody);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSeo(result.data);
    // İlk seçenekleri ön-doldur; kullanıcı diğerlerine tek tıkla geçebilir.
    setMetaTitle((v) => v || result.data.metaTitle[0] || "");
    setMetaDescription((v) => v || result.data.metaDescription[0] || "");
    setExcerpt((v) => v || result.data.excerpt[0] || "");
    setTags((v) => v || (result.data.tags[0] ?? []).join("\n"));
    setFocusKeyword((v) => v || result.data.focusKeyword[0] || "");
    setStep(3);
  }

  async function runTranslate() {
    setError(null);
    setTranslating(true);
    const result = await translateToEn({
      title,
      excerpt,
      body: draftBody,
      metaTitle,
      metaDescription,
    });
    setTranslating(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setEn(result.data);
  }

  async function handleSave() {
    setError(null);
    setBusy(true);
    const payload: ArticleFormData = {
      id: null,
      slug: "",
      practiceAreaSlug: areaSlug,
      authorSlug: "",
      faq: { tr: faq, en: [] },
      // Markdown biçimlendirmesi hariç tutularak gerçek kelime sayısından hesaplanır.
      readMinutes: readMinutesOf(draftBody),
      tags,
      coverImageUrl: "",
      featured: false,
      status: "DRAFT",
      publishAt: "",
      focusKeyword,
      // Sihirbaz taslak kaydeder; doğrulama işaretleri editörde tek tek konur.
      verifiedClaims: [],
      tr: { title, excerpt, body: draftBody, metaTitle, metaDescription },
      en: en ?? { title: "", excerpt: "", body: "", metaTitle: "", metaDescription: "" },
    };

    const result = await saveArticle(payload);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    // Liste ekranına dön — kayıt taslak olarak orada görünür ve editörde açılabilir.
    router.push("/admin/makaleler");
  }

  return (
    <div className={`mx-auto flex w-full flex-col gap-5 ${step === 2 ? "max-w-[1400px]" : "max-w-[860px]"}`}>
      {/* Adım göstergesi */}
      <ol className="m-0 flex list-none flex-wrap items-center gap-2 p-0">
        {STEPS.map((label, i) => {
          const active = i === step;
          const done = i < step;
          return (
            <li key={label} className="flex items-center gap-2">
              <span
                className="flex h-7 items-center gap-2 rounded-full border px-3 font-mono text-[10.5px] tracking-[1px]"
                style={{
                  borderColor: active ? "#1C2230" : done ? "#CDE0D4" : "#E4DFD5",
                  background: active ? "#1C2230" : done ? "rgba(63,122,91,.06)" : "#FFFFFF",
                  color: active ? "#F6F3EC" : done ? "#3F7A5B" : "#5B6270",
                }}
              >
                {done ? "✓" : i + 1} {label.toLocaleUpperCase("tr")}
              </span>
              {i < STEPS.length - 1 && <span className="text-line">—</span>}
            </li>
          );
        })}
      </ol>

      {error && (
        <p
          className="m-0 rounded border px-4 py-3 text-[13px] leading-relaxed"
          style={{ borderColor: "#E8C5C1", background: "#FBF1F0", color: "#A23A32" }}
        >
          {error}
        </p>
      )}

      {/* 1 — Konu */}
      {step === 0 && (
        <div className={cardClass}>
          <h2 className="m-0 font-serif text-[26px] font-medium">Ne hakkında yazalım?</h2>
          <p className="m-0 mt-2 text-[13.5px] leading-relaxed text-muted">
            Tek bir cümle yeter. Yapay zeka başlığı, metni ve tüm SEO alanlarını bundan üretecek.
          </p>

          <div className="mt-5 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold">Konu</label>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                rows={3}
                placeholder="Örnek: kira artış oranı nasıl hesaplanır"
                className={textareaClass}
              />
              {/* Ücretsiz katmanda Google istem/yanıtları ürün geliştirmede kullanabiliyor;
                  bir hukuk bürosunda bu ayrımın ekranda yazılı olması gerekiyor. */}
              <p
                className="m-0 rounded border px-3 py-2 text-[11.5px] leading-relaxed"
                style={{ borderColor: "#E4DFD5", background: "#FAF8F3", color: "#5B6270" }}
              >
                <strong className="text-ink">Buraya müvekkil, dosya veya kişisel bilgi yazmayın.</strong>{" "}
                Bu metin yapay zeka servisine gönderilir. Yalnızca genel hukuki konu başlığı yazın.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold">Çalışma alanı</label>
              <select
                value={areaSlug}
                onChange={(e) => setAreaSlug(e.target.value)}
                className={`${inputClass} cursor-pointer`}
              >
                <option value="">— Seçin —</option>
                {practiceAreaOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <p className="m-0 text-[11.5px] leading-relaxed text-muted">
                Kategori etiketi ve iç bağlantı önerileri bu seçime göre belirlenir.
              </p>
            </div>

            <button
              type="button"
              onClick={runTitles}
              disabled={busy || topic.trim().length < 5 || !areaSlug}
              className="self-start rounded bg-ink px-[26px] py-[11px] text-[13.5px] font-semibold text-cream transition-colors hover:bg-gold disabled:opacity-50"
            >
              {busy ? "Başlıklar üretiliyor…" : "Başlık önerileri al →"}
            </button>
          </div>
        </div>
      )}

      {/* 2 — Başlık */}
      {step === 1 && (
        <div className={cardClass}>
          <h2 className="m-0 font-serif text-[26px] font-medium">Hangi başlık?</h2>
          <p className="m-0 mt-2 text-[13.5px] leading-relaxed text-muted">
            Üçü farklı yaklaşımda. Beğenmediyseniz düzenleyebilir veya yeniden üretebilirsiniz.
          </p>

          <div className="mt-5 flex flex-col gap-4">
            <SuggestionList
              suggestions={titleOptions.map((t) => ({ value: t.title, note: t.angle }))}
              currentValue={title}
              onPick={setTitle}
              charTarget={{ min: 45, max: 60 }}
              previewAs="serp-title"
              previewContext={previewContext}
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold">Seçilen başlık (düzenleyebilirsiniz)</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => setStep(0)}
                className="rounded border border-line bg-surface px-5 py-[11px] text-[13.5px] font-semibold text-muted transition-colors hover:border-gold hover:text-gold"
              >
                ← Konuyu değiştir
              </button>
              <button
                type="button"
                onClick={runTitles}
                disabled={busy}
                className="rounded border border-line bg-surface px-5 py-[11px] text-[13.5px] font-semibold text-muted transition-colors hover:border-gold hover:text-gold disabled:opacity-50"
              >
                {busy ? "Üretiliyor…" : "Yeniden üret"}
              </button>
              <button
                type="button"
                onClick={() => runBody()}
                disabled={title.trim().length < 5}
                className="rounded bg-ink px-[26px] py-[11px] text-[13.5px] font-semibold text-cream transition-colors hover:bg-gold disabled:opacity-50"
              >
                Metni yaz →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3 — Metin */}
      {step === 2 && (
        <div className={cardClass}>
          <h2 className="m-0 font-serif text-[26px] font-medium">{title}</h2>
          <p className="m-0 mt-2 text-[13.5px] leading-relaxed text-muted">
            {areaLabel} · Metin yazılırken düzenleyebilirsiniz. Yapay zeka mevzuata atıf yapmaz;
            somut değer gerektiren yerlere <code>[DOĞRULANACAK: …]</code> bırakır.
          </p>

          <div className="mt-5 flex flex-col gap-4">
            <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
              <ArticleEditor
                value={draftBody}
                onChange={setDraftBody}
                linkTargets={linkTargets}
                draftKey="sihirbaz"
                onSelectionChange={setSelection}
                generation={{
                  active: body.streaming,
                  startedAt: body.startedAt,
                  charCount: body.text.length,
                  onCancel: body.stop,
                }}
              />
              {/* Metin üretildikten sonra sohbetle düzeltme; üretim sürerken gizli. */}
              {!body.streaming && draftBody.trim() && (
                <div className="h-[520px]">
                  {/* `persist={false}`: sihirbazın tüm durumu zaten bellekte, sohbetin de
                      öyle olması her yeni çalıştırmanın temiz başlamasını kendiliğinden
                      sağlıyor. Önceden sabit "sihirbaz" anahtarı bir önceki çalıştırmanın
                      sohbetini açıyordu. */}
                  <ChatPanel
                    fields={chatFields}
                    onApply={applyChatEdit}
                    selection={selection}
                    storageKey="sihirbaz"
                    persist={false}
                    article={{ title, category: areaLabel, locale: "TR", stats: wizardStats }}
                    suggestions={wizardSuggestions}
                  />
                </div>
              )}
            </div>

            {body.error && (
              <p
                className="m-0 rounded border px-3 py-2.5 text-[12.5px] leading-relaxed"
                style={{ borderColor: "#E8C5C1", background: "#FBF1F0", color: "#A23A32" }}
              >
                {body.error}
              </p>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold">
                Yeniden üretirken ek talimat (isteğe bağlı)
              </label>
              <input
                type="text"
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                placeholder="Örnek: daha kısa olsun, örneklerle anlat"
                className={inputClass}
              />
            </div>

            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="rounded border border-line bg-surface px-5 py-[11px] text-[13.5px] font-semibold text-muted transition-colors hover:border-gold hover:text-gold"
              >
                ← Başlığa dön
              </button>
              {body.streaming ? (
                <button
                  type="button"
                  onClick={body.stop}
                  className="rounded border border-[#E8C5C1] bg-surface px-5 py-[11px] text-[13.5px] font-semibold text-[#A23A32] transition-colors hover:bg-[#FBF1F0]"
                >
                  Durdur
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => runBody(instruction)}
                  className="rounded border border-line bg-surface px-5 py-[11px] text-[13.5px] font-semibold text-muted transition-colors hover:border-gold hover:text-gold"
                >
                  Yeniden üret
                </button>
              )}
              <button
                type="button"
                onClick={runSeo}
                disabled={busy || body.streaming || !draftBody.trim()}
                className="rounded bg-ink px-[26px] py-[11px] text-[13.5px] font-semibold text-cream transition-colors hover:bg-gold disabled:opacity-50"
              >
                {busy ? "SEO üretiliyor…" : "SEO alanlarını doldur →"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4 — SEO */}
      {step === 3 && (
        <div className={cardClass}>
          <h2 className="m-0 font-serif text-[26px] font-medium">SEO alanları</h2>
          <p className="m-0 mt-2 text-[13.5px] leading-relaxed text-muted">
            Her alan için üç seçenek var. İlki seçili; istediğinizi tek tıkla değiştirin veya
            elle yazın.
          </p>

          <div className="mt-5 flex flex-col gap-6">
            <SeoField
              label="Meta başlık"
              hint="Google sonuç başlığı. 50-60 karakter ideal."
              value={metaTitle}
              onChange={setMetaTitle}
              options={seo.metaTitle}
              charTarget={{ min: 50, max: 60 }}
              previewAs="serp-title"
              previewContext={previewContext}
            />
            <SeoField
              label="Meta açıklama"
              hint="Google sonucundaki açıklama. 140-155 karakter ideal."
              value={metaDescription}
              onChange={setMetaDescription}
              options={seo.metaDescription}
              charTarget={{ min: 140, max: 155 }}
              multiline
              previewAs="serp-description"
              previewContext={previewContext}
            />
            <SeoField
              label="Özet"
              hint="Makale kartlarında görünen kısa özet."
              value={excerpt}
              onChange={setExcerpt}
              options={seo.excerpt}
              charTarget={{ min: 100, max: 160 }}
              multiline
              previewAs="article-card"
              previewContext={previewContext}
            />
            <SeoField
              label="Odak anahtar kelime"
              hint="Okuyucunun Google'a yazacağı ifade."
              value={focusKeyword}
              onChange={setFocusKeyword}
              options={seo.focusKeyword}
            />

            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-semibold">Etiketler</label>
              <p className="m-0 text-[11.5px] leading-relaxed text-muted">Her satır bir etiket.</p>
              <textarea
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                rows={4}
                className={textareaClass}
              />
              <SuggestionList
                suggestions={seo.tags.map((group) => ({
                  value: group.join("\n"),
                  preview: group.join(" · "),
                }))}
                currentValue={tags}
                onPick={setTags}
              />
            </div>

            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="rounded border border-line bg-surface px-5 py-[11px] text-[13.5px] font-semibold text-muted transition-colors hover:border-gold hover:text-gold"
              >
                ← Metne dön
              </button>
              <button
                type="button"
                onClick={runSeo}
                disabled={busy}
                className="rounded border border-line bg-surface px-5 py-[11px] text-[13.5px] font-semibold text-muted transition-colors hover:border-gold hover:text-gold disabled:opacity-50"
              >
                {busy ? "Üretiliyor…" : "Yeniden üret"}
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                className="rounded bg-ink px-[26px] py-[11px] text-[13.5px] font-semibold text-cream transition-colors hover:bg-gold"
              >
                Denetime geç →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5 — Denetim */}
      {step === 4 && (
        <div className="flex flex-col gap-4">
          <div className={cardClass}>
            <h2 className="m-0 font-serif text-[26px] font-medium">Son denetim</h2>
            <p className="m-0 mt-2 text-[13.5px] leading-relaxed text-muted">
              Makale <strong>taslak</strong> olarak kaydedilecek. Yayınlamak için listeden açıp
              denetimi tamamlamanız gerekiyor — yapay zeka üretimi doğrudan yayına gitmez.
            </p>
          </div>

          <div className={cardClass}>
            <h3 className="m-0 mb-3.5 text-sm font-bold">SEO durumu</h3>
            <SeoPanel
              input={{
                title,
                slug: "",
                body: draftBody,
                excerpt,
                metaTitle,
                metaDescription,
                focusKeyword,
                baseUrl: BASE_URL,
                pathPrefix: "/makaleler",
                faqCount: faq.length,
                // Sihirbaz taslak kaydeder; yazar seçimi editörde yapılır.
                hasAuthor: false,
              }}
            />
          </div>

          <div className={cardClass}>
            <h3 className="m-0 mb-1 text-sm font-bold">Doğrulanacak bilgiler</h3>
            <p className="m-0 mb-3 text-[12px] leading-relaxed text-muted">
              Bu iddiaları kaydettikten sonra editörde tek tek teyit edip işaretleyeceksiniz —
              yayınlamanın şartı budur.
            </p>
            <VerificationPanel text={draftBody} />
          </div>

          <div className={cardClass}>
            <h3 className="m-0 mb-1 text-sm font-bold">İngilizce sürüm</h3>
            <p className="m-0 mb-3 text-[12px] leading-relaxed text-muted">
              Site iki dilli ve arama motorlarına İngilizce sayfaların gerçek olduğunu bildiriyor.
              Boş bırakmak, doldurmaktan kötü bir sinyaldir.
            </p>
            {en ? (
              <div className="flex flex-col gap-2">
                <p
                  className="m-0 rounded border px-3 py-2 text-[12.5px]"
                  style={{ borderColor: "#CDE0D4", background: "rgba(63,122,91,.06)", color: "#3F7A5B" }}
                >
                  Çeviri hazır: <strong>{en.title}</strong>
                </p>
                <button
                  type="button"
                  onClick={runTranslate}
                  disabled={translating}
                  className="self-start rounded border border-line bg-surface px-4 py-2 text-[12.5px] font-semibold text-muted transition-colors hover:border-gold hover:text-gold disabled:opacity-50"
                >
                  {translating ? "Çevriliyor…" : "Yeniden çevir"}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={runTranslate}
                disabled={translating}
                className="rounded border border-line bg-surface px-5 py-[11px] text-[13.5px] font-semibold text-muted transition-colors hover:border-gold hover:text-gold disabled:opacity-50"
              >
                {translating ? "Çevriliyor…" : "İngilizceye çevir"}
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="rounded border border-line bg-surface px-5 py-[11px] text-[13.5px] font-semibold text-muted transition-colors hover:border-gold hover:text-gold"
            >
              ← SEO&apos;ya dön
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={busy || !title.trim() || !draftBody.trim()}
              className="rounded bg-ink px-[26px] py-[11px] text-[13.5px] font-semibold text-cream transition-colors hover:bg-gold disabled:opacity-50"
            >
              {busy ? "Kaydediliyor…" : "Taslak olarak kaydet"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SeoField({
  label,
  hint,
  value,
  onChange,
  options,
  charTarget,
  multiline,
  previewAs,
  previewContext,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  charTarget?: { min: number; max: number };
  multiline?: boolean;
  previewAs?: PreviewKind;
  previewContext?: PreviewContext;
}) {
  const len = value.length;
  const inRange = charTarget ? len >= charTarget.min && len <= charTarget.max : true;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <label className="text-[13px] font-semibold">{label}</label>
        {charTarget && (
          <span className="font-mono text-[10.5px]" style={{ color: inRange ? "#3F7A5B" : "#9C7C4A" }}>
            {len} / {charTarget.min}-{charTarget.max} krk
          </span>
        )}
      </div>
      <p className="m-0 text-[11.5px] leading-relaxed text-muted">{hint}</p>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className={textareaClass}
        />
      ) : (
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className={inputClass} />
      )}
      <SuggestionList
        suggestions={options.map((o) => ({ value: o }))}
        currentValue={value}
        onPick={onChange}
        charTarget={charTarget}
        previewAs={previewAs}
        previewContext={previewContext}
      />
    </div>
  );
}
