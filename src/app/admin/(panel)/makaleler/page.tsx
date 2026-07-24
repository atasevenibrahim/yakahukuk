import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { toFormData, toListItem } from "./mapper";
import { MakalelerBrowser } from "./MakalelerBrowser";
import type { ArticleFormData } from "./types";

export const metadata: Metadata = { title: "Makaleler" };

export default async function AdminMakalelerPage() {
  const [user, rows, areas] = await Promise.all([
    getSessionUser(),
    prisma.article.findMany({ orderBy: [{ publishAt: "desc" }, { createdAt: "desc" }] }),
    prisma.practiceArea.findMany({ orderBy: { order: "asc" }, select: { slug: true, t: true } }),
  ]);

  const list = rows.map(toListItem);
  const forms: Record<string, ArticleFormData> = {};
  for (const row of rows) forms[row.id] = toFormData(row);

  const practiceAreaOptions = areas.map((a) => ({
    value: a.slug,
    label: (a.t as { tr: { title: string } }).tr.title,
  }));

  return (
    <>
      <AdminTopbar eyebrow="PANEL / MAKALELER" title="Makaleler" userName={user?.name ?? "Yönetici"} />
      <MakalelerBrowser initialList={list} initialForms={forms} practiceAreaOptions={practiceAreaOptions} />
    </>
  );
}
