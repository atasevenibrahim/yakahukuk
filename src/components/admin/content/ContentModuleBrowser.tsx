"use client";

import { useState } from "react";
import type { FieldDef } from "@/lib/admin/content-fields";

export type ModuleItem = {
  id: string;
  order: number;
  published: boolean;
  featured: boolean | null; // null → bu modülde "öne çıkar" alanı yok
  listTitle: string;
  listSubtitle: string;
  hasEn: boolean;
  top: Record<string, string>;
  tr: Record<string, string>;
  en: Record<string, string>;
};

export type SavePayload = {
  id: string | null;
  top: Record<string, string>;
  tr: Record<string, string>;
  en: Record<string, string>;
  published: boolean;
  featured: boolean;
};

export type SaveResult = { ok: true; item: ModuleItem } | { ok: false; error: string };
export type SimpleResult = { ok: true } | { ok: false; error: string };

const inputClass =
  "h-11 rounded border border-line bg-surface px-3.5 text-[14px] text-ink outline-none focus:border-gold";
const textareaClass =
  "rounded border border-line bg-surface px-3.5 py-3 text-[14px] leading-relaxed text-ink outline-none focus:border-gold resize-y";

function emptyMap(fields: FieldDef[]): Record<string, string> {
  return Object.fromEntries(fields.map((f) => [f.key, f.options?.[0]?.value ?? ""]));
}

function Field({
  field,
  value,
  onChange,
}: {
  field: FieldDef;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[13px] font-semibold">{field.label}</label>
      {field.kind === "select" ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${inputClass} cursor-pointer`}
        >
          {field.options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : field.kind === "textarea" || field.kind === "lines" ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={field.rows ?? (field.kind === "lines" ? 5 : 3)}
          readOnly={field.readOnly}
          className={textareaClass}
        />
      ) : field.kind === "number" ? (
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          readOnly={field.readOnly}
          className={inputClass}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          readOnly={field.readOnly}
          className={`${inputClass} ${field.readOnly ? "text-muted" : ""}`}
        />
      )}
      {field.hint && <p className="m-0 text-[11.5px] leading-relaxed text-muted">{field.hint}</p>}
    </div>
  );
}

export function ContentModuleBrowser({
  moduleTitle,
  items: initialItems,
  topFields,
  localizedFields,
  publishedLabel = "Yayında",
  showPublished = true,
  showFeatured = false,
  featuredLabel = "Öne çıkar",
  allowCreate = true,
  allowDelete = true,
  allowReorder = true,
  emptyStateHint,
  onSave,
  onDelete,
  onReorder,
}: {
  moduleTitle: string;
  items: ModuleItem[];
  topFields: FieldDef[];
  localizedFields: FieldDef[];
  publishedLabel?: string;
  showPublished?: boolean;
  showFeatured?: boolean;
  featuredLabel?: string;
  allowCreate?: boolean;
  allowDelete?: boolean;
  allowReorder?: boolean;
  emptyStateHint?: string;
  onSave: (payload: SavePayload) => Promise<SaveResult>;
  onDelete: (id: string) => Promise<SimpleResult>;
  onReorder: (orderedIds: string[]) => Promise<SimpleResult>;
}) {
  const [items, setItems] = useState(initialItems);
  const [selectedId, setSelectedId] = useState<string | null>(initialItems[0]?.id ?? null);
  const [dil, setDil] = useState<"TR" | "EN">("TR");
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [dirty, setDirty] = useState(false);

  const selected = items.find((i) => i.id === selectedId) ?? null;
  const [formTop, setFormTop] = useState<Record<string, string>>(selected?.top ?? emptyMap(topFields));
  const [formTr, setFormTr] = useState<Record<string, string>>(selected?.tr ?? emptyMap(localizedFields));
  const [formEn, setFormEn] = useState<Record<string, string>>(selected?.en ?? {});
  const [formPublished, setFormPublished] = useState(selected?.published ?? true);
  const [formFeatured, setFormFeatured] = useState(selected?.featured ?? false);

  function showToast(message: string) {
    setToast(message);
    setTimeout(() => setToast((current) => (current === message ? null : current)), 2500);
  }

  function selectItem(item: ModuleItem) {
    setSelectedId(item.id);
    setFormTop(item.top);
    setFormTr(item.tr);
    setFormEn(item.en);
    setFormPublished(item.published);
    setFormFeatured(item.featured ?? false);
    setDil("TR");
    setDirty(false);
  }

  const hasEnLive = Object.values(formEn).some((v) => v.trim());

  async function handleSave() {
    setSaving(true);
    const result = await onSave({
      id: selectedId,
      top: formTop,
      tr: formTr,
      en: formEn,
      published: formPublished,
      featured: formFeatured,
    });
    setSaving(false);
    if (!result.ok) {
      showToast(result.error);
      return;
    }
    setItems((current) => {
      const exists = current.some((i) => i.id === result.item.id);
      return exists
        ? current.map((i) => (i.id === result.item.id ? result.item : i))
        : [...current, result.item];
    });
    setSelectedId(result.item.id);
    setDirty(false);
    showToast("Kaydedildi");
  }

  function handleDiscard() {
    if (selected) selectItem(selected);
    else {
      setFormTop(emptyMap(topFields));
      setFormTr(emptyMap(localizedFields));
      setFormEn({});
    }
    setDirty(false);
    showToast("Değişiklikler geri alındı");
  }

  async function handleCreate() {
    setCreating(true);
    const result = await onSave({
      id: null,
      top: emptyMap(topFields),
      tr: emptyMap(localizedFields),
      en: {},
      published: false,
      featured: false,
    });
    setCreating(false);
    if (!result.ok) {
      showToast(result.error);
      return;
    }
    setItems((current) => [...current, result.item]);
    selectItem(result.item);
    showToast("Yeni kayıt eklendi");
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    const id = deleteTarget;
    setDeleteTarget(null);
    const result = await onDelete(id);
    if (!result.ok) {
      showToast(result.error);
      return;
    }
    setItems((current) => {
      const next = current.filter((i) => i.id !== id);
      if (selectedId === id) {
        const fallback = next[0] ?? null;
        if (fallback) selectItem(fallback);
        else {
          setSelectedId(null);
          setFormTop(emptyMap(topFields));
          setFormTr(emptyMap(localizedFields));
          setFormEn({});
        }
      }
      return next;
    });
    showToast("Kayıt silindi");
  }

  async function handleDrop(targetIndex: number) {
    if (dragIndex === null || dragIndex === targetIndex) {
      setDragIndex(null);
      return;
    }
    const next = [...items];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(targetIndex, 0, moved);
    setItems(next);
    setDragIndex(null);
    const result = await onReorder(next.map((i) => i.id));
    if (!result.ok) {
      setItems(items);
      showToast(result.error);
      return;
    }
    showToast("Sıralama güncellendi");
  }

  const deleteTargetItem = items.find((i) => i.id === deleteTarget) ?? null;

  return (
    <div className="flex flex-1 flex-col gap-4 p-8">
      <div className="flex items-center gap-4">
        <p className="m-0 flex items-center gap-2 text-[12.5px] text-muted">
          <span className="font-mono text-sm text-gold">⠿</span>
          {allowReorder
            ? "Satırları tutamaçtan sürükleyerek sıralayın; sıra otomatik kaydedilir."
            : emptyStateHint}
        </p>
        {allowCreate && (
          <button
            type="button"
            onClick={handleCreate}
            disabled={creating}
            className="ml-auto rounded bg-ink px-[22px] py-[11px] text-[13.5px] font-semibold text-cream transition-colors hover:bg-gold disabled:opacity-50"
          >
            {creating ? "Ekleniyor…" : "+ Yeni ekle"}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(320px,1fr)_minmax(0,1.1fr)]">
        <div className="overflow-hidden rounded-md border border-line bg-surface shadow-[0_1px_2px_rgba(28,34,48,0.05)]">
          {items.length === 0 && (
            <p className="px-6 py-10 text-center text-sm text-muted">Henüz kayıt yok.</p>
          )}
          {items.map((item, index) => (
            <div
              key={item.id}
              draggable={allowReorder}
              onDragStart={() => setDragIndex(index)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(index)}
              onClick={() => selectItem(item)}
              className={`flex cursor-pointer items-center gap-3 border-b border-cream px-4 py-3.5 transition-colors hover:bg-[#FAF8F3] ${
                item.id === selectedId ? "border-l-2 border-l-gold bg-[#FAF8F3]" : "border-l-2 border-l-transparent bg-surface"
              }`}
            >
              {allowReorder && (
                <span className="flex-none cursor-grab font-mono text-[15px] text-line" title="Sürükle">
                  ⠿
                </span>
              )}
              <span className="mt-0.5 h-[11px] w-[11px] flex-none rotate-45 border-[1.5px] border-gold" />
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="overflow-hidden text-ellipsis whitespace-nowrap text-[13.5px] font-semibold">
                  {item.listTitle || "(başlıksız)"}
                </span>
                <span className="overflow-hidden text-ellipsis whitespace-nowrap text-[11.5px] text-muted">
                  {item.listSubtitle}
                </span>
              </span>
              <span
                className={`flex-none rounded-full border px-2.5 py-[3px] font-mono text-[8.5px] tracking-[1px] ${
                  item.published
                    ? "border-[#CDE0D4] bg-[rgba(63,122,91,0.06)] text-[#3F7A5B]"
                    : "border-line text-muted"
                }`}
              >
                {item.published ? (publishedLabel === "Onaylı (yayınlanır)" ? "ONAYLI" : "YAYINDA") : "TASLAK"}
              </span>
              <span className="flex flex-none gap-1">
                <span className="rounded-full border border-[#CDE0D4] px-1.5 py-0.5 font-mono text-[8.5px] text-[#3F7A5B]">
                  TR
                </span>
                <span
                  className={`rounded-full border px-1.5 py-0.5 font-mono text-[8.5px] ${
                    item.hasEn ? "border-[#CDE0D4] text-[#3F7A5B]" : "border-[#E8C5C1] text-[#A23A32]"
                  }`}
                >
                  EN
                </span>
              </span>
              {allowDelete && (
                <button
                  type="button"
                  title="Sil"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteTarget(item.id);
                  }}
                  className="flex h-7 w-7 flex-none items-center justify-center rounded border border-transparent text-line transition-colors hover:border-[#E8C5C1] hover:bg-[#FBF1F0] hover:text-[#A23A32]"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-4">
          {selected || !allowCreate ? (
            <div className="rounded-md border border-line bg-surface p-6 shadow-[0_1px_2px_rgba(28,34,48,0.05)]">
              <span className="font-mono text-[10px] tracking-[2px] text-gold">DÜZENLE</span>
              <h2 className="m-0 mb-[18px] mt-1.5 text-[17px] font-bold">
                {selected?.listTitle || moduleTitle}
              </h2>

              {topFields.length > 0 && (
                <div className="mb-5 flex flex-col gap-3.5 border-b border-line pb-5">
                  {topFields.map((f) => (
                    <Field
                      key={f.key}
                      field={f}
                      value={formTop[f.key] ?? ""}
                      onChange={(v) => {
                        setFormTop((cur) => ({ ...cur, [f.key]: v }));
                        setDirty(true);
                      }}
                    />
                  ))}
                </div>
              )}

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
                {localizedFields.map((f) => {
                  const map = dil === "TR" ? formTr : formEn;
                  const setMap = dil === "TR" ? setFormTr : setFormEn;
                  return (
                    <Field
                      key={f.key}
                      field={{ ...f, label: dil === "EN" ? `${f.label} (EN)` : f.label }}
                      value={map[f.key] ?? ""}
                      onChange={(v) => {
                        setMap((cur) => ({ ...cur, [f.key]: v }));
                        setDirty(true);
                      }}
                    />
                  );
                })}

                <div className="flex flex-wrap items-center gap-[18px] pt-1">
                  {showPublished && (
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formPublished}
                        onChange={(e) => {
                          setFormPublished(e.target.checked);
                          setDirty(true);
                        }}
                        className="h-4 w-4 cursor-pointer accent-gold"
                      />
                      <span className="text-[13px] font-semibold">{publishedLabel}</span>
                    </label>
                  )}
                  {showFeatured && (
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formFeatured}
                        onChange={(e) => {
                          setFormFeatured(e.target.checked);
                          setDirty(true);
                        }}
                        className="h-4 w-4 cursor-pointer accent-gold"
                      />
                      <span className="text-[13px] font-semibold">{featuredLabel}</span>
                    </label>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-md border border-dashed border-line bg-surface p-10 text-center">
              <p className="m-0 text-[14.5px] font-semibold">Düzenlemek için soldan bir kayıt seçin.</p>
            </div>
          )}

          {(selected || items.length === 0) && (
            <div className="sticky bottom-4 flex flex-wrap items-center justify-between gap-4 rounded-md border border-line bg-surface px-6 py-3.5 shadow-[0_-2px_16px_rgba(28,34,48,0.08)]">
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
                  Geri al
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
          )}
        </div>
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-[98] flex items-center justify-center bg-[rgba(28,34,48,0.4)] p-6">
          <div className="w-[420px] max-w-full rounded-md border-t-2 border-t-[#A23A32] bg-white p-8 shadow-[0_24px_60px_rgba(28,34,48,0.3)]">
            <h2 className="m-0 font-serif text-2xl font-semibold">Silmek istediğinize emin misiniz?</h2>
            <p className="m-0 mt-3 text-sm leading-relaxed text-muted">
              <strong>{deleteTargetItem?.listTitle}</strong> kalıcı olarak silinecek. Bu işlem geri
              alınamaz.
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
