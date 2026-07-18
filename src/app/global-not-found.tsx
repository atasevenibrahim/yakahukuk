import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { cormorant, manrope, plexMono } from "./fonts";
import logo from "../../public/yaka-logo.png";
import "./globals.css";

export const metadata: Metadata = {
  title: "404 · Sayfa bulunamadı — YAKA Hukuk & Danışmanlık",
  description: "Aradığınız sayfa bulunamadı.",
};

/**
 * Kök layout `[locale]` gibi üst düzey bir dinamik segmentte tanımlı olduğu için
 * (ayrı bir app/layout.tsx yok), next-intl bağlamının dışında, tamamen bağımsız
 * bir HTML belgesi olarak render edilir (Next.js'in global-not-found kuralı gereği).
 * Varsayılan dil (tr) sabit kullanılır.
 */
export default function GlobalNotFound() {
  return (
    <html
      lang="tr"
      className={`${manrope.variable} ${cormorant.variable} ${plexMono.variable}`}
    >
      <body className="flex min-h-screen flex-col bg-cream text-ink antialiased">
        <div className="border-b border-line bg-cream/95">
          <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-5 px-6 py-3.5">
            <Link href="/tr" className="flex flex-none items-center gap-3">
              <Image
                src={logo}
                alt="YAKA logo"
                width={42}
                height={42}
                className="object-contain"
                priority
              />
              <span className="flex flex-col gap-px">
                <span className="font-serif text-[21px] font-semibold leading-none tracking-[2px] text-ink">
                  YAKA
                </span>
                <span className="font-mono text-[8.5px] tracking-[2.6px] text-muted">
                  HUKUK &amp; DANIŞMANLIK
                </span>
              </span>
            </Link>
            <Link
              href="/tr/randevu-al"
              className="rounded bg-ink px-6 py-3 text-[15px] font-semibold text-cream transition-colors hover:bg-gold hover:text-white"
            >
              Randevu Al
            </Link>
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-[560px] flex-1 flex-col items-center justify-center px-6 py-16 text-center">
          <div className="font-mono text-[13px] tracking-[4px] text-gold">HATA 404</div>
          <div className="mt-3 font-serif text-[96px] font-medium leading-none text-ink sm:text-[130px] md:text-[150px]">
            4<span className="text-gold">0</span>4
          </div>
          <span className="relative mt-6 block h-px w-11 bg-gold">
            <span
              aria-hidden
              className="absolute -top-1 right-[11px] block h-px w-2.5 rotate-[-45deg] bg-gold"
            />
          </span>
          <h1 className="mt-6 text-balance font-serif text-[28px] font-medium leading-tight sm:text-[36px]">
            Aradığınız sayfa dosyalarımızda yok.
          </h1>
          <p className="text-pretty mt-4 text-base leading-relaxed text-muted">
            Bağlantı taşınmış ya da hiç var olmamış olabilir. Ama merak etmeyin —
            kaybolan sayfaları da buluruz.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3.5">
            <Link
              href="/tr"
              className="rounded bg-ink px-7 py-3.5 text-base font-semibold text-cream transition-colors hover:bg-gold hover:text-white"
            >
              Ana sayfaya dön
            </Link>
            <Link
              href="/tr/iletisim"
              className="rounded border border-gold px-7 py-3.5 text-base font-semibold text-ink transition-colors hover:bg-gold hover:text-white"
            >
              Bize ulaşın
            </Link>
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-5 text-sm">
            <Link
              href="/tr/calisma-alanlari"
              className="border-b border-line pb-0.5 text-muted hover:border-gold hover:text-gold"
            >
              Çalışma Alanları
            </Link>
            <Link
              href="/tr/makaleler"
              className="border-b border-line pb-0.5 text-muted hover:border-gold hover:text-gold"
            >
              Makaleler
            </Link>
            <Link
              href="/tr/sss"
              className="border-b border-line pb-0.5 text-muted hover:border-gold hover:text-gold"
            >
              SSS
            </Link>
          </div>
        </div>

        <div className="bg-ink-deep">
          <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-4 px-8 py-7">
            <span className="text-[12.5px] text-on-dark-muted">
              © 2026 YAKA Hukuk &amp; Danışmanlık. Tüm hakları saklıdır.
            </span>
            <span className="font-mono text-[11.5px] tracking-[1.5px] text-gold">
              <a href="tel:+903122158085" className="text-gold">
                0312 215 80 85
              </a>{" "}
              · 7/24
            </span>
          </div>
        </div>
      </body>
    </html>
  );
}
