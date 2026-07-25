"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveHomeHero, type HomeHeroInput } from "./actions";
import { AdminToast } from "@/components/admin/AdminToast";

const inputClass =
  "h-11 rounded border border-line bg-surface px-3.5 text-[14px] text-ink outline-none focus:border-gold";
const textareaClass =
  "rounded border border-line bg-surface px-3.5 py-3 text-[14px] leading-relaxed text-ink outline-none focus:border-gold resize-y";

export function HeroBrowser({ hero }: { hero: HomeHeroInput }) {
  const router = useRouter();
  const [form, setForm] = useState(hero);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  function showToast(message: string) {
    setToast(message);
    setTimeout(() => setToast((current) => (current === message ? null : current)), 2500);
  }

  function setField<K extends keyof HomeHeroInput>(key: K, value: HomeHeroInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setDirty(true);
  }

  async function handleSave() {
    setSaving(true);
    const result = await saveHomeHero(form);
    setSaving(false);
    if (!result.ok) {
      showToast(result.error);
      return;
    }
    setDirty(false);
    showToast("Kaydedildi");
    router.refresh();
  }

  function handleDiscard() {
    setForm(hero);
    setDirty(false);
    showToast("Değişiklikler geri alındı");
  }

  return (
    <div className="flex flex-1 flex-col gap-5 p-8">
      <div className="max-w-[720px] rounded-md border border-line bg-surface p-6 shadow-[0_1px_2px_rgba(28,34,48,0.05)]">
        <span className="font-mono text-[10px] tracking-[2px] text-gold">DÜZENLE</span>
        <h2 className="m-0 mb-[18px] mt-1.5 text-[17px] font-bold">Ana sayfa hero bölümü</h2>
        <p className="m-0 mb-5 text-[12.5px] leading-relaxed text-muted">
          Bu içerik dile göre değişmez; TR ve EN sürümlerde aynı görünür.
        </p>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold">Başlık</label>
            <textarea
              value={form.headline}
              onChange={(e) => setField("headline", e.target.value)}
              rows={2}
              className={textareaClass}
            />
            <p className="m-0 text-[11.5px] leading-relaxed text-muted">
              İki satırlık başlık için ikinci satırı yeni satıra yazın (örn. &quot;Dik duruş,&quot; / &quot;dürüst hukuk.&quot;).
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold">Alt metin</label>
            <textarea
              value={form.subtext}
              onChange={(e) => setField("subtext", e.target.value)}
              rows={3}
              className={textareaClass}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold">Kapanış CTA başlığı</label>
            <input
              type="text"
              value={form.closingCtaTitle}
              onChange={(e) => setField("closingCtaTitle", e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold">Kapanış CTA metni</label>
            <textarea
              value={form.closingCtaText}
              onChange={(e) => setField("closingCtaText", e.target.value)}
              rows={2}
              className={textareaClass}
            />
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 flex max-w-[720px] items-center justify-between gap-4 rounded-md border border-line bg-surface px-6 py-3.5 shadow-[0_-2px_12px_rgba(28,34,48,0.06)]">
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
            disabled={!dirty || saving}
            className="rounded bg-ink px-6 py-[11px] text-[13.5px] font-semibold text-cream transition-colors hover:bg-gold disabled:opacity-50"
          >
            {saving ? "Kaydediliyor…" : "Kaydet"}
          </button>
        </div>
      </div>

      <AdminToast message={toast} aboveSaveBar={true} />
    </div>
  );
}
