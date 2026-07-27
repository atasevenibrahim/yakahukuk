"use client";

import { useState } from "react";

/**
 * Paylaşım düğmeleri — WhatsApp, X, LinkedIn ve bağlantıyı kopyala.
 *
 * Tamamı düz bağlantı: sayfaya üçüncü taraf betiği eklenmiyor, hiçbir izleme çerezi
 * bırakılmıyor. (Resmî paylaşım widget'ları ziyaretçiyi izler; hukuk sitesinde bunun
 * KVKK maliyeti getirisinden büyük.)
 *
 * Cihaz destekliyorsa önce yerel paylaşım sayfası açılır (`navigator.share`) — mobilde
 * tek dokunuşla WhatsApp/Telegram/e-posta seçilebiliyor.
 */
export function ShareButtons({
  title,
  label,
  copyLabel,
  copiedLabel,
}: {
  title: string;
  /** "PAYLAŞ" */
  label: string;
  copyLabel: string;
  copiedLabel: string;
}) {
  const [copied, setCopied] = useState(false);

  function currentUrl(): string {
    return typeof window === "undefined" ? "" : window.location.href;
  }

  function open(target: "whatsapp" | "x" | "linkedin") {
    const url = encodeURIComponent(currentUrl());
    const text = encodeURIComponent(title);
    const href =
      target === "whatsapp"
        ? `https://wa.me/?text=${text}%20${url}`
        : target === "x"
          ? `https://twitter.com/intent/tweet?text=${text}&url=${url}`
          : `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
    window.open(href, "_blank", "noopener,noreferrer");
  }

  async function nativeShare() {
    if (!navigator.share) return false;
    try {
      await navigator.share({ title, url: currentUrl() });
      return true;
    } catch {
      // Kullanıcı vazgeçti — sessizce düş.
      return true;
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <span className="font-mono text-[11.5px] tracking-[2px] text-muted">{label}</span>

      <ShareButton
        title="WhatsApp'ta paylaş"
        onClick={async () => {
          if (!(await nativeShare())) open("whatsapp");
        }}
      >
        WhatsApp
      </ShareButton>
      <ShareButton title="X'te paylaş" onClick={() => open("x")}>
        X
      </ShareButton>
      <ShareButton title="LinkedIn'de paylaş" onClick={() => open("linkedin")}>
        LinkedIn
      </ShareButton>
      <ShareButton
        title="Bağlantıyı kopyala"
        onClick={() => {
          navigator.clipboard?.writeText(currentUrl()).catch(() => {});
          setCopied(true);
          setTimeout(() => setCopied(false), 2500);
        }}
      >
        {copied ? copiedLabel : copyLabel}
      </ShareButton>
    </div>
  );
}

function ShareButton({
  children,
  onClick,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="cursor-pointer rounded border border-line bg-surface px-3.5 py-2 font-sans text-[13px] font-semibold text-ink transition-colors hover:border-gold hover:text-gold"
    >
      {children}
    </button>
  );
}
