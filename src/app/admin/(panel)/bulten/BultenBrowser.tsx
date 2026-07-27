"use client";

import { useMemo, useState } from "react";

type Subscriber = {
  id: string;
  email: string;
  consentVersion: string;
  consentAt: string;
  unsubscribedAt: string | null;
  ip: string | null;
};

const DATE_FMT = new Intl.DateTimeFormat("tr-TR", {
  timeZone: "Europe/Istanbul",
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

/**
 * Bülten aboneleri — listeleme ve İYS'ye yüklemek için CSV dışa aktarma.
 *
 * Gönderim arayüzü kasten YOK: İYS kaydı tamamlanmadan tek bir ticari elektronik ileti bile
 * gönderilemez (6563 sayılı Kanun). Ekranın en üstündeki uyarı bunu hatırlatıyor.
 */
export function BultenBrowser({
  subscribers,
  sendingEnabled,
  consentText,
  consentVersion,
}: {
  subscribers: Subscriber[];
  sendingEnabled: boolean;
  consentText: string;
  consentVersion: string;
}) {
  const [arama, setArama] = useState("");

  const filtered = useMemo(() => {
    const q = arama.trim().toLocaleLowerCase("tr");
    return q ? subscribers.filter((s) => s.email.includes(q)) : subscribers;
  }, [subscribers, arama]);

  const active = subscribers.filter((s) => !s.unsubscribedAt).length;

  /** İYS yüklemesi için CSV. Onay kanıtı (zaman, metin sürümü, IP) birlikte gider. */
  function exportCsv() {
    const rows = [
      ["eposta", "onay_tarihi", "onay_metni_surumu", "ip", "ayrilma_tarihi"],
      ...subscribers.map((s) => [
        s.email,
        s.consentAt,
        s.consentVersion,
        s.ip ?? "",
        s.unsubscribedAt ?? "",
      ]),
    ];
    // Excel'in Türkçe karakterleri doğru açması için BOM.
    const csv = "﻿" + rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(";")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `bulten-aboneleri-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex-1 p-8">
      {!sendingEnabled && (
        <div
          className="mb-5 rounded border px-4 py-3.5"
          style={{ borderColor: "#9C7C4A", background: "rgba(156,124,74,.07)" }}
        >
          <p className="m-0 text-[13px] font-semibold text-ink">Gönderim kapalı</p>
          <p className="m-0 mt-1.5 text-[12.5px] leading-relaxed text-muted">
            Halka açık bülten, 6563 sayılı Kanun kapsamında <strong>ticari elektronik ileti</strong>
            {" "}sayılıyor; gönderim yapabilmek için İleti Yönetim Sistemi&apos;ne (İYS) kayıt ve
            onayların İYS&apos;ye yüklenmesi zorunlu. Kayıt tamamlanana kadar bu ekranda yalnızca
            abone toplanıyor. Aşağıdaki CSV dışa aktarımı, onayları İYS&apos;ye yüklemek için
            gereken alanları içeriyor.
          </p>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span className="rounded-full border border-line bg-surface px-3.5 py-2 font-mono text-[11px] text-muted">
          {active} aktif · {subscribers.length - active} ayrılmış
        </span>
        <input
          type="text"
          value={arama}
          onChange={(e) => setArama(e.target.value)}
          placeholder="E-posta ara…"
          className="h-11 w-64 rounded border border-line bg-surface px-3.5 text-[14px] text-ink outline-none focus:border-gold"
        />
        <button
          type="button"
          onClick={exportCsv}
          disabled={subscribers.length === 0}
          className="ml-auto rounded border border-line bg-surface px-5 py-[11px] text-[13.5px] font-semibold text-muted transition-colors hover:border-gold hover:text-gold disabled:opacity-50"
        >
          CSV olarak indir
        </button>
      </div>

      <div className="overflow-x-auto rounded-md border border-line bg-surface shadow-[0_1px_2px_rgba(28,34,48,0.05)]">
        <div className="grid w-full min-w-[620px] grid-cols-[minmax(220px,1fr)_180px_120px_110px] gap-3 border-b border-line px-5 py-3 font-mono text-[9.5px] tracking-[1.5px] text-muted">
          <span>E-POSTA</span>
          <span>ONAY TARİHİ</span>
          <span>METİN SÜRÜMÜ</span>
          <span>DURUM</span>
        </div>
        {filtered.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm text-muted">
            {subscribers.length === 0 ? "Henüz abone yok." : "Eşleşen abone yok."}
          </p>
        ) : (
          filtered.map((s) => (
            <div
              key={s.id}
              className="grid w-full min-w-[620px] grid-cols-[minmax(220px,1fr)_180px_120px_110px] items-center gap-3 border-b border-cream px-5 py-3"
            >
              <span className="overflow-hidden text-ellipsis whitespace-nowrap text-[13.5px]">
                {s.email}
              </span>
              <span className="font-mono text-[11px] text-muted">
                {DATE_FMT.format(new Date(s.consentAt))}
              </span>
              <span className="font-mono text-[11px] text-muted">{s.consentVersion}</span>
              <span
                className="justify-self-start rounded-full border px-2.5 py-[3px] font-mono text-[9px] tracking-[1px]"
                style={
                  s.unsubscribedAt
                    ? { color: "#A23A32", borderColor: "#E8C5C1", background: "rgba(162,58,50,.06)" }
                    : { color: "#3F7A5B", borderColor: "#CDE0D4", background: "rgba(63,122,91,.06)" }
                }
              >
                {s.unsubscribedAt ? "AYRILDI" : "AKTİF"}
              </span>
            </div>
          ))
        )}
      </div>

      <div className="mt-5 rounded-md border border-line bg-surface p-5">
        <h2 className="m-0 mb-2 text-sm font-bold">Yürürlükteki onay metni ({consentVersion})</h2>
        <p className="m-0 text-[12.5px] leading-relaxed text-muted">{consentText}</p>
      </div>
    </div>
  );
}
