"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { subscribeNewsletter } from "@/lib/newsletter/actions";
import { NEWSLETTER_CONSENT_TEXT } from "@/lib/newsletter/consent";

/**
 * Bülten kayıt formu.
 *
 * Onay kutusu ÖN İŞARETLİ DEĞİL ve rıza metni kutunun yanında açıkça yazıyor — 6563 sayılı
 * Kanun açık rıza istiyor, peşinen işaretli kutu onay sayılmıyor.
 */
export function NewsletterForm({
  title,
  text,
  placeholder,
  buttonLabel,
  successText,
  alreadyText,
  privacyLabel,
}: {
  title: string;
  text: string;
  placeholder: string;
  buttonLabel: string;
  successText: string;
  alreadyText: string;
  privacyLabel: string;
}) {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<"idle" | "sending" | "done" | "already">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setState("sending");
    const result = await subscribeNewsletter({ eposta: email, onay: consent });
    if (!result.ok) {
      setError(result.error);
      setState("idle");
      return;
    }
    setState(result.alreadySubscribed ? "already" : "done");
    setEmail("");
    setConsent(false);
  }

  if (state === "done" || state === "already") {
    return (
      <div className="rounded-md border border-line bg-surface px-6 py-7">
        <p className="m-0 text-[15px] font-semibold text-ink">
          {state === "already" ? alreadyText : successText}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-md border border-line bg-surface px-6 py-7">
      <h2 className="m-0 font-serif text-[24px] font-medium">{title}</h2>
      <p className="m-0 mt-2 text-[14.5px] leading-relaxed text-muted">{text}</p>

      <div className="mt-5 flex flex-wrap gap-2.5">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={placeholder}
          className="h-11 min-w-[220px] flex-1 rounded border border-line bg-white px-3.5 text-[14px] text-ink outline-none focus:border-gold"
        />
        <button
          type="submit"
          disabled={state === "sending"}
          className="cursor-pointer rounded bg-ink px-6 py-[11px] text-[14px] font-semibold text-cream transition-colors hover:bg-gold disabled:opacity-50"
        >
          {state === "sending" ? "…" : buttonLabel}
        </button>
      </div>

      <label className="mt-4 flex cursor-pointer items-start gap-2.5">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 h-4 w-4 flex-none cursor-pointer accent-gold"
        />
        <span className="text-[12.5px] leading-relaxed text-muted">
          {NEWSLETTER_CONSENT_TEXT}{" "}
          <Link href="/yasal" className="text-gold underline underline-offset-2">
            {privacyLabel}
          </Link>
        </span>
      </label>

      {error && (
        <p
          className="m-0 mt-3 rounded border px-3 py-2 text-[12.5px]"
          style={{ borderColor: "#E8C5C1", background: "#FBF1F0", color: "#A23A32" }}
        >
          {error}
        </p>
      )}
    </form>
  );
}
