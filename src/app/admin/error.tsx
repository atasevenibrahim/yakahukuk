"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function AdminError({
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
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-16 text-center">
      <div className="max-w-[480px]">
        <div className="font-mono text-[13px] tracking-[4px] text-gold">HATA 500</div>
        <div className="mt-3 font-serif text-[80px] font-medium leading-none text-ink">
          5<span className="text-gold">0</span>0
        </div>
        <h1 className="mt-6 font-serif text-2xl font-medium leading-tight">
          Panelde bir aksaklık oluştu.
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted">
          Beklenmeyen bir hata oluştu; ekip haberdar edildi. Tekrar deneyebilir ya da panele
          dönebilirsiniz.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => unstable_retry()}
            className="rounded bg-ink px-6 py-3 text-sm font-semibold text-cream transition-colors hover:bg-gold"
          >
            Tekrar dene
          </button>
          <Link
            href="/admin"
            className="rounded border border-line px-6 py-3 text-sm font-semibold text-ink transition-colors hover:border-gold hover:text-gold"
          >
            Panele dön
          </Link>
        </div>
      </div>
    </div>
  );
}
