import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { istanbulDateKey } from "@/lib/booking";
import { getPracticeAreasRaw } from "@/content/practice-areas";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { RandevularBrowser } from "./RandevularBrowser";
import type { CalendarAppointment, BlockedDateItem } from "./types";

export const metadata: Metadata = { title: "Randevu Yönetimi" };

export default async function RandevularPage() {
  const user = await getSessionUser();

  const [appointments, rules, blockedDates, practiceAreas] = await Promise.all([
    prisma.appointment.findMany({ orderBy: [{ date: "asc" }, { startTime: "asc" }] }),
    prisma.availabilityRule.findMany(),
    prisma.blockedDate.findMany({ orderBy: { date: "asc" } }),
    getPracticeAreasRaw(),
  ]);

  function areaLabel(slug: string | null): string {
    if (!slug) return "Genel";
    return practiceAreas.find((a) => a.slug === slug)?.t.tr.title ?? slug;
  }

  const calendarAppointments: CalendarAppointment[] = appointments.map((a) => ({
    id: a.id,
    dateKey: istanbulDateKey(a.date),
    startTime: a.startTime,
    kim: a.name,
    konu: `${areaLabel(a.practiceAreaSlug)} · ${a.subject?.trim() || "ön görüşme"}`,
    status: a.status,
  }));

  const weeklyOpen = Array.from({ length: 7 }, (_, weekday) => {
    const rule = rules.find((r) => r.weekday === weekday);
    return !!rule?.isActive;
  });
  const slotMinutes = rules[0]?.slotMinutes ?? 45;
  const bufferMinutes = rules[0]?.bufferMinutes ?? 15;

  const blockedDateItems: BlockedDateItem[] = blockedDates.map((b) => ({
    id: b.id,
    dateKey: istanbulDateKey(b.date),
    label:
      new Intl.DateTimeFormat("tr-TR", { timeZone: "Europe/Istanbul", day: "2-digit", month: "short", year: "numeric" })
        .format(b.date)
        .toUpperCase(),
    reason: b.reason ?? "Kapalı gün",
  }));

  return (
    <>
      <AdminTopbar
        eyebrow="PANEL / RANDEVULAR"
        title="Randevu Yönetimi"
        userName={user?.name ?? "Yönetici"}
      />
      <RandevularBrowser
        appointments={calendarAppointments}
        weeklyOpen={weeklyOpen}
        slotMinutes={slotMinutes}
        bufferMinutes={bufferMinutes}
        blockedDates={blockedDateItems}
        todayKey={istanbulDateKey(new Date())}
      />
    </>
  );
}
