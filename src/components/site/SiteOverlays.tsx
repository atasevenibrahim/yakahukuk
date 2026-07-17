"use client";

import { useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { site } from "@/content/site";

const CONSENT_KEY = "yaka-cookie-consent";

// Basit dış-durum deposu → useSyncExternalStore ile hydration-güvenli okuma.
const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
  listeners.add(callback);
  window.addEventListener("storage", callback);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", callback);
  };
}

function isDecided() {
  try {
    return localStorage.getItem(CONSENT_KEY) != null;
  } catch {
    return true;
  }
}

function decide(value: "accepted" | "rejected") {
  try {
    localStorage.setItem(CONSENT_KEY, value);
  } catch {
    /* localStorage kapalıysa sessiz geç */
  }
  for (const listener of listeners) listener();
}

/** WhatsApp yüzen butonu + çerez rıza banner'ı (konumları koordineli). */
export function SiteOverlays() {
  const t = useTranslations("cookie");
  const tAria = useTranslations("aria");

  // Sunucuda (ve ilk render'da) "karar verilmiş" varsay → banner gizli, FAB altta.
  const decided = useSyncExternalStore(subscribe, isDecided, () => true);
  const bannerVisible = !decided;

  return (
    <>
      <a
        href={site.whatsappHref}
        aria-label={tAria("whatsapp")}
        className="fixed right-6 z-[95] flex h-[54px] w-[54px] items-center justify-center rounded-full bg-ink text-cream shadow-[0_4px_16px_rgba(28,34,48,0.25)] transition-all hover:-translate-y-0.5 hover:bg-gold hover:text-white"
        style={{ bottom: bannerVisible ? 96 : 24 }}
      >
        <span className="text-[22px]" aria-hidden>
          ✆
        </span>
      </a>

      {bannerVisible && (
        <div className="fixed inset-x-0 bottom-0 z-[94] border-t border-line bg-surface shadow-[0_-6px_24px_rgba(28,34,48,0.07)]">
          <Container className="flex flex-wrap items-center gap-6 py-4">
            <p className="min-w-[280px] flex-1 text-[13.5px] leading-snug text-muted">
              {t("text")}{" "}
              <a href="#" className="border-b border-gold text-gold">
                {t("policy")}
              </a>
            </p>
            <div className="flex items-center gap-2.5">
              <a
                href="#"
                className="px-1.5 py-2.5 text-[13.5px] font-semibold text-muted transition-colors hover:text-gold"
              >
                {t("settings")}
              </a>
              <button
                type="button"
                onClick={() => decide("rejected")}
                className="cursor-pointer rounded border border-gold bg-surface px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-cream"
              >
                {t("reject")}
              </button>
              <button
                type="button"
                onClick={() => decide("accepted")}
                className="cursor-pointer rounded bg-ink px-[22px] py-[11px] text-sm font-semibold text-cream transition-colors hover:bg-gold"
              >
                {t("accept")}
              </button>
            </div>
          </Container>
        </div>
      )}
    </>
  );
}
