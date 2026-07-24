import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { describeUserAgent } from "@/lib/admin/format";
import { ProfilBrowser } from "./ProfilBrowser";

export const metadata: Metadata = { title: "Profil" };

function formatLoginTime(date: Date): string {
  const TZ = "Europe/Istanbul";
  const dayKey = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(d);
  const today = new Date();
  const yesterday = new Date(today.getTime() - 86400000);
  const time = new Intl.DateTimeFormat("tr-TR", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
  if (dayKey(date) === dayKey(today)) return `BUGÜN ${time}`;
  if (dayKey(date) === dayKey(yesterday)) return `DÜN ${time}`;
  const dm = new Intl.DateTimeFormat("tr-TR", { timeZone: TZ, day: "2-digit", month: "short" })
    .format(date)
    .toUpperCase();
  return `${dm} ${time}`;
}

export default async function ProfilPage() {
  const user = await getSessionUser();
  if (!user) return null;

  const logins = await prisma.auditLog.findMany({
    where: { actorId: user.id, action: { in: ["login", "login_2fa", "login_backup_code"] } },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const recentLogins = logins.map((l) => ({
    id: l.id,
    device: describeUserAgent(l.userAgent),
    ip: l.ip ?? "—",
    time: formatLoginTime(l.createdAt),
  }));

  return (
    <>
      <AdminTopbar eyebrow="PANEL / PROFİL" title="Profil & Hesap" userName={user.name} />
      <ProfilBrowser
        name={user.name}
        email={user.email}
        twoFAEnabled={user.twoFAEnabled}
        recentLogins={recentLogins}
      />
    </>
  );
}
