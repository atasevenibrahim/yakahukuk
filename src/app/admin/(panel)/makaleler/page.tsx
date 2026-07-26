import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { getPathname } from "@/i18n/navigation";
import type { LinkTargetOption } from "@/components/admin/makaleler/LinkDialog";
import { toFormData, toListItem } from "./mapper";
import { MakalelerBrowser } from "./MakalelerBrowser";
import type { ArticleFormData } from "./types";

export const metadata: Metadata = { title: "Makaleler" };

export default async function AdminMakalelerPage() {
  const [user, rows, areas] = await Promise.all([
    getSessionUser(),
    prisma.article.findMany({
      // Genel siteyle aynı sıra (bkz. content/articles.ts): NULL publishAt sona düşer.
      orderBy: [{ publishAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
    }),
    prisma.practiceArea.findMany({ orderBy: { order: "asc" }, select: { slug: true, t: true } }),
  ]);

  const list = rows.map(toListItem);
  const forms: Record<string, ArticleFormData> = {};
  for (const row of rows) forms[row.id] = toFormData(row);

  const practiceAreaOptions = areas.map((a) => ({
    value: a.slug,
    label: (a.t as { tr: { title: string } }).tr.title,
  }));

  // İç bağlantı seçicisinin listesi. Yollar burada üretilir; kullanıcı elle yol yazmaz,
  // dolayısıyla yazım hatasından kaynaklanan kırık bağlantı olamaz.
  const linkTargets: LinkTargetOption[] = [
    ...areas.map((a) => ({
      title: (a.t as { tr: { title: string } }).tr.title,
      href: getPathname({
        href: { pathname: "/calisma-alanlari/[slug]", params: { slug: a.slug } },
        locale: "tr" as const,
      }),
      kind: "Çalışma alanı",
    })),
    ...rows.map((r) => ({
      title: (r.t as { tr: { title: string } }).tr.title,
      href: getPathname({
        href: { pathname: "/makaleler/[slug]", params: { slug: r.slug } },
        locale: "tr" as const,
      }),
      kind: "Makale",
    })),
  ];

  return (
    <>
      <AdminTopbar eyebrow="PANEL / MAKALELER" title="Makaleler" userName={user?.name ?? "Yönetici"} />
      <MakalelerBrowser
        initialList={list}
        initialForms={forms}
        practiceAreaOptions={practiceAreaOptions}
        linkTargets={linkTargets}
      />
    </>
  );
}
