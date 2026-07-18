import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { practiceAreas } from "@/content/practice-areas";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { timeAgo, messageStatusBadge, appointmentStatusBadge } from "@/lib/admin/format";
import { GelenTaleplerBrowser } from "./GelenTaleplerBrowser";
import type { InboxItem } from "./types";

export const metadata: Metadata = { title: "Gelen Talepler" };

function fullDateTime(date: Date): string {
  return new Intl.DateTimeFormat("tr-TR", {
    timeZone: "Europe/Istanbul",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
    .format(date)
    .replace(",", " ·")
    .toUpperCase();
}

function areaLabel(slug: string | null): string {
  if (!slug) return "Genel";
  return practiceAreas.find((a) => a.slug === slug)?.t.tr.title ?? slug;
}

export default async function GelenTaleplerPage() {
  const user = await getSessionUser();

  const [messages, appointments] = await Promise.all([
    prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.appointment.findMany({ orderBy: { createdAt: "desc" } }),
  ]);

  const items: InboxItem[] = [
    ...messages.map((m) => ({ kind: "message" as const, createdAt: m.createdAt, record: m })),
    ...appointments.map((a) => ({
      kind: "appointment" as const,
      createdAt: a.createdAt,
      record: a,
    })),
  ]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .map((entry): InboxItem => {
      if (entry.kind === "message") {
        const m = entry.record;
        return {
          id: m.id,
          kind: "message",
          kim: m.name,
          konu: m.subject,
          tip: "MESAJ",
          eposta: m.email,
          telefon: m.phone ?? "—",
          alan: m.subject,
          mesaj: m.message,
          zaman: timeAgo(m.createdAt),
          tamZaman: fullDateTime(m.createdAt),
          badge: messageStatusBadge(m.status),
          messageStatus: m.status,
          appointmentStatus: null,
          slot: null,
          internalNote: m.internalNote ?? "",
          kvkkConsent: m.kvkkConsent,
        };
      }
      const a = entry.record;
      const label = areaLabel(a.practiceAreaSlug);
      return {
        id: a.id,
        kind: "appointment",
        kim: a.name,
        konu: `${label} · randevu`,
        tip: "RANDEVU TALEBİ",
        eposta: a.email,
        telefon: a.phone,
        alan: label,
        mesaj: a.subject?.trim() || "Ek açıklama girilmedi.",
        zaman: timeAgo(a.createdAt),
        tamZaman: fullDateTime(a.createdAt),
        badge: appointmentStatusBadge(a.status),
        messageStatus: null,
        appointmentStatus: a.status,
        slot: `${new Intl.DateTimeFormat("tr-TR", {
          timeZone: "Europe/Istanbul",
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
          .format(a.date)
          .toUpperCase()} · ${a.startTime}`,
        internalNote: a.internalNote ?? "",
        kvkkConsent: a.kvkkConsent,
      };
    });

  return (
    <>
      <AdminTopbar
        eyebrow="PANEL / GELEN TALEPLER"
        title="Gelen Talepler"
        userName={user?.name ?? "Yönetici"}
      />
      <GelenTaleplerBrowser items={items} />
    </>
  );
}
