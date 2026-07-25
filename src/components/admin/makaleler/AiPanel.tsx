"use client";

import { useState } from "react";
import {
  suggestInternalLinks,
  suggestSeo,
  suggestTitles,
  translateToEn,
} from "@/lib/ai/article";
import type { LinkSuggestion, SeoSuggestions } from "@/lib/ai/article";
import type { ArticleFormData, ArticleLocaleForm } from "@/app/admin/(panel)/makaleler/types";
import { SuggestionList } from "./SuggestionList";
import { useBodyStream } from "./useBodyStream";

/**
 * Editördeki yapay zeka yan paneli.
 *
 * Tek kural: **hiçbir dolu alan sessizce ezilmez.** Her öneri "Kullan" düğmesiyle tek tek
 * kabul edilir; "Boş alanları doldur" yalnızca gerçekten boş olan alanlara yazar. Gövdenin
 * yeniden üretilmesi mevcut metnin üzerine yazacağı için ayrıca onay ister.
 */

const cardClass = "rounded-md border border-line bg-surface p-5 shadow-[0_1px_2px_rgba(28,34,48,0.05)]";
const ghostButton =
  "w-full rounded border border-line bg-surface px-4 py-2.5 text-[12.5px] font-semibold text-muted transition-colors hover:border-gold hover:text-gold disabled:opacity-50";

function emptySeo(): SeoSuggestions {
  return { metaTitle: [], metaDescription: [], excerpt: [], tags: [], focusKeyword: [] };
}

export function AiPanel({
  form,
  dil,
  setField,
  setLocaleField,
  setLocaleBlock,
  appendTrBody,
  showToast,
}: {
  form: ArticleFormData;
  dil: "TR" | "EN";
  setField: <K extends keyof ArticleFormData>(key: K, value: ArticleFormData[K]) => void;
  setLocaleField: (locale: "tr" | "en", key: keyof ArticleLocaleForm, value: string) => void;
  setLocaleBlock: (locale: "tr" | "en", block: ArticleLocaleForm) => void;
  /** Akan gövde parçalarını TR gövdesinin sonuna ekler (fonksiyonel güncelleme gerektirir). */
  appendTrBody: (delta: string) => void;
  showToast: (message: string) => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [titles, setTitles] = useState<{ value: string; note?: string }[]>([]);
  const [seo, setSeo] = useState<SeoSuggestions>(emptySeo());
  const [links, setLinks] = useState<LinkSuggestion[] | null>(null);
  const [confirmRegenerate, setConfirmRegenerate] = useState(false);
  const body = useBodyStream();

  const locale = dil === "TR" ? "tr" : "en";
  const current = form[locale];
  const trBody = form.tr.body;

  function guardArea(): boolean {
    if (!form.practiceAreaSlug) {
      setError("Önce sağdaki 'Çalışma alanı' kutusundan bir alan seçin.");
      return false;
    }
    return true;
  }

  async function run<T>(
    key: string,
    fn: () => Promise<{ ok: true; data: T } | { ok: false; error: string }>,
    onOk: (data: T) => void,
  ) {
    setError(null);
    setBusy(key);
    const result = await fn();
    setBusy(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onOk(result.data);
  }

  // --- Başlık önerileri -----------------------------------------------------
  function handleTitles() {
    if (!guardArea()) return;
    const topic = form.tr.title.trim() || form.focusKeyword.trim();
    if (topic.length < 5) {
      setError("Başlık önerisi için önce kısa bir başlık ya da odak kelime yazın.");
      return;
    }
    void run("titles", () => suggestTitles(topic, form.practiceAreaSlug), (data) =>
      setTitles(data.map((t) => ({ value: t.title, note: t.angle }))),
    );
  }

  // --- Gövde ----------------------------------------------------------------
  /**
   * Akış doğrudan forma yazar (`onDelta` → `appendTrBody`). Hook'un kendi `text` state'ini
   * efektle forma senkronlamak, `setEditForm` her çağrıda yeni nesne ürettiği için sonsuz
   * render döngüsü riski taşıyordu; tek veri kaynağına yazmak bu sorunu tamamen ortadan
   * kaldırıyor.
   */
  function handleBody() {
    if (!guardArea()) return;
    if (!form.tr.title.trim()) {
      setError("Gövde üretmek için başlık gerekli.");
      return;
    }
    setConfirmRegenerate(false);
    setError(null);
    setLocaleField("tr", "body", ""); // üzerine yazılacağı onaylandı, alanı temizle
    void body.start(
      { title: form.tr.title, areaSlug: form.practiceAreaSlug },
      { onDelta: appendTrBody },
    );
  }

  // --- SEO ------------------------------------------------------------------
  function handleSeo() {
    if (!trBody.trim()) {
      setError("SEO önerisi için önce gövde metni gerekli.");
      return;
    }
    void run("seo", () => suggestSeo(form.tr.title, trBody), setSeo);
  }

  function fillEmptySeoFields() {
    let filled = 0;
    const put = (key: keyof ArticleLocaleForm, value: string | undefined) => {
      if (!value) return;
      if (current[key]?.trim()) return; // dolu alanı ezmeyiz
      setLocaleField(locale, key, value);
      filled += 1;
    };
    put("metaTitle", seo.metaTitle[0]);
    put("metaDescription", seo.metaDescription[0]);
    put("excerpt", seo.excerpt[0]);

    if (!form.focusKeyword.trim() && seo.focusKeyword[0]) {
      setField("focusKeyword", seo.focusKeyword[0]);
      filled += 1;
    }
    if (!form.tags.trim() && seo.tags[0]) {
      setField("tags", seo.tags[0].join("\n"));
      filled += 1;
    }

    showToast(
      filled === 0
        ? "Tüm alanlar zaten dolu — hiçbir şey değiştirilmedi."
        : `${filled} boş alan dolduruldu. Dolu alanlara dokunulmadı.`,
    );
  }

  // --- Çeviri ---------------------------------------------------------------
  function handleTranslate() {
    if (!form.tr.title.trim() || !trBody.trim()) {
      setError("Çeviri için Türkçe başlık ve gövde gerekli.");
      return;
    }
    void run(
      "translate",
      () =>
        translateToEn({
          title: form.tr.title,
          excerpt: form.tr.excerpt,
          body: trBody,
          metaTitle: form.tr.metaTitle,
          metaDescription: form.tr.metaDescription,
        }),
      (data) => {
        setLocaleBlock("en", {
          title: data.title,
          excerpt: data.excerpt,
          body: data.body,
          metaTitle: data.metaTitle,
          metaDescription: data.metaDescription,
        });
        showToast("İngilizce sürüm dolduruldu. EN sekmesinden kontrol edin.");
      },
    );
  }

  // --- İç bağlantı ----------------------------------------------------------
  function handleLinks() {
    if (!trBody.trim()) {
      setError("İç bağlantı önerisi için önce gövde metni gerekli.");
      return;
    }
    void run("links", () => suggestInternalLinks(trBody, form.id ?? undefined), setLinks);
  }

  function applyLink(s: LinkSuggestion) {
    if (!trBody.includes(s.phrase)) {
      showToast("Bu ifade metinde artık bulunmuyor — öneri uygulanamadı.");
      return;
    }
    // Yalnızca ilk geçtiği yeri bağlantıya çevir; tüm geçişleri değiştirmek aşırı olur.
    const next = trBody.replace(s.phrase, `[${s.phrase}](${s.href})`);
    setLocaleField("tr", "body", next);
    setLinks((cur) => (cur ? cur.filter((x) => x.phrase !== s.phrase) : cur));
    showToast("Bağlantı eklendi.");
  }

  const hasEn = Object.values(form.en).some((v) => (typeof v === "string" ? v.trim() : false));

  return (
    <div className="flex flex-col gap-4">
      <div className={cardClass}>
        <h2 className="m-0 mb-1 flex items-center gap-2 text-sm font-bold">
          <span aria-hidden>✨</span> Yapay zeka
        </h2>
        <p className="m-0 mb-3.5 text-[11.5px] leading-relaxed text-muted">
          Öneriler asla otomatik uygulanmaz — her birini siz onaylarsınız.
        </p>

        {error && (
          <p
            className="m-0 mb-3 rounded border px-3 py-2 text-[11.5px] leading-relaxed"
            style={{ borderColor: "#E8C5C1", background: "#FBF1F0", color: "#A23A32" }}
          >
            {error}
          </p>
        )}

        <div className="flex flex-col gap-2">
          <button type="button" onClick={handleTitles} disabled={busy !== null} className={ghostButton}>
            {busy === "titles" ? "Üretiliyor…" : "Başlık önerisi al"}
          </button>

          {body.streaming ? (
            <button
              type="button"
              onClick={body.stop}
              className="w-full rounded border border-[#E8C5C1] bg-surface px-4 py-2.5 text-[12.5px] font-semibold text-[#A23A32] transition-colors hover:bg-[#FBF1F0]"
            >
              Gövde üretimini durdur
            </button>
          ) : confirmRegenerate ? (
            <div
              className="rounded border px-3 py-2.5"
              style={{ borderColor: "#E8C5C1", background: "#FBF1F0" }}
            >
              <p className="m-0 text-[11.5px] leading-relaxed text-[#A23A32]">
                Mevcut Türkçe gövdenin üzerine yazılacak. Emin misiniz?
              </p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={handleBody}
                  className="rounded bg-[#A23A32] px-3 py-1.5 text-[11.5px] font-semibold text-white"
                >
                  Evet, yeniden üret
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmRegenerate(false)}
                  className="rounded border border-line bg-surface px-3 py-1.5 text-[11.5px] font-semibold text-muted"
                >
                  Vazgeç
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => (trBody.trim() ? setConfirmRegenerate(true) : handleBody())}
              disabled={busy !== null}
              className={ghostButton}
            >
              {trBody.trim() ? "Gövdeyi yeniden üret" : "Gövdeyi yaz"}
            </button>
          )}

          <button type="button" onClick={handleSeo} disabled={busy !== null} className={ghostButton}>
            {busy === "seo" ? "Üretiliyor…" : "SEO önerisi al"}
          </button>
          <button type="button" onClick={handleLinks} disabled={busy !== null} className={ghostButton}>
            {busy === "links" ? "Üretiliyor…" : "İç bağlantı öner"}
          </button>
          <button
            type="button"
            onClick={handleTranslate}
            disabled={busy !== null}
            className={ghostButton}
          >
            {busy === "translate"
              ? "Çevriliyor…"
              : hasEn
                ? "İngilizceyi yeniden çevir"
                : "İngilizceye çevir"}
          </button>
        </div>

        {body.error && (
          <p
            className="m-0 mt-3 rounded border px-3 py-2 text-[11.5px] leading-relaxed"
            style={{ borderColor: "#E8C5C1", background: "#FBF1F0", color: "#A23A32" }}
          >
            {body.error}
          </p>
        )}
      </div>

      {titles.length > 0 && (
        <div className={cardClass}>
          <h3 className="m-0 mb-2.5 text-[12.5px] font-bold">Başlık önerileri</h3>
          <SuggestionList
            suggestions={titles}
            currentValue={current.title}
            onPick={(v) => setLocaleField(locale, "title", v)}
            charTarget={{ min: 45, max: 60 }}
          />
        </div>
      )}

      {seo.metaTitle.length > 0 && (
        <div className={cardClass}>
          <div className="mb-2.5 flex items-baseline justify-between gap-2">
            <h3 className="m-0 text-[12.5px] font-bold">SEO önerileri</h3>
            <span className="font-mono text-[9.5px] tracking-[1px] text-gold">{dil}</span>
          </div>
          <button type="button" onClick={fillEmptySeoFields} className={`${ghostButton} mb-3`}>
            Boş alanları doldur
          </button>

          <div className="flex flex-col gap-3.5">
            <PanelField label="Meta başlık" target={{ min: 50, max: 60 }} options={seo.metaTitle} value={current.metaTitle} onPick={(v) => setLocaleField(locale, "metaTitle", v)} />
            <PanelField label="Meta açıklama" target={{ min: 140, max: 155 }} options={seo.metaDescription} value={current.metaDescription} onPick={(v) => setLocaleField(locale, "metaDescription", v)} />
            <PanelField label="Özet" target={{ min: 100, max: 160 }} options={seo.excerpt} value={current.excerpt} onPick={(v) => setLocaleField(locale, "excerpt", v)} />
            <PanelField label="Odak kelime" options={seo.focusKeyword} value={form.focusKeyword} onPick={(v) => setField("focusKeyword", v)} />
            <PanelField
              label="Etiketler"
              options={seo.tags.map((g) => g.join("\n"))}
              previews={seo.tags.map((g) => g.join(" · "))}
              value={form.tags}
              onPick={(v) => setField("tags", v)}
            />
          </div>
        </div>
      )}

      {links && (
        <div className={cardClass}>
          <h3 className="m-0 mb-2.5 text-[12.5px] font-bold">İç bağlantı önerileri</h3>
          {links.length === 0 ? (
            <p className="m-0 text-[11.5px] leading-relaxed text-muted">
              Metinle gerçekten ilgili bir bağlantı bulunamadı. Zorlama bağlantı eklemek SEO&apos;ya
              yardım etmez.
            </p>
          ) : (
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {links.map((s) => (
                <li key={`${s.phrase}-${s.href}`} className="rounded border border-line px-3 py-2.5">
                  <p className="m-0 text-[12.5px] text-ink">
                    <strong>{s.phrase}</strong> → <span className="font-mono text-[11px] text-gold">{s.href}</span>
                  </p>
                  <p className="m-0 mt-1 text-[11px] italic leading-relaxed text-muted">{s.reason}</p>
                  <button
                    type="button"
                    onClick={() => applyLink(s)}
                    className="mt-2 rounded border border-line bg-surface px-2.5 py-1 font-mono text-[10.5px] tracking-[0.5px] text-muted transition-colors hover:border-gold hover:text-gold"
                  >
                    EKLE
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

    </div>
  );
}

function PanelField({
  label,
  options,
  previews,
  value,
  onPick,
  target,
}: {
  label: string;
  options: string[];
  previews?: string[];
  value: string;
  onPick: (v: string) => void;
  target?: { min: number; max: number };
}) {
  if (options.length === 0) return null;
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11.5px] font-semibold text-ink">{label}</span>
      <SuggestionList
        suggestions={options.map((o, i) => ({ value: o, preview: previews?.[i] }))}
        currentValue={value}
        onPick={onPick}
        charTarget={target}
      />
    </div>
  );
}
