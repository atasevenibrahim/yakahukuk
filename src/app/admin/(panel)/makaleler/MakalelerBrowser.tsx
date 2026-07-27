"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MediaField } from "@/components/admin/medya/MediaField";
import { AiPanel } from "@/components/admin/makaleler/AiPanel";
import { ArticleEditor } from "@/components/admin/makaleler/ArticleEditor";
import { ChatPanel } from "@/components/admin/makaleler/ChatPanel";
import { FaqEditor } from "@/components/admin/makaleler/FaqEditor";
import type { LinkTargetOption } from "@/components/admin/makaleler/LinkDialog";
import { useBodyStream } from "@/components/admin/makaleler/useBodyStream";
import { SeoPanel } from "@/components/admin/makaleler/SeoPanel";
import { VerificationPanel } from "@/components/admin/makaleler/VerificationPanel";
import { checkPublishGate } from "@/lib/ai/citations";
import { faqToText, textToFaq } from "@/lib/ai/faq-text";
import { BASE_URL } from "@/lib/metadata";
import { saveArticle, deleteArticle } from "./actions";
import type { ArticleFormData, ArticleListItem, ArticleLocaleForm, ArticleStatus } from "./types";
import { AdminToast } from "@/components/admin/AdminToast";

const inputClass =
  "h-11 rounded border border-line bg-surface px-3.5 text-[14px] text-ink outline-none focus:border-gold";
const monoInputClass =
  "h-11 rounded border border-line bg-surface px-3.5 font-mono text-[12.5px] text-muted outline-none focus:border-gold";
const textareaClass =
  "rounded border border-line bg-surface px-3.5 py-3 text-[14px] leading-relaxed text-ink outline-none focus:border-gold resize-y";

const STATUS_LABEL: Record<ArticleStatus, string> = {
  DRAFT: "TASLAK",
  SCHEDULED: "ZAMANLANDI",
  PUBLISHED: "YAYINDA",
};
const STATUS_STYLE: Record<ArticleStatus, { color: string; border: string; bg: string }> = {
  PUBLISHED: { color: "#3F7A5B", border: "#CDE0D4", bg: "rgba(63,122,91,.06)" },
  SCHEDULED: { color: "#9C7C4A", border: "#9C7C4A", bg: "rgba(156,124,74,.08)" },
  DRAFT: { color: "#5B6270", border: "#E4DFD5", bg: "transparent" },
};

const FILTERS: ("Tümü" | ArticleStatus)[] = ["Tümü", "PUBLISHED", "DRAFT", "SCHEDULED"];

function blankForm(): ArticleFormData {
  return {
    id: null,
    slug: "",
    practiceAreaSlug: "",
    authorSlug: "",
    faq: { tr: [], en: [] },
    readMinutes: 5,
    tags: "",
    coverImageUrl: "",
    featured: false,
    status: "DRAFT",
    publishAt: "",
    focusKeyword: "",
    verifiedClaims: [],
    tr: { title: "", excerpt: "", body: "", metaTitle: "", metaDescription: "" },
    en: { title: "", excerpt: "", body: "", metaTitle: "", metaDescription: "" },
  };
}

export function MakalelerBrowser({
  initialList,
  initialForms,
  practiceAreaOptions,
  authorOptions,
  linkTargets,
}: {
  initialList: ArticleListItem[];
  initialForms: Record<string, ArticleFormData>;
  practiceAreaOptions: { value: string; label: string }[];
  authorOptions: { value: string; label: string }[];
  linkTargets: LinkTargetOption[];
}) {
  const [list, setList] = useState(initialList);
  const [forms, setForms] = useState(initialForms);
  const [view, setView] = useState<"liste" | "editor">("liste");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ArticleFormData>(blankForm());
  const [dil, setDil] = useState<"TR" | "EN">("TR");
  const [filtre, setFiltre] = useState<"Tümü" | ArticleStatus>("Tümü");
  const [arama, setArama] = useState("");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  // Gövde üretimi burada tutuluyor ki yükleme ekranı editörün üstünde çıkabilsin.
  const body = useBodyStream();
  /** Editörde seçili metin — sohbet asistanı yalnızca ona odaklanabilsin diye. */
  const [selection, setSelection] = useState("");

  function showToast(message: string) {
    setToast(message);
    setTimeout(() => setToast((current) => (current === message ? null : current)), 2500);
  }

  const filtered = useMemo(() => {
    const q = arama.trim().toLocaleLowerCase("tr");
    return list.filter((a) => (filtre === "Tümü" || a.status === filtre) && (!q || a.title.toLocaleLowerCase("tr").includes(q)));
  }, [list, filtre, arama]);

  function openEditor(id: string) {
    const form = forms[id];
    if (!form) return;
    setSelectedId(id);
    setEditForm(form);
    setDil("TR");
    setDirty(false);
    setView("editor");
  }

  function openNew() {
    setSelectedId(null);
    setEditForm(blankForm());
    setDil("TR");
    setDirty(false);
    setView("editor");
  }

  function setField<K extends keyof ArticleFormData>(key: K, value: ArticleFormData[K]) {
    setEditForm((f) => ({ ...f, [key]: value }));
    setDirty(true);
  }

  function setLocaleField(locale: "tr" | "en", key: keyof ArticleFormData["tr"], value: string) {
    setEditForm((f) => ({ ...f, [locale]: { ...f[locale], [key]: value } }));
    setDirty(true);
  }

  /** Bir dilin tüm alanlarını tek seferde değiştirir — AI çevirisi bunu kullanır. */
  function setLocaleBlock(locale: "tr" | "en", block: ArticleLocaleForm) {
    setEditForm((f) => ({ ...f, [locale]: block }));
    setDirty(true);
  }

  /** AI gövde üretimini başlatır; metin tamamlandığında tek seferde forma düşer. */
  function handleGenerateBody() {
    void body.start(
      { title: editForm.tr.title, areaSlug: editForm.practiceAreaSlug },
      { onComplete: (text) => setLocaleField("tr", "body", text) },
    );
  }

  /** Sohbet asistanının gördüğü alan kümesi — TR kaynak metin. */
  const chatFields = useMemo(
    () => ({
      body: editForm.tr.body,
      title: editForm.tr.title,
      excerpt: editForm.tr.excerpt,
      metaTitle: editForm.tr.metaTitle,
      metaDescription: editForm.tr.metaDescription,
      tags: editForm.tags,
      focusKeyword: editForm.focusKeyword,
      // SSS asistana düz metin olarak veriliyor; forma geri yazılırken çiftlere ayrılıyor.
      faq: faqToText(editForm.faq.tr),
    }),
    [editForm],
  );

  /** Onaylanan bir sohbet düzenlemesini forma yazar. */
  function applyChatEdit(next: typeof chatFields) {
    setEditForm((f) => ({
      ...f,
      tags: next.tags,
      focusKeyword: next.focusKeyword,
      faq: { ...f.faq, tr: textToFaq(next.faq) },
      tr: {
        ...f.tr,
        body: next.body,
        title: next.title,
        excerpt: next.excerpt,
        metaTitle: next.metaTitle,
        metaDescription: next.metaDescription,
      },
    }));
    setDirty(true);
  }

  function currentBody() {
    return dil === "TR" ? editForm.tr.body : editForm.en.body;
  }

  function updateBody(value: string) {
    setLocaleField(dil === "TR" ? "tr" : "en", "body", value);
  }

  async function handleSave() {
    setSaving(true);
    const result = await saveArticle(editForm);
    setSaving(false);
    if (!result.ok) {
      showToast(result.error);
      return;
    }
    setList((cur) => {
      const exists = cur.some((a) => a.id === result.list.id);
      return exists ? cur.map((a) => (a.id === result.list.id ? result.list : a)) : [...cur, result.list];
    });
    setForms((cur) => ({ ...cur, [result.form.id as string]: result.form }));
    setSelectedId(result.form.id);
    setEditForm(result.form);
    setDirty(false);
    showToast(
      result.form.status === "PUBLISHED" ? "Yayınlandı" : result.form.status === "SCHEDULED" ? "Zamanlandı" : "Taslak kaydedildi",
    );
  }

  function handleDiscard() {
    if (selectedId && forms[selectedId]) setEditForm(forms[selectedId]);
    else setEditForm(blankForm());
    setDirty(false);
    showToast("Değişiklikler geri alındı");
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    const id = deleteTarget;
    setDeleteTarget(null);
    const result = await deleteArticle(id);
    if (!result.ok) {
      showToast(result.error);
      return;
    }
    setList((cur) => cur.filter((a) => a.id !== id));
    setForms((cur) => {
      const next = { ...cur };
      delete next[id];
      return next;
    });
    if (selectedId === id) setView("liste");
    showToast("Makale silindi");
  }

  /** Bir atıfın "doğruladım" işaretini açar/kapatır. */
  function toggleClaim(key: string, next: boolean) {
    setEditForm((f) => ({
      ...f,
      verifiedClaims: next
        ? [...new Set([...f.verifiedClaims, key])]
        : f.verifiedClaims.filter((k) => k !== key),
    }));
    setDirty(true);
  }

  /**
   * Kaydedilmemiş değişiklik varken sekmeyi kapatmaya karşı koruma. Önceden hiç yoktu —
   * sekme kapanınca yazılan her şey gidiyordu.
   */
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const deleteTargetTitle = deleteTarget ? list.find((a) => a.id === deleteTarget)?.title : null;
  const hasEnLive = Object.values(editForm.en).some((v) => (typeof v === "string" ? v.trim() : false));

  // Yayın kapısı — istemci tarafı. Sunucu `saveArticle`'da aynı fonksiyonu tekrar çalıştırır.
  // `saveArticle`'ın fiilen doğruladığı alanlar — hata kaydettikten sonra değil, önce görülsün.
  const missing = useMemo(() => {
    const list: string[] = [];
    if (!editForm.tr.title.trim()) list.push("Başlık");
    if (!editForm.practiceAreaSlug) list.push("Çalışma alanı");
    return list;
  }, [editForm.tr.title, editForm.practiceAreaSlug]);
  const canSave = missing.length === 0;

  // Sunucudaki kapıyla aynı metin kümesi denetlenir (bkz. actions.ts) — SSS cevapları da dahil.
  const gate = useMemo(
    () =>
      checkPublishGate(
        `${editForm.tr.body}\n\n${faqToText(editForm.faq.tr)}`,
        editForm.verifiedClaims,
      ),
    [editForm.tr.body, editForm.faq.tr, editForm.verifiedClaims],
  );
  const confirmedSet = useMemo(() => new Set(editForm.verifiedClaims), [editForm.verifiedClaims]);

  const seoInput = useMemo(
    () => ({
      title: editForm.tr.title,
      slug: editForm.slug,
      body: editForm.tr.body,
      excerpt: editForm.tr.excerpt,
      metaTitle: editForm.tr.metaTitle,
      metaDescription: editForm.tr.metaDescription,
      focusKeyword: editForm.focusKeyword,
      baseUrl: BASE_URL,
      pathPrefix: "/makaleler",
      faqCount: editForm.faq.tr.length,
      hasAuthor: !!editForm.authorSlug,
    }),
    [editForm],
  );

  return (
    <div className="flex flex-1 flex-col">
      <div className="sticky top-[60px] z-40 flex items-center gap-5 border-b border-line bg-cream/95 px-8 py-3.5 backdrop-blur-sm">
        <div className="ml-auto flex gap-2.5">
          {view === "liste" ? (
            <>
              <button
                type="button"
                onClick={openNew}
                className="rounded border border-line bg-surface px-5 py-[11px] text-[13.5px] font-semibold text-muted transition-colors hover:border-gold hover:text-gold"
              >
                Boş editörde yaz
              </button>
              <Link
                href="/admin/makaleler/yeni"
                className="rounded bg-ink px-[22px] py-[11px] text-[13.5px] font-semibold text-cream transition-colors hover:bg-gold"
              >
                ✨ Yapay zeka ile yaz
              </Link>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setView("liste")}
              className="rounded border border-line bg-surface px-5 py-[11px] text-[13.5px] font-semibold text-muted transition-colors hover:border-gold hover:text-gold"
            >
              ← Listeye dön
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 p-8">
        {view === "liste" ? (
          <>
            <div className="mb-4 flex flex-wrap items-center gap-2.5">
              {FILTERS.map((f) => {
                const active = f === filtre;
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFiltre(f)}
                    className="rounded-full border px-4 py-2 text-[13px] font-semibold transition-colors"
                    style={{
                      borderColor: active ? "#1C2230" : "#E4DFD5",
                      background: active ? "#1C2230" : "#FFFFFF",
                      color: active ? "#F6F3EC" : "#1C2230",
                    }}
                  >
                    {f === "Tümü" ? "Tümü" : STATUS_LABEL[f]}
                  </button>
                );
              })}
              <input
                type="text"
                value={arama}
                onChange={(e) => setArama(e.target.value)}
                placeholder="Başlık ara…"
                className={`${inputClass} ml-auto w-60`}
              />
            </div>

            <div className="overflow-x-auto rounded-md border border-line bg-surface shadow-[0_1px_2px_rgba(28,34,48,0.05)]">
              {/* Şablon başlıkla satırların ikisinde de birebir aynı olmalı; ayrıca satırlar
                  <button> olduğu için w-full şart — aksi hâlde içeriği kadar daralıp başlıkla
                  hizasını kaybeder. Dar ekranda TARİH ve DİL düşer, yatay kaydırma çıkmaz. */}
              <div className="grid w-full min-w-[560px] grid-cols-[minmax(180px,1fr)_140px_120px] gap-3 border-b border-line px-5 py-3 font-mono text-[9.5px] tracking-[1.5px] text-muted lg:grid-cols-[minmax(180px,1fr)_140px_120px_100px_78px_92px]">
                <span>BAŞLIK</span>
                <span>KATEGORİ</span>
                <span>DURUM</span>
                <span className="hidden lg:block">TARİH</span>
                <span className="hidden lg:block">DİL</span>
                <span className="hidden text-right lg:block">GÖRÜNTÜLENME</span>
              </div>
              {filtered.length === 0 && (
                <p className="px-6 py-12 text-center text-sm text-muted">Eşleşen makale yok.</p>
              )}
              {filtered.map((a) => {
                const s = STATUS_STYLE[a.status];
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => openEditor(a.id)}
                    className="grid w-full min-w-[560px] grid-cols-[minmax(180px,1fr)_140px_120px] items-center gap-3 border-b border-cream px-5 py-3 text-left transition-colors hover:bg-[#FAF8F3] lg:grid-cols-[minmax(180px,1fr)_140px_120px_100px_78px_92px]"
                  >
                    <span className="overflow-hidden text-ellipsis whitespace-nowrap text-[13.5px] font-semibold">
                      {a.title || "(başlıksız)"}
                    </span>
                    <span className="font-mono text-[10px] tracking-[1px] text-gold">{a.category}</span>
                    <span
                      className="justify-self-start rounded-full border px-2.5 py-[3px] font-mono text-[9px] tracking-[1px]"
                      style={{ color: s.color, borderColor: s.border, background: s.bg }}
                    >
                      {STATUS_LABEL[a.status]}
                    </span>
                    <span className="hidden font-mono text-[11px] text-muted lg:block">
                      {a.dateLabel}
                    </span>
                    <span className="hidden gap-1.5 lg:flex">
                      <span className="rounded-full border border-[#CDE0D4] px-1.5 py-0.5 font-mono text-[9px] text-[#3F7A5B]">TR</span>
                      <span
                        className={`rounded-full border px-1.5 py-0.5 font-mono text-[9px] ${
                          a.hasEn ? "border-[#CDE0D4] text-[#3F7A5B]" : "border-[#E8C5C1] text-[#A23A32]"
                        }`}
                      >
                        EN
                      </span>
                    </span>
                    <span className="hidden text-right font-mono text-[11px] text-muted lg:block">
                      {a.views.toLocaleString("tr-TR")}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
              <div className="flex flex-col gap-4">
                <div className="rounded-md border border-line bg-surface p-6 shadow-[0_1px_2px_rgba(28,34,48,0.05)]">
                  <div className="mb-5 flex gap-1 border-b border-line">
                    {(["TR", "EN"] as const).map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDil(d)}
                        className={`border-b-2 px-5 py-2.5 font-mono text-xs tracking-[1.5px] transition-colors ${
                          dil === d ? "border-gold text-ink" : "border-transparent text-muted"
                        }`}
                      >
                        {d}
                        {d === "EN" && !hasEnLive && (
                          <span className="ml-1.5 rounded-full border border-[#E8C5C1] px-1.5 py-[1px] text-[8.5px] text-[#A23A32]">
                            EKSİK
                          </span>
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[13px] font-semibold">Başlık{dil === "EN" ? " (EN)" : ""}{dil === "TR" && <span className="ml-1 text-[#A23A32]" title="Zorunlu alan">*</span>}</label>
                      <input
                        type="text"
                        value={dil === "TR" ? editForm.tr.title : editForm.en.title}
                        onChange={(e) => setLocaleField(dil === "TR" ? "tr" : "en", "title", e.target.value)}
                        className={inputClass}
                      />
                    </div>
                    {dil === "TR" && (
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[13px] font-semibold">Slug</label>
                        <input
                          type="text"
                          value={editForm.slug}
                          onChange={(e) => setField("slug", e.target.value)}
                          placeholder="Boş bırakılırsa başlıktan otomatik üretilir."
                          className={monoInputClass}
                        />
                      </div>
                    )}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[13px] font-semibold">Özet{dil === "EN" ? " (EN)" : ""}</label>
                      <textarea
                        value={dil === "TR" ? editForm.tr.excerpt : editForm.en.excerpt}
                        onChange={(e) => setLocaleField(dil === "TR" ? "tr" : "en", "excerpt", e.target.value)}
                        rows={2}
                        className={textareaClass}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[13px] font-semibold">İçerik{dil === "EN" ? " (EN)" : ""}</label>
                      <ArticleEditor
                        // Dil değişince editör sıfırdan kurulmalı; aksi hâlde TR içeriği
                        // EN sekmesinde görünmeye devam eder.
                        key={`${selectedId ?? "yeni"}-${dil}`}
                        value={currentBody()}
                        onChange={updateBody}
                        linkTargets={linkTargets}
                        draftKey={`${selectedId ?? "yeni"}-${dil}`}
                        onSelectionChange={dil === "TR" ? setSelection : undefined}
                        generation={
                          dil === "TR"
                            ? {
                                active: body.streaming,
                                startedAt: body.startedAt,
                                charCount: body.text.length,
                                onCancel: body.stop,
                              }
                            : undefined
                        }
                      />
                      {body.error && (
                        <p
                          className="m-0 rounded border px-3 py-2 text-[11.5px] leading-relaxed"
                          style={{ borderColor: "#E8C5C1", background: "#FBF1F0", color: "#A23A32" }}
                        >
                          {body.error}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-md border border-line bg-surface p-6 shadow-[0_1px_2px_rgba(28,34,48,0.05)]">
                  <h2 className="m-0 mb-4 text-sm font-bold">SEO</h2>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[13px] font-semibold">Meta başlık{dil === "EN" ? " (EN)" : ""}</label>
                      <input
                        type="text"
                        value={dil === "TR" ? editForm.tr.metaTitle : editForm.en.metaTitle}
                        onChange={(e) => setLocaleField(dil === "TR" ? "tr" : "en", "metaTitle", e.target.value)}
                        className={inputClass}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <MediaField
                        label="Kapak görseli"
                        value={editForm.coverImageUrl}
                        onChange={(url) => setField("coverImageUrl", url)}
                        hint="Boş bırakılırsa kapak, başlıktan otomatik üretilen tipografik görsel olur."
                      />
                    </div>
                    <div className="flex flex-col gap-1.5 sm:col-span-2">
                      <label className="text-[13px] font-semibold">Meta açıklama{dil === "EN" ? " (EN)" : ""}</label>
                      <textarea
                        value={dil === "TR" ? editForm.tr.metaDescription : editForm.en.metaDescription}
                        onChange={(e) => setLocaleField(dil === "TR" ? "tr" : "en", "metaDescription", e.target.value)}
                        rows={2}
                        className={textareaClass}
                      />
                    </div>
                    {dil === "TR" && (
                      <div className="flex flex-col gap-1.5 sm:col-span-2">
                        <label className="text-[13px] font-semibold">Odak anahtar kelime</label>
                        <input
                          type="text"
                          value={editForm.focusKeyword}
                          onChange={(e) => setField("focusKeyword", e.target.value)}
                          placeholder="Okuyucunun Google'a yazacağı ifade"
                          className={inputClass}
                        />
                        <p className="m-0 text-[11.5px] leading-relaxed text-muted">
                          SEO denetimleri bu kelimenin başlıkta, adreste ve ilk paragrafta geçip
                          geçmediğini kontrol eder.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-md border border-line bg-surface p-6 shadow-[0_1px_2px_rgba(28,34,48,0.05)]">
                  <h2 className="m-0 mb-1 text-sm font-bold">
                    Sık sorulan sorular{dil === "EN" ? " (EN)" : ""}
                  </h2>
                  <p className="m-0 mb-4 text-[11.5px] leading-relaxed text-muted">
                    Girilen sorular makale sayfasında açılır bölüm olarak görünür ve Google&apos;a
                    <strong> FAQPage</strong> yapılandırılmış verisi olarak bildirilir — arama
                    sonucunda soru-cevap kutusu çıkma ihtimali doğar. Sohbet asistanı da bu alanı
                    doldurabilir.
                  </p>
                  <FaqEditor
                    items={dil === "TR" ? editForm.faq.tr : editForm.faq.en}
                    langLabel={dil}
                    onChange={(next) =>
                      setField("faq", { ...editForm.faq, [dil === "TR" ? "tr" : "en"]: next })
                    }
                  />
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="rounded-md border border-line bg-surface p-5 shadow-[0_1px_2px_rgba(28,34,48,0.05)]">
                  <h2 className="m-0 mb-3.5 text-sm font-bold">Yayın</h2>
                  <div className="flex flex-col gap-2">
                    {(
                      [
                        { value: "PUBLISHED", label: "Hemen yayınla" },
                        { value: "DRAFT", label: "Taslak olarak kaydet" },
                        { value: "SCHEDULED", label: "İleri tarihe zamanla" },
                      ] as const
                    ).map((opt) => {
                      const active = editForm.status === opt.value;
                      // Yayına çıkaran iki seçenek kapı geçilmeden kilitli. Taslak her zaman açık.
                      const locked = opt.value !== "DRAFT" && !gate.ok;
                      return (
                        <label
                          key={opt.value}
                          title={locked ? gate.reason : undefined}
                          className={`flex items-center gap-2.5 rounded border px-3 py-2.5 ${
                            locked ? "cursor-not-allowed opacity-55" : "cursor-pointer"
                          }`}
                          style={{ borderColor: active ? "#9C7C4A" : "#E4DFD5", background: active ? "rgba(156,124,74,.06)" : "#FFFFFF" }}
                        >
                          <input
                            type="radio"
                            checked={active}
                            disabled={locked}
                            onChange={() => setField("status", opt.value)}
                            className="cursor-pointer accent-gold disabled:cursor-not-allowed"
                          />
                          <span className="text-[13px] font-semibold">{opt.label}</span>
                          {locked && <span aria-hidden className="ml-auto text-[12px]">🔒</span>}
                        </label>
                      );
                    })}
                    {!gate.ok && (
                      <p
                        className="m-0 rounded border px-3 py-2 text-[11.5px] leading-relaxed"
                        style={{ borderColor: "#E8C5C1", background: "#FBF1F0", color: "#A23A32" }}
                      >
                        {gate.reason}
                      </p>
                    )}
                    {editForm.status === "SCHEDULED" && (
                      <input
                        type="datetime-local"
                        value={editForm.publishAt}
                        onChange={(e) => setField("publishAt", e.target.value)}
                        className={`${inputClass} mt-1`}
                      />
                    )}
                    <label className="mt-1.5 flex cursor-pointer items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={editForm.featured}
                        onChange={(e) => setField("featured", e.target.checked)}
                        className="h-4 w-4 cursor-pointer accent-gold"
                      />
                      <span className="text-[13px] text-muted">Ana sayfada öne çıkar</span>
                    </label>
                  </div>
                </div>

                <div className="rounded-md border border-line bg-surface p-5 shadow-[0_1px_2px_rgba(28,34,48,0.05)]">
                  <h2 className="m-0 mb-3.5 text-sm font-bold">Çalışma alanı<span className="ml-1 text-[#A23A32]" title="Zorunlu alan">*</span></h2>
                  <select
                    value={editForm.practiceAreaSlug}
                    onChange={(e) => setField("practiceAreaSlug", e.target.value)}
                    className={`${inputClass} w-full cursor-pointer`}
                  >
                    <option value="">— Seçin —</option>
                    {practiceAreaOptions.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <p className="m-0 mt-2 text-[11.5px] leading-relaxed text-muted">
                    Kategori etiketi ve ilgili makale eşleştirmesi bu seçime göre otomatik belirlenir.
                  </p>
                </div>

                <div className="rounded-md border border-line bg-surface p-5 shadow-[0_1px_2px_rgba(28,34,48,0.05)]">
                  <h2 className="m-0 mb-3.5 text-sm font-bold">Yazar</h2>
                  <select
                    value={editForm.authorSlug}
                    onChange={(e) => setField("authorSlug", e.target.value)}
                    className={`${inputClass} w-full cursor-pointer`}
                  >
                    <option value="">— Kurum adına —</option>
                    {authorOptions.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <p className="m-0 mt-2 text-[11.5px] leading-relaxed text-muted">
                    {authorOptions.length === 0
                      ? "Ekip listesi boş. Yazar atayabilmek için önce Ekip bölümünden avukatları girin."
                      : "Hukuk içeriğinde yazar kimliği doğrudan sıralama etkeni. Seçilen kişinin adı, barosu ve ekip sayfası bağlantısı makalede görünür; Google'a Person verisi olarak bildirilir."}
                  </p>
                </div>

                <div className="rounded-md border border-line bg-surface p-5 shadow-[0_1px_2px_rgba(28,34,48,0.05)]">
                  <h2 className="m-0 mb-3.5 text-sm font-bold">Diğer</h2>
                  <div className="flex flex-col gap-3.5">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[12.5px] font-semibold">Okuma süresi (dk)</label>
                      <input
                        type="number"
                        min={1}
                        value={editForm.readMinutes}
                        onChange={(e) => setField("readMinutes", Number(e.target.value))}
                        className={inputClass}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[12.5px] font-semibold">Etiketler</label>
                      <textarea
                        value={editForm.tags}
                        onChange={(e) => setField("tags", e.target.value)}
                        rows={3}
                        placeholder="Her satır bir etiket"
                        className={textareaClass}
                      />
                    </div>
                  </div>
                </div>

                <div className="h-[560px]">
                  <ChatPanel
                    fields={chatFields}
                    onApply={applyChatEdit}
                    selection={selection}
                    storageKey={selectedId ?? "yeni"}
                  />
                </div>

                <div className="rounded-md border border-line bg-surface p-5 shadow-[0_1px_2px_rgba(28,34,48,0.05)]">
                  <h2 className="m-0 mb-3.5 text-sm font-bold">SEO durumu</h2>
                  <SeoPanel input={seoInput} />
                </div>

                <div className="rounded-md border border-line bg-surface p-5 shadow-[0_1px_2px_rgba(28,34,48,0.05)]">
                  <h2 className="m-0 mb-1 text-sm font-bold">Bilgi doğrulama</h2>
                  <p className="m-0 mb-3 text-[11px] leading-relaxed text-muted">
                    Yayınlamak için her somut iddiayı kaynaktan teyit edip işaretlemeniz
                    gerekiyor. İşaretler kaydedilir; sonraki düzenlemelerde tekrar sorulmaz.
                  </p>
                  <VerificationPanel
                    text={editForm.tr.body}
                    confirmed={confirmedSet}
                    onToggle={toggleClaim}
                  />
                </div>

                <AiPanel
                  form={editForm}
                  dil={dil}
                  setField={setField}
                  setLocaleField={setLocaleField}
                  setLocaleBlock={setLocaleBlock}
                  onGenerateBody={handleGenerateBody}
                  generating={body.streaming}
                  showToast={showToast}
                />

                {selectedId && (
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(selectedId)}
                    className="rounded border border-[#E8C5C1] bg-surface px-5 py-[11px] text-[13.5px] font-semibold text-[#A23A32] transition-colors hover:bg-[#FBF1F0]"
                  >
                    Makaleyi sil
                  </button>
                )}
              </div>
            </div>

            <div className="sticky bottom-4 mt-5 flex flex-wrap items-center justify-between gap-4 rounded-md border border-line bg-surface px-6 py-3.5 shadow-[0_-2px_16px_rgba(28,34,48,0.08)]">
              <span
                className="text-[13px]"
                style={{ color: !canSave ? "#A23A32" : dirty ? "#9C7C4A" : "#5B6270" }}
              >
                {!canSave
                  ? `Zorunlu alan boş: ${missing.join(", ")}`
                  : dirty
                    ? "Kaydedilmemiş değişiklikler var"
                    : "Tüm değişiklikler kayıtlı"}
              </span>
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={handleDiscard}
                  disabled={!dirty}
                  className="rounded border border-line bg-surface px-5 py-[11px] text-[13.5px] font-semibold text-muted transition-colors hover:border-gold hover:text-gold disabled:opacity-50"
                >
                  Değişiklikleri geri al
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || !canSave}
                  title={canSave ? undefined : `Zorunlu alan boş: ${missing.join(", ")}`}
                  className="rounded bg-ink px-[26px] py-[11px] text-[13.5px] font-semibold text-cream transition-colors hover:bg-gold disabled:opacity-50"
                >
                  {saving ? "Kaydediliyor…" : selectedId ? "Kaydet" : "Makaleyi oluştur"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-[98] flex items-center justify-center bg-[rgba(28,34,48,0.4)] p-6">
          <div className="w-[420px] max-w-full rounded-md border-t-2 border-t-[#A23A32] bg-white p-8 shadow-[0_24px_60px_rgba(28,34,48,0.3)]">
            <h2 className="m-0 font-serif text-2xl font-semibold">Silmek istediğinize emin misiniz?</h2>
            <p className="m-0 mt-3 text-sm leading-relaxed text-muted">
              <strong>{deleteTargetTitle}</strong> kalıcı olarak silinecek. Bu işlem geri alınamaz.
            </p>
            <div className="mt-[26px] flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded border border-line bg-surface px-5 py-[11px] text-[13.5px] font-semibold text-muted transition-colors hover:border-gold hover:text-gold"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="rounded bg-[#A23A32] px-[22px] py-[11px] text-[13.5px] font-semibold text-white"
              >
                Evet, sil
              </button>
            </div>
          </div>
        </div>
      )}

      <AdminToast message={toast} aboveSaveBar={view === "editor"} />
    </div>
  );
}
