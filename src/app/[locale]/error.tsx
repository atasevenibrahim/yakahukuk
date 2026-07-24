"use client";

import { useEffect } from "react";
import { Container } from "@/components/ui/Container";

export default function LocaleError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Container className="flex min-h-[70vh] flex-col items-center justify-center py-16 text-center">
      <div className="max-w-[560px]">
        <div className="font-mono text-[13px] tracking-[4px] text-gold">HATA 500</div>
        <div className="mt-3 font-serif text-[96px] font-medium leading-none text-ink sm:text-[130px] md:text-[150px]">
          5<span className="text-gold">0</span>0
        </div>
        <div className="mt-6 flex items-center justify-center gap-3.5">
          <span className="relative block h-px w-11 bg-gold">
            <span
              aria-hidden
              className="absolute -top-1 right-[11px] block h-px w-2.5 rotate-[-45deg] bg-gold"
            />
          </span>
        </div>
        <h1 className="mt-6 font-serif text-[28px] font-medium leading-tight text-balance sm:text-[36px]">
          Bir aksaklık yaşadık; kusura bakmayın.
        </h1>
        <p className="mt-4 text-base leading-relaxed text-pretty text-muted">
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
            className="rounded-[4px] border border-gold px-7 py-3.5 text-center text-base font-semibold text-ink transition-colors duration-200 hover:bg-gold hover:text-white"
          >
            Bizi arayın
          </a>
        </div>
      </div>
    </Container>
  );
}
