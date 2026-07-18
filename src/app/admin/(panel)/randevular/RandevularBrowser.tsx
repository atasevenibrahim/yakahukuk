"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { AppointmentStatus } from "@prisma/client";
import {
  confirmAppointment,
  rejectAppointment,
  rescheduleAppointment,
  saveAvailability,
  addBlockedDate,
  removeBlockedDate,
} from "./actions";
import type { CalendarAppointment, BlockedDateItem } from "./types";

const WEEKDAY_HEADERS = ["PZT", "SAL", "ÇAR", "PER", "CUM", "CMT", "PAZ"];
const WEEKDAY_NAMES = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];
const SLOT_DURATIONS = [30, 45, 60];

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function statusStyle(status: AppointmentStatus) {
  switch (status) {
    case "CONFIRMED":
      return { label: "ONAYLI", color: "#3F7A5B", border: "#CDE0D4", bg: "rgba(63,122,91,.06)" };
    case "REJECTED":
      return { label: "REDDEDİLDİ", color: "#A23A32", border: "#E8C5C1", bg: "rgba(162,58,50,.06)" };
    case "RESCHEDULED":
      return { label: "YENİDEN PLANLANDI", color: "#5B6270", border: "#E4DFD5", bg: "transparent" };
    case "CANCELLED":
      return { label: "İPTAL", color: "#5B6270", border: "#E4DFD5", bg: "transparent" };
    default:
      return { label: "BEKLİYOR", color: "#9C7C4A", border: "#9C7C4A", bg: "rgba(156,124,74,.08)" };
  }
}

export function RandevularBrowser({
  appointments,
  weeklyOpen,
  slotMinutes,
  bufferMinutes,
  blockedDates,
  todayKey,
}: {
  appointments: CalendarAppointment[];
  weeklyOpen: boolean[];
  slotMinutes: number;
  bufferMinutes: number;
  blockedDates: BlockedDateItem[];
  todayKey: string;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [view, setView] = useState<"takvim" | "musaitlik">("takvim");
  const [toast, setToast] = useState<string | null>(null);

  const [todayYear, todayMonth] = todayKey.split("-").map(Number);
  const [displayYear, setDisplayYear] = useState(todayYear);
  const [displayMonth, setDisplayMonth] = useState(todayMonth - 1);
  const [selectedDateKey, setSelectedDateKey] = useState(todayKey);

  const [weeklyOpenDraft, setWeeklyOpenDraft] = useState(weeklyOpen);
  const [slotMinutesDraft, setSlotMinutesDraft] = useState(slotMinutes);
  const [dirty, setDirty] = useState(false);

  const [addingBlocked, setAddingBlocked] = useState(false);
  const [newBlockedDate, setNewBlockedDate] = useState("");
  const [newBlockedReason, setNewBlockedReason] = useState("");

  function showToast(message: string) {
    setToast(message);
    setTimeout(() => setToast((current) => (current === message ? null : current)), 2500);
  }

  const blockedKeySet = useMemo(() => new Set(blockedDates.map((b) => b.dateKey)), [blockedDates]);

  const appointmentsByDate = useMemo(() => {
    const map = new Map<string, CalendarAppointment[]>();
    for (const a of appointments) {
      const list = map.get(a.dateKey) ?? [];
      list.push(a);
      map.set(a.dateKey, list);
    }
    return map;
  }, [appointments]);

  const monthLabel = new Intl.DateTimeFormat("tr-TR", { month: "long", year: "numeric" }).format(
    new Date(displayYear, displayMonth, 1),
  );

  const cells = useMemo(() => {
    const leading = (new Date(displayYear, displayMonth, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(displayYear, displayMonth + 1, 0).getDate();
    const list: Array<{
      day: number;
      dateKey: string;
      closed: boolean;
      dot: "pending" | "confirmed" | null;
    } | null> = Array.from({ length: leading }, () => null);

    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${displayYear}-${pad2(displayMonth + 1)}-${pad2(day)}`;
      const weekdayIdx = (new Date(displayYear, displayMonth, day).getDay() + 6) % 7;
      const closed = !weeklyOpen[weekdayIdx] || blockedKeySet.has(dateKey);
      const dayAppointments = appointmentsByDate.get(dateKey) ?? [];
      const hasPending = dayAppointments.some((a) => a.status === "PENDING");
      const hasConfirmed = dayAppointments.some((a) => a.status === "CONFIRMED");
      list.push({
        day,
        dateKey,
        closed,
        dot: hasPending ? "pending" : hasConfirmed ? "confirmed" : null,
      });
    }
    return list;
  }, [displayYear, displayMonth, weeklyOpen, blockedKeySet, appointmentsByDate]);

  function goMonth(delta: number) {
    let m = displayMonth + delta;
    let y = displayYear;
    if (m < 0) {
      m = 11;
      y -= 1;
    } else if (m > 11) {
      m = 0;
      y += 1;
    }
    setDisplayMonth(m);
    setDisplayYear(y);
  }

  const selectedDayAppointments = (appointmentsByDate.get(selectedDateKey) ?? []).slice().sort((a, b) =>
    a.startTime.localeCompare(b.startTime),
  );
  const selectedDayLabel = new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(`${selectedDateKey}T00:00:00`));

  function handleConfirm(id: string) {
    startTransition(async () => {
      const result = await confirmAppointment(id);
      showToast(result.ok ? "Randevu onaylandı — slot dolu işaretlendi" : result.error);
      router.refresh();
    });
  }
  function handleReject(id: string) {
    startTransition(async () => {
      await rejectAppointment(id);
      showToast("Talep reddedildi");
      router.refresh();
    });
  }
  function handleReschedule(id: string) {
    startTransition(async () => {
      await rescheduleAppointment(id);
      showToast("Randevu yeniden planlanacak olarak işaretlendi");
      router.refresh();
    });
  }

  function toggleWeekday(i: number) {
    setWeeklyOpenDraft((prev) => {
      const next = [...prev];
      next[i] = !next[i];
      return next;
    });
    setDirty(true);
  }

  function handleSaveAvailability() {
    startTransition(async () => {
      await saveAvailability(weeklyOpenDraft, slotMinutesDraft);
      setDirty(false);
      showToast("Müsaitlik ayarları kaydedildi");
      router.refresh();
    });
  }

  function handleDiscardAvailability() {
    setWeeklyOpenDraft(weeklyOpen);
    setSlotMinutesDraft(slotMinutes);
    setDirty(false);
    showToast("Değişiklikler geri alındı");
  }

  function handleAddBlockedDate() {
    if (!newBlockedDate) return;
    startTransition(async () => {
      await addBlockedDate(newBlockedDate, newBlockedReason);
      setAddingBlocked(false);
      setNewBlockedDate("");
      setNewBlockedReason("");
      showToast("Kapalı gün eklendi");
      router.refresh();
    });
  }

  function handleRemoveBlockedDate(id: string) {
    startTransition(async () => {
      await removeBlockedDate(id);
      showToast("Kapalı gün kaldırıldı");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-1 flex-col gap-6 px-8 py-6">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setView("takvim")}
          className="rounded px-5 py-2.5 text-[13.5px] font-semibold transition-colors"
          style={{
            border: `1px solid ${view === "takvim" ? "#1C2230" : "#E4DFD5"}`,
            background: view === "takvim" ? "#1C2230" : "#FFFFFF",
            color: view === "takvim" ? "#F6F3EC" : "#1C2230",
          }}
        >
          Takvim
        </button>
        <button
          type="button"
          onClick={() => setView("musaitlik")}
          className="rounded px-5 py-2.5 text-[13.5px] font-semibold transition-colors"
          style={{
            border: `1px solid ${view === "musaitlik" ? "#1C2230" : "#E4DFD5"}`,
            background: view === "musaitlik" ? "#1C2230" : "#FFFFFF",
            color: view === "musaitlik" ? "#F6F3EC" : "#1C2230",
          }}
        >
          Müsaitlik ayarı
        </button>
      </div>

      {view === "takvim" && (
        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(320px,1.1fr)_minmax(0,1fr)]">
          <div className="rounded-md border border-line bg-surface p-6 shadow-[0_1px_2px_rgba(28,34,48,0.05)]">
            <div className="mb-[18px] flex items-center justify-between">
              <h2 className="m-0 text-[15px] font-bold capitalize">{monthLabel}</h2>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => goMonth(-1)}
                  className="flex h-8 w-8 items-center justify-center rounded border border-line text-muted transition-colors hover:border-gold hover:text-gold"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={() => goMonth(1)}
                  className="flex h-8 w-8 items-center justify-center rounded border border-line text-muted transition-colors hover:border-gold hover:text-gold"
                >
                  ›
                </button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {WEEKDAY_HEADERS.map((g) => (
                <span key={g} className="py-1.5 text-center font-mono text-[10px] tracking-[1px] text-muted">
                  {g}
                </span>
              ))}
              {cells.map((cell, i) =>
                cell === null ? (
                  <span key={`blank-${i}`} />
                ) : (
                  <button
                    key={cell.dateKey}
                    type="button"
                    disabled={cell.closed}
                    onClick={() => setSelectedDateKey(cell.dateKey)}
                    className="relative aspect-square rounded font-mono text-[13px] transition-all"
                    style={{
                      border: `1px solid ${
                        cell.dateKey === selectedDateKey ? "#1C2230" : cell.closed ? "#F0EDE4" : "#E4DFD5"
                      }`,
                      background: cell.dateKey === selectedDateKey ? "#1C2230" : cell.closed ? "#FAF8F3" : "#FFFFFF",
                      color: cell.dateKey === selectedDateKey ? "#F6F3EC" : cell.closed ? "#C9C4B8" : "#1C2230",
                      cursor: cell.closed ? "not-allowed" : "pointer",
                    }}
                  >
                    {pad2(cell.day)}
                    {cell.dot && (
                      <span
                        className="absolute bottom-[5px] left-1/2 h-[5px] w-[5px] -translate-x-1/2 rounded-full"
                        style={{ background: cell.dot === "pending" ? "#9C7C4A" : "#3F7A5B" }}
                      />
                    )}
                  </button>
                ),
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-[18px] font-mono text-[10.5px] text-muted">
              <span className="flex items-center gap-1.5">
                <span className="h-[7px] w-[7px] rounded-full bg-[#3F7A5B]" />
                ONAYLI
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-[7px] w-[7px] rounded-full bg-gold" />
                BEKLEYEN
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-[7px] w-[7px] rounded-full bg-line" />
                KAPALI
              </span>
            </div>
          </div>

          <div className="rounded-md border border-line bg-surface shadow-[0_1px_2px_rgba(28,34,48,0.05)]">
            <div className="border-b border-line px-6 py-[18px]">
              <span className="font-mono text-[10px] tracking-[2px] text-gold">SEÇİLİ GÜN</span>
              <h2 className="m-0 mt-1 text-[16px] font-bold capitalize">{selectedDayLabel}</h2>
            </div>
            {selectedDayAppointments.length === 0 && (
              <div className="p-12 text-center">
                <span className="inline-block h-4 w-4 rotate-45 border-[1.5px] border-gold" />
                <p className="mt-4 text-sm font-semibold">Bu günde randevu yok.</p>
                <p className="mt-1.5 text-[12.5px] text-muted">Takvimden noktalı bir güne tıklayın.</p>
              </div>
            )}
            <div className="flex flex-col">
              {selectedDayAppointments.map((r) => {
                const style = statusStyle(r.status);
                return (
                  <div key={r.id} className="border-b border-cream px-6 py-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-mono text-[15px] font-medium">{r.startTime}</span>
                      <span className="text-sm font-bold">{r.kim}</span>
                      <span
                        className="rounded-full border px-2.5 py-[3px] font-mono text-[9px] tracking-[1px]"
                        style={{ color: style.color, borderColor: style.border, background: style.bg }}
                      >
                        {style.label}
                      </span>
                    </div>
                    <p className="mt-1.5 text-[13px] text-muted">{r.konu}</p>
                    {r.status === "PENDING" && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleConfirm(r.id)}
                          className="rounded bg-[#3F7A5B] px-4 py-[9px] text-xs font-semibold text-white"
                        >
                          Onayla
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReject(r.id)}
                          className="rounded border border-[#E8C5C1] bg-surface px-4 py-[9px] text-xs font-semibold text-[#A23A32] transition-colors hover:bg-[#FBF1F0]"
                        >
                          Reddet
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReschedule(r.id)}
                          className="rounded border border-line bg-surface px-4 py-[9px] text-xs font-semibold text-muted transition-colors hover:border-gold hover:text-gold"
                        >
                          Yeniden planla
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {view === "musaitlik" && (
        <div className="flex max-w-[820px] flex-col gap-5">
          <div className="rounded-md border border-line bg-surface p-7 shadow-[0_1px_2px_rgba(28,34,48,0.05)]">
            <h2 className="m-0 mb-[18px] text-[15px] font-bold">Haftalık çalışma saatleri</h2>
            <div className="flex flex-col gap-2.5">
              {WEEKDAY_NAMES.map((name, i) => {
                const open = weeklyOpenDraft[i];
                return (
                  <div
                    key={name}
                    className="grid grid-cols-[110px_auto_1fr] items-center gap-4 rounded border border-cream px-3.5 py-2.5"
                    style={{ background: open ? "#FFFFFF" : "#FAF8F3" }}
                  >
                    <span className="text-[13.5px] font-semibold" style={{ color: open ? "#1C2230" : "#5B6270" }}>
                      {name}
                    </span>
                    <label className="flex cursor-pointer items-center gap-2 text-[12.5px] text-muted">
                      <input
                        type="checkbox"
                        checked={open}
                        onChange={() => toggleWeekday(i)}
                        className="h-4 w-4 cursor-pointer accent-gold"
                      />
                      Açık
                    </label>
                    <span className="text-right font-mono text-[13px]" style={{ color: open ? "#1C2230" : "#5B6270" }}>
                      {open ? "09:00 – 18:00" : "KAPALI"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="rounded-md border border-line bg-surface p-7 shadow-[0_1px_2px_rgba(28,34,48,0.05)]">
              <h2 className="m-0 mb-[18px] text-[15px] font-bold">Slot ayarları</h2>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[13.5px] text-muted">Slot süresi</span>
                  <div className="flex gap-1.5">
                    {SLOT_DURATIONS.map((duration) => {
                      const active = duration === slotMinutesDraft;
                      return (
                        <button
                          key={duration}
                          type="button"
                          onClick={() => {
                            setSlotMinutesDraft(duration);
                            setDirty(true);
                          }}
                          className="rounded px-3.5 py-2 font-mono text-xs transition-colors"
                          style={{
                            border: `1px solid ${active ? "#1C2230" : "#E4DFD5"}`,
                            background: active ? "#1C2230" : "#FFFFFF",
                            color: active ? "#F6F3EC" : "#1C2230",
                          }}
                        >
                          {duration} dk
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[13.5px] text-muted">Aralık (buffer)</span>
                  <span className="font-mono text-[13px]">{bufferMinutes} dk</span>
                </div>
                <p className="m-0 rounded border border-cream bg-[#FAF8F3] px-3.5 py-3 text-xs leading-relaxed text-muted">
                  Çakışan randevular otomatik engellenir; onaylanan talep slotu dolu işaretler.
                </p>
              </div>
            </div>

            <div className="rounded-md border border-line bg-surface p-7 shadow-[0_1px_2px_rgba(28,34,48,0.05)]">
              <h2 className="m-0 mb-[18px] text-[15px] font-bold">Kapalı günler</h2>
              <div className="flex flex-col gap-2">
                {blockedDates.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between gap-3 rounded border border-cream px-3.5 py-2.5"
                  >
                    <span className="text-[13.5px] font-semibold">{b.reason}</span>
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-xs text-muted">{b.label}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveBlockedDate(b.id)}
                        aria-label="Kapalı günü kaldır"
                        className="text-muted transition-colors hover:text-[#A23A32]"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
                {addingBlocked ? (
                  <div className="mt-1 flex flex-col gap-2 rounded border border-line p-3">
                    <input
                      type="date"
                      value={newBlockedDate}
                      onChange={(e) => setNewBlockedDate(e.target.value)}
                      className="rounded border border-line px-2.5 py-2 text-[13px] outline-none focus:border-gold"
                    />
                    <input
                      type="text"
                      value={newBlockedReason}
                      onChange={(e) => setNewBlockedReason(e.target.value)}
                      placeholder="Sebep (opsiyonel)"
                      className="rounded border border-line px-2.5 py-2 text-[13px] outline-none focus:border-gold"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleAddBlockedDate}
                        className="rounded bg-ink px-3.5 py-2 text-xs font-semibold text-cream"
                      >
                        Ekle
                      </button>
                      <button
                        type="button"
                        onClick={() => setAddingBlocked(false)}
                        className="rounded border border-line px-3.5 py-2 text-xs font-semibold text-muted"
                      >
                        İptal
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setAddingBlocked(true)}
                    className="mt-1 rounded border border-dashed border-gold px-3 py-2.5 text-[13px] font-semibold text-gold transition-colors hover:bg-[#FAF8F3]"
                  >
                    + Kapalı gün ekle
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 flex items-center justify-between gap-4 rounded-md border border-line bg-surface px-6 py-3.5 shadow-[0_-2px_12px_rgba(28,34,48,0.06)]">
            <span className="text-[13px] text-muted">
              {dirty ? "Kaydedilmemiş değişiklikler var" : "Tüm değişiklikler kayıtlı"}
            </span>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={handleDiscardAvailability}
                disabled={!dirty}
                className="rounded border border-line bg-surface px-5 py-[11px] text-[13.5px] font-semibold text-muted transition-colors hover:border-gold hover:text-gold disabled:opacity-50"
              >
                Değişiklikleri geri al
              </button>
              <button
                type="button"
                onClick={handleSaveAvailability}
                disabled={!dirty}
                className="rounded bg-ink px-6 py-[11px] text-[13.5px] font-semibold text-cream transition-colors hover:bg-gold disabled:opacity-50"
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-7 left-1/2 z-[99] -translate-x-1/2 rounded bg-ink px-6 py-3.5 text-sm font-semibold text-cream shadow-[0_8px_24px_rgba(28,34,48,0.25)]">
          {toast}
        </div>
      )}
    </div>
  );
}
