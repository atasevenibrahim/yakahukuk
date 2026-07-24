import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { getSiteSettings } from "@/lib/site-settings";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { describeAuditAction } from "@/lib/admin/format";
import { AyarlarBrowser } from "./AyarlarBrowser";

export const metadata: Metadata = { title: "Sistem & Ayarlar" };

export default async function AyarlarPage() {
  const user = await getSessionUser();
  const settings = await getSiteSettings();

  const auditRows = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const auditLog = auditRows.map((row) => ({
    id: row.id,
    time: new Intl.DateTimeFormat("tr-TR", {
      timeZone: "Europe/Istanbul",
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(row.createdAt),
    who: user && row.actorId === user.id ? user.name : row.actorId ? "Yönetici" : "Sistem",
    action: describeAuditAction(row.action),
    module: row.module,
    ip: row.ip ?? "—",
    createdAt: row.createdAt.toISOString(),
  }));

  return (
    <>
      <AdminTopbar eyebrow="PANEL / SİSTEM" title="Sistem & Ayarlar" userName={user?.name ?? "Yönetici"} />
      <AyarlarBrowser settings={settings} auditLog={auditLog} />
    </>
  );
}
