"use client";

import { useState } from "react";

/** Mevcut sayfa URL'ini panoya kopyalar, kısa süre onay metni gösterir. */
export function CopyLinkButton({
  label,
  copiedLabel,
}: {
  label: string;
  copiedLabel: string;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(window.location.href).catch(() => {});
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }}
      className="cursor-pointer rounded border border-line bg-surface px-3.5 py-2 font-sans text-[13px] font-semibold text-ink transition-colors hover:border-gold hover:text-gold"
    >
      {copied ? copiedLabel : label}
    </button>
  );
}
