import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { Wizard } from "@/components/admin/makaleler/Wizard";

export const metadata: Metadata = { title: "Yeni Makale" };

export default async function AdminYeniMakalePage() {
  const [user, areas] = await Promise.all([
    getSessionUser(),
    prisma.practiceArea.findMany({ orderBy: { order: "asc" }, select: { slug: true, t: true } }),
  ]);

  const practiceAreaOptions = areas.map((a) => ({
    value: a.slug,
    label: (a.t as { tr: { title: string } }).tr.title,
  }));

  return (
    <>
      <AdminTopbar
        eyebrow="PANEL / MAKALELER / YENİ"
        title="Yapay zeka ile yeni makale"
        userName={user?.name ?? "Yönetici"}
      />
      <div className="flex-1 p-8">
        <Wizard practiceAreaOptions={practiceAreaOptions} />
      </div>
    </>
  );
}
