"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { RequestStatus } from "@prisma/client";
import { initialsFromName, messageStatusBadge, type BadgeStyle } from "@/lib/admin/format";
import { updateMessageStatus, saveMessageNote, saveAppointmentNote } from "./actions";
import type { InboxItem } from "./types";
import { AdminToast } from "@/components/admin/AdminToast";

const TABS = ["Tümü", "Mesajlar", "Randevu Talepleri"] as const;
const MESSAGE_STATUSES: RequestStatus[] = ["NEW", "READ", "REPLIED", "CLOSED"];

export function GelenTaleplerBrowser({ items }: { items: InboxItem[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Tümü");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(items[0]?.id ?? null);
  const [noteDraft, setNoteDraft] = useState(items[0]?.internalNote ?? "");
  const [toast, setToast] = useState<string | null>(null);
  const [overrides, setOverrides] = useState<Record<string, { messageStatus: RequestStatus; badge: BadgeStyle }>>(
    {},
  );

  function showToast(message: string) {
    setToast(message);
    setTimeout(() => setToast((current) => (current === message ? null : current)), 2500);
  }

  const merged = useMemo(
    () => items.map((item) => (overrides[item.id] ? { ...item, ...overrides[item.id] } : item)),
    [items, overrides],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLocaleLowerCase("tr");
    return merged.filter((item) => {
      if (tab === "Mesajlar" && item.kind !== "message") return false;
      if (tab === "Randevu Talepleri" && item.kind !== "appointment") return false;
      if (!q) return true;
      return item.kim.toLocaleLowerCase("tr").includes(q) || item.konu.toLocaleLowerCase("tr").includes(q);
    });
  }, [merged, tab, search]);

  const selected = merged.find((i) => i.id === selectedId) ?? filtered[0] ?? null;

  const counts = {
    Tümü: merged.length,
    Mesajlar: merged.filter((i) => i.kind === "message").length,
    "Randevu Talepleri": merged.filter((i) => i.kind === "appointment").length,
  };

  function selectItem(item: InboxItem) {
    setSelectedId(item.id);
    setNoteDraft(item.internalNote);
  }

  function handleStatusChange(status: RequestStatus) {
    if (!selected || selected.kind !== "message") return;
    setOverrides((prev) => ({
      ...prev,
      [selected.id]: { messageStatus: status, badge: messageStatusBadge(status) },
    }));
    showToast(`Durum güncellendi: ${messageStatusBadge(status).label}`);
    startTransition(async () => {
      await updateMessageStatus(selected.id, status);
      router.refresh();
    });
  }

  function handleArchive() {
    if (!selected || selected.kind !== "message") return;
    handleStatusChange("CLOSED");
    showToast("Talep arşivlendi");
  }

  function handleSaveNote() {
    if (!selected) return;
    const note = noteDraft.trim();
    showToast("Not kaydedildi");
    startTransition(async () => {
      if (selected.kind === "message") {
        await saveMessageNote(selected.id, note);
      } else {
        await saveAppointmentNote(selected.id, note);
      }
      router.refresh();
    });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 px-8 py-6">
      <div className="flex flex-wrap items-center gap-2.5">
        {TABS.map((t) => {
          const active = t === tab;
          return (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded-full border px-[18px] py-2.5 text-[13.5px] font-semibold transition-colors ${
                active ? "border-ink bg-ink text-cream" : "border-line bg-surface text-ink hover:border-gold"
              }`}
            >
              {t} <span className="font-mono text-[11px] opacity-75">{String(counts[t]).padStart(2, "0")}</span>
            </button>
          );
        })}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Gönderen veya konu ara…"
          className="ml-auto h-10 w-[260px] rounded border border-line bg-surface px-3.5 text-[13.5px] text-ink outline-none focus:border-gold"
        />
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(300px,380px)_minmax(0,1fr)]">
        <div className="overflow-hidden rounded-md border border-line bg-surface shadow-[0_1px_2px_rgba(28,34,48,0.05)]">
          {filtered.length === 0 && (
            <div className="p-14 text-center">
              <span className="inline-block h-4 w-4 rotate-45 border-[1.5px] border-gold" />
              <p className="mt-4 text-[14.5px] font-semibold">Eşleşen talep yok.</p>
              <p className="mt-1.5 text-[13px] text-muted">Filtreyi veya aramayı değiştirin.</p>
            </div>
          )}
          <div className="flex max-h-[calc(100vh-220px)] flex-col overflow-y-auto">
            {filtered.map((item) => {
              const active = selected?.id === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => selectItem(item)}
                  className="grid grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-cream px-[18px] py-3.5 text-left transition-colors hover:bg-[#FAF8F3]"
                  style={{
                    borderLeft: `2px solid ${active ? "#9C7C4A" : "transparent"}`,
                    background: active ? "#FAF8F3" : item.messageStatus === "NEW" ? "#FDFCF9" : "#FFFFFF",
                  }}
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-cream text-xs font-bold text-muted">
                    {initialsFromName(item.kim)}
                  </span>
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span
                      className="overflow-hidden text-ellipsis whitespace-nowrap text-[13.5px]"
                      style={{ fontWeight: item.messageStatus === "NEW" ? 700 : 600 }}
                    >
                      {item.kim}
                    </span>
                    <span className="overflow-hidden text-ellipsis whitespace-nowrap text-xs text-muted">
                      {item.konu}
                    </span>
                  </span>
                  <span className="flex flex-col items-end gap-1.5">
                    <span className="font-mono text-[10px] text-muted">{item.zaman}</span>
                    <span
                      className="rounded-full border px-2 py-0.5 font-mono text-[8.5px] tracking-[1px]"
                      style={{ color: item.badge.color, borderColor: item.badge.border, background: item.badge.bg }}
                    >
                      {item.badge.label}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {selected ? (
          <div className="rounded-md border border-line bg-surface px-8 py-7 shadow-[0_1px_2px_rgba(28,34,48,0.05)]">
            <div className="flex flex-wrap items-start justify-between gap-5 border-b border-line pb-5">
              <div className="flex items-center gap-3.5">
                <span className="flex h-[46px] w-[46px] items-center justify-center rounded-full bg-ink text-sm font-bold text-cream">
                  {initialsFromName(selected.kim)}
                </span>
                <div>
                  <h2 className="m-0 text-[17px] font-bold">{selected.kim}</h2>
                  <p className="m-0 mt-1 font-mono text-[11px] text-muted">
                    {selected.tip} · {selected.tamZaman} · KAYNAK DİL: TR
                  </p>
                </div>
              </div>
              {selected.kind === "message" && (
                <div className="flex flex-wrap gap-2">
                  {MESSAGE_STATUSES.map((status) => {
                    const active = selected.messageStatus === status;
                    const style = messageStatusBadge(status);
                    return (
                      <button
                        key={status}
                        type="button"
                        onClick={() => handleStatusChange(status)}
                        className="rounded-full border px-3 py-[7px] font-mono text-[10px] tracking-[1px] transition-colors"
                        style={{
                          color: active ? style.color : "#5B6270",
                          borderColor: active ? style.border : "#E4DFD5",
                          background: active ? style.bg : "#FFFFFF",
                        }}
                      >
                        {style.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-x-8 gap-y-4 border-b border-line py-[22px] sm:grid-cols-2">
              <div>
                <span className="mb-1 block font-mono text-[10px] tracking-[1.5px] text-muted">E-POSTA</span>
                <span className="text-sm font-semibold">{selected.eposta}</span>
              </div>
              <div>
                <span className="mb-1 block font-mono text-[10px] tracking-[1.5px] text-muted">TELEFON</span>
                <span className="text-sm font-semibold">{selected.telefon}</span>
              </div>
              <div>
                <span className="mb-1 block font-mono text-[10px] tracking-[1.5px] text-muted">KONU</span>
                <span className="text-sm font-semibold">{selected.alan}</span>
              </div>
              <div>
                <span className="mb-1 block font-mono text-[10px] tracking-[1.5px] text-muted">KVKK ONAYI</span>
                <span className="text-sm font-semibold text-[#3F7A5B]">
                  {selected.kvkkConsent ? `✓ ${selected.tamZaman}` : "—"}
                </span>
              </div>
            </div>

            <div className="py-[22px]">
              <span className="mb-2 block font-mono text-[10px] tracking-[1.5px] text-muted">MESAJ</span>
              <p className="text-pretty m-0 rounded border border-cream bg-[#FAF8F3] px-5 py-[18px] text-[14.5px] leading-relaxed">
                {selected.mesaj}
              </p>
            </div>

            {selected.kind === "appointment" && (
              <div className="mb-[22px] flex flex-wrap items-center gap-4 rounded border border-gold/30 bg-gold/[0.07] px-5 py-3.5">
                <span className="font-mono text-[10.5px] tracking-[1.5px] text-gold">TALEP EDİLEN SLOT</span>
                <span className="text-[14.5px] font-bold">{selected.slot}</span>
                <Link
                  href="/admin/randevular"
                  className="ml-auto border-b border-gold pb-0.5 text-[13px] font-semibold text-gold"
                >
                  Randevu Yönetimi&apos;nde aç →
                </Link>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <span className="font-mono text-[10px] tracking-[1.5px] text-muted">DAHİLİ NOT</span>
              <textarea
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                placeholder="Ekip için not ekleyin (müvekkile gönderilmez)…"
                rows={2}
                className="resize-y rounded border border-line bg-surface px-3.5 py-3 text-[13.5px] leading-relaxed outline-none focus:border-gold"
              />
            </div>

            <div className="mt-5 flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={handleSaveNote}
                className="rounded bg-ink px-[22px] py-[11px] text-[13.5px] font-semibold text-cream transition-colors hover:bg-gold"
              >
                Notu kaydet
              </button>
              {selected.kind === "message" && (
                <button
                  type="button"
                  onClick={handleArchive}
                  className="rounded border border-line bg-surface px-[22px] py-[11px] text-[13.5px] font-semibold text-muted transition-colors hover:border-gold hover:text-gold"
                >
                  Arşivle
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-md border border-line bg-surface p-14 text-center text-sm text-muted">
            Görüntülemek için soldan bir talep seçin.
          </div>
        )}
      </div>

      <AdminToast message={toast} />
    </div>
  );
}
