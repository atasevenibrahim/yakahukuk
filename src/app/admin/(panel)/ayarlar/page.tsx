import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { getSiteSettings } from "@/lib/site-settings";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { describeAuditAction } from "@/lib/admin/format";
import { isMailConfigured } from "@/lib/mail/mailer";
import { AyarlarBrowser } from "./AyarlarBrowser";

export const metadata: Metadata = { title: "Sistem & Ayarlar" };

export default async function AyarlarPage() {
  const user = await getSessionUser();
  const settings = await getSiteSettings();

  const auditRows = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  // Aktör adları gerçek User kayıtlarından çözülür. Önceden yalnızca oturumdaki kullanıcının
  // adı gösteriliyor, diğer herkes "Yönetici" yazılıyordu — ikinci bir yönetici eklendiğinde
  // kimin ne yaptığı kaybolurdu.
  const actorIds = [...new Set(auditRows.map((r) => r.actorId).filter((id): id is string => !!id))];
  const actors = actorIds.length
    ? await prisma.user.findMany({
        where: { id: { in: actorIds } },
        select: { id: true, name: true },
      })
    : [];
  const actorNames = new Map(actors.map((a) => [a.id, a.name]));

  const auditLog = auditRows.map((row) => ({
    id: row.id,
    time: new Intl.DateTimeFormat("tr-TR", {
      timeZone: "Europe/Istanbul",
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(row.createdAt),
    who: row.actorId ? (actorNames.get(row.actorId) ?? "Silinmiş kullanıcı") : "Sistem",
    action: describeAuditAction(row.action),
    module: row.module,
    detail: row.detail ?? "",
    ip: row.ip ?? "—",
    location: row.location ?? "—",
    createdAt: row.createdAt.toISOString(),
  }));

  return (
    <>
      <AdminTopbar eyebrow="PANEL / SİSTEM" title="Sistem & Ayarlar" userName={user?.name ?? "Yönetici"} />
      <AyarlarBrowser settings={settings} auditLog={auditLog} mailConfigured={isMailConfigured()} />
    </>
  );
}
