"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AiPanel } from "@/components/admin/makaleler/AiPanel";
import { saveArticle, deleteArticle } from "./actions";
import type { ArticleFormData, ArticleListItem, ArticleLocaleForm, ArticleStatus } from "./types";

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

type ToolAction = "line" | "cursor" | "wrap" | "unsupported";

const TOOLS: {
  label: string;
  hint: string;
  action: ToolAction;
  value: string;
  /** wrap: seçimin sonuna eklenen kapanış (yoksa `value` tekrar kullanılır) */
  close?: string;
}[] = [
  { label: "H2", hint: "Başlık", action: "line", value: "## " },
  { label: "H3", hint: "Alt başlık", action: "line", value: "### " },
  { label: "¶", hint: "Paragraf arası", action: "cursor", value: "\n\n" },
  { label: "≡", hint: "Liste", action: "line", value: "- " },
  { label: "1.", hint: "Sıralı liste", action: "line", value: "1. " },
  { label: "❝", hint: "Alıntı", action: "line", value: "> " },
  { label: "B", hint: "Kalın", action: "wrap", value: "**" },
  { label: "I", hint: "İtalik", action: "wrap", value: "*" },
  { label: "🔗", hint: "Link", action: "wrap", value: "[", close: "](/yol)" },
  { label: "—", hint: "Uzun çizgi", action: "cursor", value: "—" },
  { label: "▦", hint: "Görsel ekle", action: "unsupported", value: "" },
];

function blankForm(): ArticleFormData {
  return {
    id: null,
    slug: "",
    practiceAreaSlug: "",
    readMinutes: 5,
    tags: "",
    coverImageUrl: "",
    featured: false,
    status: "DRAFT",
    publishAt: "",
    focusKeyword: "",
    tr: { title: "", excerpt: "", body: "", metaTitle: "", metaDescription: "" },
    en: { title: "", excerpt: "", body: "", metaTitle: "", metaDescription: "" },
  };
}

export function MakalelerBrowser({
  initialList,
  initialForms,
  practiceAreaOptions,
}: {
  initialList: ArticleListItem[];
  initialForms: Record<string, ArticleFormData>;
  practiceAreaOptions: { value: string; label: string }[];
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
  const bodyRef = useRef<HTMLTextAreaElement>(null);

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

  /**
   * AI akışının gövde parçalarını sona ekler. Fonksiyonel güncelleme şart: parçalar hızlı
   * ardışık geliyor ve her biri bir öncekinin sonucunu görmek zorunda.
   */
  function appendTrBody(delta: string) {
    setEditForm((f) => ({ ...f, tr: { ...f.tr, body: f.tr.body + delta } }));
    setDirty(true);
  }

  function currentBody() {
    return dil === "TR" ? editForm.tr.body : editForm.en.body;
  }

  function updateBody(value: string) {
    setLocaleField(dil === "TR" ? "tr" : "en", "body", value);
  }

  function runTool(tool: (typeof TOOLS)[number]) {
    if (tool.action === "unsupported") {
      showToast(`${tool.hint}: medya kütüphanesi eklendiğinde kullanılabilir olacak.`);
      return;
    }
    const el = bodyRef.current;
    const value = currentBody();
    if (!el) {
      updateBody(tool.action === "cursor" ? value + tool.value : value);
      return;
    }

    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? start;

    // İmleci/seçimi düzenlemeden sonra doğru yere koyar.
    const restore = (from: number, to: number) =>
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(from, to);
      });

    if (tool.action === "wrap") {
      const open = tool.value;
      const close = tool.close ?? tool.value;
      const selected = value.slice(start, end);
      const next = value.slice(0, start) + open + selected + close + value.slice(end);
      updateBody(next);
      // Seçim varsa sarılmış metni seçili bırak; yoksa imleci işaretlerin arasına al.
      if (selected) restore(start + open.length, start + open.length + selected.length);
      else restore(start + open.length, start + open.length);
      return;
    }

    if (tool.action === "line") {
      const lineStart = value.lastIndexOf("\n", start - 1) + 1;
      const next = value.slice(0, lineStart) + tool.value + value.slice(lineStart);
      updateBody(next);
      restore(start + tool.value.length, end + tool.value.length);
      return;
    }

    const next = value.slice(0, start) + tool.value + value.slice(end);
    updateBody(next);
    restore(start + tool.value.length, start + tool.value.length);
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

  const deleteTargetTitle = deleteTarget ? list.find((a) => a.id === deleteTarget)?.title : null;
  const hasEnLive = Object.values(editForm.en).some((v) => (typeof v === "string" ? v.trim() : false));

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
              <div className="grid min-w-[680px] grid-cols-[minmax(180px,1fr)_110px_116px_92px_76px] gap-3 border-b border-line px-5 py-3 font-mono text-[9.5px] tracking-[1.5px] text-muted">
                <span>BAŞLIK</span>
                <span>KATEGORİ</span>
                <span>DURUM</span>
                <span>TARİH</span>
                <span>DİL</span>
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
                    className="grid min-w-[680px] grid-cols-[minmax(180px,1fr)_110px_116px_92px_76px] items-center gap-3 border-b border-cream px-5 py-3 text-left transition-colors hover:bg-[#FAF8F3]"
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
                    <span className="font-mono text-[11px] text-muted">{a.dateLabel}</span>
                    <span className="flex gap-1.5">
                      <span className="rounded-full border border-[#CDE0D4] px-1.5 py-0.5 font-mono text-[9px] text-[#3F7A5B]">TR</span>
                      <span
                        className={`rounded-full border px-1.5 py-0.5 font-mono text-[9px] ${
                          a.hasEn ? "border-[#CDE0D4] text-[#3F7A5B]" : "border-[#E8C5C1] text-[#A23A32]"
                        }`}
                      >
                        EN
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
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
                      <label className="text-[13px] font-semibold">Başlık{dil === "EN" ? " (EN)" : ""}</label>
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
                      <div className="overflow-hidden rounded border border-line">
                        <div className="flex flex-wrap gap-0.5 border-b border-line bg-[#FAF8F3] p-2">
                          {TOOLS.map((tool) => (
                            <button
                              key={tool.label}
                              type="button"
                              title={tool.hint}
                              onClick={() => runTool(tool)}
                              className="flex h-[30px] min-w-[32px] items-center justify-center rounded border border-transparent px-1.5 text-[13px] text-muted transition-colors hover:border-line hover:bg-white hover:text-ink"
                            >
                              {tool.label}
                            </button>
                          ))}
                        </div>
                        <textarea
                          ref={bodyRef}
                          value={currentBody()}
                          onChange={(e) => updateBody(e.target.value)}
                          rows={14}
                          className="w-full resize-y border-none px-4 py-4 text-[14.5px] leading-[1.7] text-ink outline-none"
                        />
                      </div>
                      <p className="m-0 text-[11.5px] leading-relaxed text-muted">
                        Markdown: <code>## başlık</code>, <code>### alt başlık</code>,{" "}
                        <code>- liste</code>, <code>1. sıralı</code>, <code>&gt; alıntı</code>,{" "}
                        <code>**kalın**</code>, <code>*italik*</code>,{" "}
                        <code>[metin](/yol)</code>. Bloklar arasına boş satır bırakın.
                      </p>
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
                      <label className="text-[13px] font-semibold">Kapak görseli URL&apos;si</label>
                      <input
                        type="text"
                        value={editForm.coverImageUrl}
                        onChange={(e) => setField("coverImageUrl", e.target.value)}
                        placeholder="Medya kütüphanesi eklenene kadar doğrudan adres"
                        className={inputClass}
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
                      return (
                        <label
                          key={opt.value}
                          className="flex cursor-pointer items-center gap-2.5 rounded border px-3 py-2.5"
                          style={{ borderColor: active ? "#9C7C4A" : "#E4DFD5", background: active ? "rgba(156,124,74,.06)" : "#FFFFFF" }}
                        >
                          <input
                            type="radio"
                            checked={active}
                            onChange={() => setField("status", opt.value)}
                            className="cursor-pointer accent-gold"
                          />
                          <span className="text-[13px] font-semibold">{opt.label}</span>
                        </label>
                      );
                    })}
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
                  <h2 className="m-0 mb-3.5 text-sm font-bold">Çalışma alanı</h2>
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

                <AiPanel
                  form={editForm}
                  dil={dil}
                  setField={setField}
                  setLocaleField={setLocaleField}
                  setLocaleBlock={setLocaleBlock}
                  appendTrBody={appendTrBody}
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
              <span className="text-[13px]" style={{ color: dirty ? "#9C7C4A" : "#5B6270" }}>
                {dirty ? "Kaydedilmemiş değişiklikler var" : "Tüm değişiklikler kayıtlı"}
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
                  disabled={saving}
                  className="rounded bg-ink px-[26px] py-[11px] text-[13.5px] font-semibold text-cream transition-colors hover:bg-gold disabled:opacity-50"
                >
                  {saving ? "Kaydediliyor…" : "Kaydet"}
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

      {toast && (
        <div className="fixed bottom-7 left-1/2 z-[99] -translate-x-1/2 rounded bg-ink px-6 py-3.5 text-sm font-semibold text-cream shadow-[0_8px_24px_rgba(28,34,48,0.25)]">
          {toast}
        </div>
      )}
    </div>
  );
}
