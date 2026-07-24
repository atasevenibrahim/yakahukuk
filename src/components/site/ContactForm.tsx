"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { AppIcon } from "@/components/ui/AppIcon";
import { cn } from "@/lib/cn";
import { submitContactForm, type ContactFormInput } from "@/app/[locale]/iletisim/actions";

const emptyForm: ContactFormInput = {
  ad: "",
  eposta: "",
  telefon: "",
  konu: "",
  mesaj: "",
  kvkk: false,
};

const inputClass =
  "h-12 w-full rounded border bg-surface px-4 font-sans text-[15px] text-ink outline-none focus:border-gold focus:shadow-[0_2px_8px_rgba(156,124,74,0.12)] box-border";

export function ContactForm({
  subjectOptions,
  phone,
  phoneHref,
}: {
  subjectOptions: string[];
  phone: string;
  phoneHref: string;
}) {
  const t = useTranslations("contactPage");
  const [form, setForm] = useState<ContactFormInput>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof ContactFormInput, boolean>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(false);
  const [succeeded, setSucceeded] = useState(false);

  function setField<K extends keyof ContactFormInput>(key: K, value: ContactFormInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: false }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(false);
    const result = await submitContactForm(form);
    setSubmitting(false);
    if (!result.ok) {
      setErrors(result.errors);
      if (Object.keys(result.errors).length === 0) setSubmitError(true);
      return;
    }
    setSucceeded(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (succeeded) {
    return (
      <div className="px-4 py-12 text-center">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-full border-[1.5px] border-[#3F7A5B] text-[#3F7A5B]">
          <AppIcon name="check" size={24} strokeWidth={2} />
        </span>
        <h2 className="mt-[22px] font-serif text-[32px] font-medium">
          {t("successTitle")}
        </h2>
        <p className="mt-3 text-[15.5px] leading-relaxed text-muted">
          {t("successText")}
          <br />
          {t("successUrgent")}{" "}
          <a href={phoneHref} className="border-b border-gold text-gold">
            {phone}
          </a>
        </p>
        <button
          type="button"
          onClick={() => {
            setForm(emptyForm);
            setErrors({});
            setSucceeded(false);
          }}
          className="mt-[26px] cursor-pointer rounded border border-gold bg-surface px-[22px] py-2.5 font-sans text-sm font-semibold text-ink transition-colors hover:bg-cream"
        >
          {t("newMessage")}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="mb-7 font-serif text-[30px] font-medium">{t("formTitle")}</h2>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-ink">
            {t("nameLabel")} <span className="text-gold">*</span>
          </label>
          <input
            type="text"
            value={form.ad}
            onChange={(e) => setField("ad", e.target.value)}
            placeholder={t("namePlaceholder")}
            className={cn(inputClass, errors.ad ? "border-[#A23A32]" : "border-line")}
          />
          {errors.ad && <span className="text-[12.5px] text-[#A23A32]">{t("nameError")}</span>}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-ink">
            {t("emailLabel")} <span className="text-gold">*</span>
          </label>
          <input
            type="email"
            value={form.eposta}
            onChange={(e) => setField("eposta", e.target.value)}
            placeholder={t("emailPlaceholder")}
            className={cn(inputClass, errors.eposta ? "border-[#A23A32]" : "border-line")}
          />
          {errors.eposta && (
            <span className="text-[12.5px] text-[#A23A32]">{t("emailError")}</span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-ink">{t("phoneLabel")}</label>
          <input
            type="tel"
            value={form.telefon}
            onChange={(e) => setField("telefon", e.target.value)}
            placeholder={t("phonePlaceholder")}
            className={cn(inputClass, "border-line")}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-ink">
            {t("subjectLabel")} <span className="text-gold">*</span>
          </label>
          <select
            value={form.konu}
            onChange={(e) => setField("konu", e.target.value)}
            className={cn(
              inputClass,
              "cursor-pointer px-3",
              errors.konu ? "border-[#A23A32]" : "border-line",
            )}
          >
            <option value="">{t("subjectPlaceholder")}</option>
            {subjectOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
            <option value={t("subjectOther")}>{t("subjectOther")}</option>
          </select>
          {errors.konu && (
            <span className="text-[12.5px] text-[#A23A32]">{t("subjectError")}</span>
          )}
        </div>

        <div className="flex flex-col gap-2 sm:col-span-2">
          <label className="text-sm font-semibold text-ink">
            {t("messageLabel")} <span className="text-gold">*</span>
          </label>
          <textarea
            value={form.mesaj}
            onChange={(e) => setField("mesaj", e.target.value)}
            placeholder={t("messagePlaceholder")}
            rows={5}
            className={cn(
              "box-border resize-y rounded border bg-surface px-4 py-3.5 font-sans text-[15px] leading-relaxed text-ink outline-none focus:border-gold focus:shadow-[0_2px_8px_rgba(156,124,74,0.12)]",
              errors.mesaj ? "border-[#A23A32]" : "border-line",
            )}
          />
          {errors.mesaj && (
            <span className="text-[12.5px] text-[#A23A32]">{t("messageError")}</span>
          )}
        </div>

        <div className="flex h-[76px] items-center justify-center rounded border border-dashed border-line bg-[#FAF8F3] sm:col-span-2">
          <span className="font-mono text-[11.5px] tracking-[1px] text-muted">
            {t("captchaPlaceholder")}
          </span>
        </div>

        <div className="flex items-start gap-3 sm:col-span-2">
          <input
            type="checkbox"
            checked={form.kvkk}
            onChange={(e) => setField("kvkk", e.target.checked)}
            className="mt-0.5 h-[18px] w-[18px] flex-none cursor-pointer accent-gold"
          />
          <span className="text-[13.5px] leading-[1.55] text-muted">
            {t("kvkkText")}{" "}
            <Link
              href={{ pathname: "/yasal", query: { tab: "aydinlatma" } }}
              target="_blank"
              className="border-b border-gold text-gold"
            >
              {t("kvkkLink")}
            </Link>{" "}
            {t("kvkkTextEnd")} <span className="text-gold">*</span>
          </span>
        </div>
        {errors.kvkk && (
          <span className="-mt-2.5 text-[12.5px] text-[#A23A32] sm:col-span-2">
            {t("kvkkError")}
          </span>
        )}

        {submitError && (
          <span className="text-[12.5px] text-[#A23A32] sm:col-span-2">
            {t("submitError")}
          </span>
        )}

        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={submitting}
            className="cursor-pointer rounded bg-ink px-8 py-[15px] font-sans text-base font-semibold text-cream transition-colors hover:bg-gold disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? t("submitting") : t("submit")}
          </button>
        </div>
      </div>
    </form>
  );
}
