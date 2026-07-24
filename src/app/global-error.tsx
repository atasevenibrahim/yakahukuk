"use client";

import Image from "next/image";
import Link from "next/link";
import { cormorant, manrope, plexMono } from "./fonts";
import logo from "../../public/yaka-logo.png";
import "./globals.css";

/**
 * Kök layout'un kendisinde bir hata olursa devreye girer (`[locale]/layout.tsx` ya da
 * `admin/layout.tsx` seviyesinin üstü) — global-not-found.tsx ile aynı gerekçeyle tamamen
 * bağımsız bir HTML belgesi olarak render edilir (next-intl bağlamı yok, varsayılan dil tr).
 * Hata sınırları Client Component olmak zorunda, bu yüzden metadata export edilemez.
 */
export default function GlobalError({
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
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
            <a href="tel:+903122158085" className="font-mono text-xs tracking-[1.5px] text-gold">
              0312 215 80 85 · 7/24
            </a>
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-[560px] flex-1 flex-col items-center justify-center px-6 py-16 text-center">
          <div className="font-mono text-[13px] tracking-[4px] text-gold">HATA 500</div>
          <div className="mt-3 font-serif text-[96px] font-medium leading-none text-ink sm:text-[130px] md:text-[150px]">
            5<span className="text-gold">0</span>0
          </div>
          <span className="relative mt-6 block h-px w-11 bg-gold">
            <span
              aria-hidden
              className="absolute -top-1 right-[11px] block h-px w-2.5 rotate-[-45deg] bg-gold"
            />
          </span>
          <h1 className="mt-6 text-balance font-serif text-[28px] font-medium leading-tight sm:text-[36px]">
            Bir aksaklık yaşadık; kusura bakmayın.
          </h1>
          <p className="text-pretty mt-4 text-base leading-relaxed text-muted">
            Sunucumuzda geçici bir sorun oluştu. Ekibimiz haberdar edildi; kısa süre içinde
            düzelecek. Acil bir konu varsa bizi arayabilirsiniz.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3.5">
            <button
              type="button"
              onClick={() => unstable_retry()}
              className="rounded bg-ink px-7 py-3.5 text-base font-semibold text-cream transition-colors hover:bg-gold hover:text-white"
            >
              Sayfayı yenile
            </button>
            <a
              href="tel:+903122158085"
              className="rounded border border-gold px-7 py-3.5 text-base font-semibold text-ink transition-colors hover:bg-gold hover:text-white"
            >
              Bizi arayın
            </a>
          </div>
        </div>

        <div className="bg-ink-deep">
          <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-4 px-8 py-7">
            <span className="text-[12.5px] text-on-dark-muted">
              © 2026 YAKA Hukuk &amp; Danışmanlık. Tüm hakları saklıdır.
            </span>
            <span className="font-mono text-[11.5px] tracking-[1.5px] text-gold">7/24 ULAŞILABİLİR</span>
          </div>
        </div>
      </body>
    </html>
  );
}
