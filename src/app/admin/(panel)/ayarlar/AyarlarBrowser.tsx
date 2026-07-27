"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { saveGeneralSettings } from "./actions";
import type { SiteSettingsData } from "@/lib/site-settings";
import { AdminToast } from "@/components/admin/AdminToast";

type AuditRow = {
  id: string;
  time: string;
  who: string;
  action: string;
  module: string;
  detail: string;
  ip: string;
  location: string;
  createdAt: string;
};

const TABS = ["Genel", "İşlem Kayıtları"] as const;
const inputClass =
  "h-[42px] rounded border border-line bg-surface px-3.5 text-[13px] text-ink outline-none focus:border-gold";

export function AyarlarBrowser({
  settings,
  auditLog,
  mailConfigured,
}: {
  settings: SiteSettingsData;
  auditLog: AuditRow[];
  /** RESEND_API_KEY tanımlı mı — bildirim e-postaları buna bağlı. */
  mailConfigured: boolean;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Genel");
  const [toast, setToast] = useState<string | null>(null);

  const [form, setForm] = useState(settings);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newEmail, setNewEmail] = useState("");

  const [moduleFilter, setModuleFilter] = useState("Tümü");
  const [rangeFilter, setRangeFilter] = useState<"7" | "30" | "all">("7");

  function showToast(message: string) {
    setToast(message);
    setTimeout(() => setToast((current) => (current === message ? null : current)), 2500);
  }

  function setField<K extends keyof SiteSettingsData>(key: K, value: SiteSettingsData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setDirty(true);
  }

  async function handleSave() {
    setSaving(true);
    const result = await saveGeneralSettings(form);
    setSaving(false);
    if (!result.ok) {
      showToast(result.error);
      return;
    }
    setDirty(false);
    showToast("Site ayarları kaydedildi");
    router.refresh();
  }

  function handleDiscard() {
    setForm(settings);
    setDirty(false);
    showToast("Değişiklikler geri alındı");
  }

  const modules = useMemo(
    () => ["Tümü", ...Array.from(new Set(auditLog.map((r) => r.module)))],
    [auditLog],
  );

  // Date.now() render sırasında doğrudan çağrılamıyor (react-hooks/purity) — mount anında
  // bir kez yakalanır; sayfa açıkken saniyelik hassasiyet gerekmiyor.
  const [now] = useState(() => Date.now());
  const rangeMs = rangeFilter === "7" ? 7 * 86400000 : rangeFilter === "30" ? 30 * 86400000 : Infinity;
  const filteredAudit = auditLog.filter((row) => {
    if (moduleFilter !== "Tümü" && row.module !== moduleFilter) return false;
    return now - new Date(row.createdAt).getTime() <= rangeMs;
  });

  return (
    <div className="flex flex-1 flex-col gap-5 px-8 py-6">
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => {
          const active = t === tab;
          return (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className="rounded-full border px-[18px] py-2.5 text-[13px] font-semibold transition-colors"
              style={{
                borderColor: active ? "#1C2230" : "#E4DFD5",
                background: active ? "#1C2230" : "#FFFFFF",
                color: active ? "#F6F3EC" : "#1C2230",
              }}
            >
              {t}
            </button>
          );
        })}
      </div>

      {tab === "Genel" && (
        <>
          <div className="grid max-w-[1000px] grid-cols-1 items-start gap-5 lg:grid-cols-2">
            <div className="rounded-md border border-line bg-surface p-6 shadow-[0_1px_2px_rgba(28,34,48,0.05)]">
              <h2 className="m-0 mb-4 text-sm font-bold">İletişim bilgileri</h2>
              <div className="flex flex-col gap-3.5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12.5px] font-semibold">Telefon</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setField("phone", e.target.value)}
                    className={`${inputClass} font-mono`}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12.5px] font-semibold">E-posta</label>
                  <input
                    type="text"
                    value={form.email}
                    onChange={(e) => setField("email", e.target.value)}
                    className={`${inputClass} font-mono`}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12.5px] font-semibold">Adres</label>
                  <textarea
                    value={form.address}
                    onChange={(e) => setField("address", e.target.value)}
                    rows={2}
                    className="rounded border border-line bg-surface px-3.5 py-2.5 text-[13.5px] leading-relaxed outline-none focus:border-gold"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12.5px] font-semibold">Çalışma saati etiketi</label>
                  <input
                    type="text"
                    value={form.hoursLabel}
                    onChange={(e) => setField("hoursLabel", e.target.value)}
                    className={`${inputClass} font-mono`}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-5">
              <div className="rounded-md border border-line bg-surface p-6 shadow-[0_1px_2px_rgba(28,34,48,0.05)]">
                <h2 className="m-0 mb-3.5 text-sm font-bold">Bildirimler</h2>
                <label className="mb-3.5 flex cursor-pointer items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={form.notifySound}
                    onChange={(e) => setField("notifySound", e.target.checked)}
                    className="h-4 w-4 cursor-pointer accent-gold"
                  />
                  <span className="text-[13.5px]">Yeni talep geldiğinde ses çal</span>
                </label>
                <span className="mb-2 block text-[12.5px] font-semibold">Bildirim e-posta adresleri</span>
                <div className="flex flex-col gap-1.5">
                  {form.notificationEmails.map((addr, i) => (
                    <div
                      key={`${addr}-${i}`}
                      className="flex items-center gap-2 rounded border border-cream px-3 py-2"
                    >
                      <span className="flex-1 truncate font-mono text-xs">{addr}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setField(
                            "notificationEmails",
                            form.notificationEmails.filter((_, j) => j !== i),
                          )
                        }
                        className="text-muted transition-colors hover:text-[#A23A32]"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <div className="mt-1 flex gap-2">
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="yeni@yakahukuk.com"
                      className={`${inputClass} flex-1 font-mono text-xs`}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!newEmail.trim()) return;
                        setField("notificationEmails", [...form.notificationEmails, newEmail.trim()]);
                        setNewEmail("");
                      }}
                      className="rounded border border-dashed border-gold px-3 text-xs font-semibold text-gold"
                    >
                      + Ekle
                    </button>
                  </div>
                  <p className="m-0 mt-1.5 text-[11.5px] leading-relaxed text-muted">
                    Yeni randevu talebi ve iletişim mesajı geldiğinde bu adreslere e-posta gönderilir.
                  </p>
                  {!mailConfigured && (
                    <p
                      className="m-0 mt-2 rounded border px-3 py-2 text-[11.5px] leading-relaxed"
                      style={{ borderColor: "#9C7C4A", background: "rgba(156,124,74,.07)" }}
                    >
                      <strong>E-posta gönderimi yapılandırılmamış.</strong> Bildirimler şu an
                      yalnızca sunucu günlüğüne yazılıyor; talepler yine de panele düşüyor.
                      Etkinleştirmek için Resend hesabı açıp <code>RESEND_API_KEY</code> ve{" "}
                      <code>MAIL_FROM</code> değişkenlerini ortama ekleyin.
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-md border border-line bg-surface p-6 shadow-[0_1px_2px_rgba(28,34,48,0.05)]">
                <h2 className="m-0 mb-3.5 text-sm font-bold">Site meta / SEO</h2>
                <div className="flex flex-col gap-3">
                  <input
                    type="text"
                    value={form.seoTitle}
                    onChange={(e) => setField("seoTitle", e.target.value)}
                    className={inputClass}
                  />
                  <textarea
                    value={form.seoDescription}
                    onChange={(e) => setField("seoDescription", e.target.value)}
                    rows={2}
                    className="rounded border border-line bg-surface px-3.5 py-2.5 text-[13.5px] leading-relaxed outline-none focus:border-gold"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 flex max-w-[1000px] items-center justify-between gap-4 rounded-md border border-line bg-surface px-6 py-3.5 shadow-[0_-2px_12px_rgba(28,34,48,0.06)]">
            <span className="text-[13px] text-muted">
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
        </>
      )}

      {tab === "İşlem Kayıtları" && (
        <div className="max-w-[1000px] overflow-x-auto rounded-md border border-line bg-surface shadow-[0_1px_2px_rgba(28,34,48,0.05)]">
          <div className="flex flex-wrap items-center gap-2.5 border-b border-line px-6 py-4">
            <h2 className="m-0 text-sm font-bold">İşlem kayıtları</h2>
            <span className="rounded-full border border-line px-2.5 py-[3px] font-mono text-[9px] tracking-[1px] text-muted">
              SALT OKUNUR
            </span>
            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              className="ml-auto h-9 cursor-pointer rounded border border-line bg-surface px-2.5 text-[12.5px] outline-none"
            >
              {modules.map((m) => (
                <option key={m} value={m}>
                  {m === "Tümü" ? "Tüm modüller" : m}
                </option>
              ))}
            </select>
            <select
              value={rangeFilter}
              onChange={(e) => setRangeFilter(e.target.value as typeof rangeFilter)}
              className="h-9 cursor-pointer rounded border border-line bg-surface px-2.5 text-[12.5px] outline-none"
            >
              <option value="7">Son 7 gün</option>
              <option value="30">Son 30 gün</option>
              <option value="all">Tümü</option>
            </select>
          </div>
          <div className="grid min-w-[900px] grid-cols-[140px_120px_1fr_110px_120px_130px] gap-3 border-b border-line px-6 py-2.5 font-mono text-[9.5px] tracking-[1.5px] text-muted">
            <span>TARİH-SAAT</span>
            <span>KULLANICI</span>
            <span>EYLEM</span>
            <span>MODÜL</span>
            <span>KONUM</span>
            <span>IP</span>
          </div>
          {filteredAudit.length === 0 && (
            <p className="px-6 py-8 text-center text-sm text-muted">Kayıt bulunamadı.</p>
          )}
          {filteredAudit.map((row) => (
            <div
              key={row.id}
              className="grid min-w-[900px] grid-cols-[140px_120px_1fr_110px_120px_130px] items-baseline gap-3 border-b border-cream px-6 py-2.5"
            >
              <span className="font-mono text-[11px] text-muted">{row.time}</span>
              <span className="text-[12.5px] font-semibold">{row.who}</span>
              <span className="flex flex-col gap-0.5 text-[12.5px] text-muted">
                {row.action}
                {row.detail && (
                  <span className="font-mono text-[10px] text-line">{row.detail}</span>
                )}
              </span>
              <span className="font-mono text-[9.5px] tracking-[1px] text-gold">{row.module}</span>
              <span className="font-mono text-[10.5px] text-muted">{row.location}</span>
              <span className="font-mono text-[10.5px] text-muted">{row.ip}</span>
            </div>
          ))}
        </div>
      )}

      <AdminToast message={toast} />
    </div>
  );
}
