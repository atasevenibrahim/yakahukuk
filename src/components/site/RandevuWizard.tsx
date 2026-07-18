"use client";

import { useState, type FormEvent } from "react";
import { Link } from "@/i18n/navigation";
import { AppIcon } from "@/components/ui/AppIcon";
import { site } from "@/content/site";
import { cn } from "@/lib/cn";
import {
  submitAppointment,
  type AppointmentFormInput,
} from "@/app/[locale]/randevu-al/actions";

export type DayOption = {
  dateKey: string;
  dayLabel: string; // "PZT"
  dateLabel: string; // "20 TEM"
  allSlots: string[]; // o gün için tam slot ızgarası (doluluktan bağımsız)
  slots: string[]; // gerçekten seçilebilir olanlar
};

const inputClass =
  "h-12 w-full rounded border bg-surface px-4 font-sans text-[15px] text-ink outline-none focus:border-gold focus:shadow-[0_2px_8px_rgba(156,124,74,0.12)] box-border";

const steps = [
  { no: "1", label: "Konu" },
  { no: "2", label: "Zaman" },
  { no: "3", label: "Bilgiler" },
];

export function RandevuWizard({
  practiceAreaTitles,
  days,
}: {
  practiceAreaTitles: string[];
  days: DayOption[];
}) {
  const [step, setStep] = useState(1);
  const [konu, setKonu] = useState("");
  const [aciklama, setAciklama] = useState("");
  const [dayIndex, setDayIndex] = useState(-1);
  const [saat, setSaat] = useState("");
  const [form, setForm] = useState({ ad: "", telefon: "", eposta: "", kvkk: false });
  const [errors, setErrors] = useState<
    Partial<Record<keyof AppointmentFormInput, boolean>>
  >({});
  const [slotTaken, setSlotTaken] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const konular = [...practiceAreaTitles, "Emin değilim"];
  const selectedDay = dayIndex >= 0 ? days[dayIndex] : undefined;

  function setField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: false }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selectedDay) return;
    setSubmitting(true);
    setSlotTaken(false);
    const result = await submitAppointment({
      konu,
      aciklama,
      dateKey: selectedDay.dateKey,
      saat,
      ad: form.ad,
      telefon: form.telefon,
      eposta: form.eposta,
      kvkk: form.kvkk,
    });
    setSubmitting(false);
    if (!result.ok) {
      if (result.slotTaken) {
        setSlotTaken(true);
        setStep(2);
        setSaat("");
      } else {
        setErrors(result.errors);
      }
      return;
    }
    setStep(4);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div>
      {/* Adım göstergesi */}
      {step < 4 && (
        <div className="mt-12 flex flex-wrap items-center justify-center">
          {steps.map((s, i) => {
            const n = i + 1;
            const active = step === n || (step === 4 && n === 3);
            const passed = step > n;
            return (
              <div key={s.no} className="flex items-center">
                <div className="flex items-center gap-2.5">
                  <span
                    className={cn(
                      "flex h-[34px] w-[34px] items-center justify-center rounded-full border-[1.5px] font-mono text-[13px] transition-colors",
                      passed
                        ? "border-gold bg-gold text-white"
                        : active
                          ? "border-gold bg-surface text-gold"
                          : "border-line bg-transparent text-muted",
                    )}
                  >
                    {passed ? <AppIcon name="check" size={14} /> : s.no}
                  </span>
                  <span
                    className={cn(
                      "text-[13.5px] font-semibold",
                      active || passed ? "text-ink" : "text-muted",
                    )}
                  >
                    {s.label}
                  </span>
                </div>
                {n < 3 && <span className="mx-[18px] h-px w-14 bg-line" />}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-10 rounded-md border border-line bg-surface p-8 shadow-card sm:p-10">
        {step === 1 && (
          <div>
            <h2 className="mb-2 font-serif text-[28px] font-medium">Görüşme konusu</h2>
            <p className="mb-7 text-[14.5px] text-muted">
              Dosyanız hangi alana giriyor? Emin değilseniz &quot;Emin değilim&quot; seçin.
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {konular.map((k) => {
                const selected = k === konu;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setKonu(k)}
                    className={cn(
                      "cursor-pointer rounded px-4 py-3.5 text-left font-sans text-[13.5px] font-semibold transition-colors",
                      selected
                        ? "border border-ink bg-ink text-cream"
                        : "border border-line bg-surface text-ink hover:border-gold",
                    )}
                  >
                    {k}
                  </button>
                );
              })}
            </div>
            <div className="mt-6 flex flex-col gap-2">
              <label className="text-sm font-semibold text-ink">
                Kısa açıklama <span className="font-normal text-muted">(opsiyonel)</span>
              </label>
              <textarea
                value={aciklama}
                onChange={(e) => setAciklama(e.target.value)}
                placeholder="Dosyanızı bir-iki cümleyle anlatın…"
                rows={3}
                className="box-border resize-y rounded border border-line bg-surface px-4 py-3.5 font-sans text-[15px] leading-relaxed text-ink outline-none focus:border-gold focus:shadow-[0_2px_8px_rgba(156,124,74,0.12)]"
              />
            </div>
            <div className="mt-7 flex justify-end">
              <button
                type="button"
                disabled={!konu}
                onClick={() => {
                  setStep(2);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="cursor-pointer rounded px-[30px] py-3.5 font-sans text-[15px] font-semibold text-cream transition-colors disabled:cursor-not-allowed"
                style={{ background: konu ? "#1C2230" : "#E4DFD5", color: konu ? "#F6F3EC" : "#5B6270" }}
              >
                Devam et →
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="mb-2 font-serif text-[28px] font-medium">Gün ve saat</h2>
            <p className="mb-7 text-[14.5px] text-muted">
              Önümüzdeki hafta için uygun bir zaman seçin. Görüşmeler ~45 dakikadır.
            </p>
            {slotTaken && (
              <div className="mb-5 rounded border border-[#E8C5C1] bg-[#FBF1F0] px-4 py-3">
                <p className="m-0 text-[13.5px] text-[#A23A32]">
                  Seçtiğiniz saat az önce doldu. Lütfen başka bir saat seçin.
                </p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
              {days.map((day, i) => {
                const selected = i === dayIndex;
                const hasSlots = day.slots.length > 0;
                return (
                  <button
                    key={day.dateKey}
                    type="button"
                    disabled={!hasSlots}
                    onClick={() => {
                      setDayIndex(i);
                      setSaat("");
                    }}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded border px-2 py-3.5 transition-colors",
                      !hasSlots && "cursor-not-allowed opacity-40",
                      hasSlots && !selected && "cursor-pointer border-line bg-surface hover:border-gold",
                      selected && "cursor-pointer border-ink bg-ink",
                    )}
                  >
                    <span
                      className={cn(
                        "font-mono text-[10.5px] tracking-[1.5px]",
                        selected ? "text-gold" : "text-muted",
                      )}
                    >
                      {day.dayLabel}
                    </span>
                    <span
                      className={cn(
                        "text-lg font-semibold",
                        selected ? "text-cream" : "text-ink",
                      )}
                    >
                      {day.dateLabel}
                    </span>
                  </button>
                );
              })}
            </div>

            {selectedDay && (
              <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {selectedDay.allSlots.map((t) => {
                    const dolu = !selectedDay.slots.includes(t);
                    const selected = t === saat;
                    return (
                      <button
                        key={t}
                        type="button"
                        disabled={dolu}
                        onClick={() => setSaat(t)}
                        className={cn(
                          "rounded border px-2 py-3.5 font-mono text-sm transition-colors",
                          dolu && "cursor-not-allowed border-line bg-[#EFEAE0] text-muted line-through",
                          !dolu && !selected && "cursor-pointer border-line bg-surface text-ink hover:border-gold",
                          selected && "cursor-pointer border-ink bg-ink text-cream",
                        )}
                      >
                        {t}
                      </button>
                    );
                  })}
              </div>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-5 font-mono text-[11px] text-muted">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm border border-line bg-surface" />
                UYGUN
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm border border-line bg-[#EFEAE0]" />
                DOLU
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-ink" />
                SEÇİLİ
              </span>
            </div>

            <div className="mt-7 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="cursor-pointer bg-transparent py-3.5 text-[14.5px] font-semibold text-muted transition-colors hover:text-gold"
              >
                ← Geri
              </button>
              <button
                type="button"
                disabled={!selectedDay || !saat}
                onClick={() => {
                  setStep(3);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="cursor-pointer rounded px-[30px] py-3.5 font-sans text-[15px] font-semibold transition-colors disabled:cursor-not-allowed"
                style={{
                  background: selectedDay && saat ? "#1C2230" : "#E4DFD5",
                  color: selectedDay && saat ? "#F6F3EC" : "#5B6270",
                }}
              >
                Devam et →
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <form onSubmit={handleSubmit}>
            <h2 className="mb-2 font-serif text-[28px] font-medium">Bilgileriniz</h2>
            <p className="mb-6 text-[14.5px] text-muted">
              Onay ve hatırlatmalar bu bilgilere gönderilir.
            </p>
            <div className="mb-6 flex flex-wrap items-center gap-4 rounded border border-line bg-cream px-5 py-4">
              <span className="font-mono text-[11px] tracking-[2px] text-gold">SEÇİMİNİZ</span>
              <span className="text-[14.5px] font-semibold">{konu || "—"}</span>
              <span className="text-line">·</span>
              <span className="text-[14.5px] font-semibold">
                {selectedDay ? `${selectedDay.dateLabel} · ${saat}` : "—"}
              </span>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="ml-auto cursor-pointer border-b border-gold bg-transparent text-[13px] font-semibold text-gold"
              >
                Değiştir
              </button>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-ink">
                  Ad Soyad <span className="text-gold">*</span>
                </label>
                <input
                  type="text"
                  value={form.ad}
                  onChange={(e) => setField("ad", e.target.value)}
                  placeholder="Adınız Soyadınız"
                  className={cn(inputClass, errors.ad ? "border-[#A23A32]" : "border-line")}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-ink">
                  Telefon <span className="text-gold">*</span>
                </label>
                <input
                  type="tel"
                  value={form.telefon}
                  onChange={(e) => setField("telefon", e.target.value)}
                  placeholder="05xx xxx xx xx"
                  className={cn(inputClass, errors.telefon ? "border-[#A23A32]" : "border-line")}
                />
              </div>
              <div className="flex flex-col gap-2 sm:col-span-2">
                <label className="text-sm font-semibold text-ink">
                  E-posta <span className="text-gold">*</span>
                </label>
                <input
                  type="email"
                  value={form.eposta}
                  onChange={(e) => setField("eposta", e.target.value)}
                  placeholder="ornek@eposta.com"
                  className={cn(inputClass, errors.eposta ? "border-[#A23A32]" : "border-line")}
                />
              </div>
              <div className="flex items-start gap-3 sm:col-span-2">
                <input
                  type="checkbox"
                  checked={form.kvkk}
                  onChange={(e) => setField("kvkk", e.target.checked)}
                  className="mt-0.5 h-[18px] w-[18px] flex-none cursor-pointer accent-gold"
                />
                <span
                  className={cn(
                    "text-[13.5px] leading-[1.55]",
                    errors.kvkk ? "text-[#A23A32]" : "text-muted",
                  )}
                >
                  Kişisel verilerimin{" "}
                  <Link
                    href={{ pathname: "/yasal", query: { tab: "aydinlatma" } }}
                    target="_blank"
                    className="border-b border-gold text-gold"
                  >
                    Aydınlatma Metni
                  </Link>{" "}
                  kapsamında işlenmesini kabul ediyorum. <span className="text-gold">*</span>
                </span>
              </div>
            </div>
            <div className="mt-7 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="cursor-pointer bg-transparent py-3.5 text-[14.5px] font-semibold text-muted transition-colors hover:text-gold"
              >
                ← Geri
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="cursor-pointer rounded bg-ink px-[30px] py-3.5 font-sans text-[15px] font-semibold text-cream transition-colors hover:bg-gold disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? "Gönderiliyor…" : "Randevuyu Onayla"}
              </button>
            </div>
          </form>
        )}

        {step === 4 && (
          <div className="px-4 py-8 text-center">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-full border-[1.5px] border-[#3F7A5B] text-[#3F7A5B]">
              <AppIcon name="check" size={24} strokeWidth={2} />
            </span>
            <h2 className="mt-[22px] font-serif text-[34px] font-medium">
              Randevunuz oluşturuldu.
            </h2>
            <p className="mt-3 text-[15.5px] leading-relaxed text-muted">
              Talebiniz alındı; ekibimiz onay için sizinle iletişime geçecek.
            </p>
            <div className="mt-6 inline-flex flex-wrap items-center justify-center gap-4 rounded border border-line bg-cream px-6 py-4">
              <span className="text-[15px] font-semibold">{konu || "—"}</span>
              <span className="text-line">·</span>
              <span className="font-mono text-sm text-gold">
                {selectedDay ? `${selectedDay.dateLabel} · ${saat}` : "—"}
              </span>
            </div>
            <p className="mt-6 text-[13.5px] text-muted">
              Değişiklik için:{" "}
              <a href={site.phoneHref} className="border-b border-gold text-gold">
                {site.phone}
              </a>
            </p>
            <div className="mt-6">
              <Link
                href="/"
                className="inline-block rounded border border-gold px-[26px] py-3 text-[14.5px] font-semibold text-ink transition-colors hover:bg-gold hover:text-white"
              >
                Ana sayfaya dön
              </Link>
            </div>
          </div>
        )}
      </div>

      <div className="mt-7 flex flex-wrap items-center justify-center gap-6 font-mono text-xs text-muted">
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full border-[1.5px] border-gold" />
          GİZLİLİK GÜVENCESİ
        </span>
        <span className="text-line">·</span>
        <span>{site.location}</span>
        <span className="text-line">·</span>
        <span>
          <a href={site.phoneHref} className="text-gold">
            {site.phone}
          </a>{" "}
          — 7/24
        </span>
      </div>
    </div>
  );
}
