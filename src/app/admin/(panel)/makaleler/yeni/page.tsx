import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { getPathname } from "@/i18n/navigation";
import type { LinkTargetOption } from "@/components/admin/makaleler/LinkDialog";
import { Wizard } from "@/components/admin/makaleler/Wizard";

export const metadata: Metadata = { title: "Yeni Makale" };

export default async function AdminYeniMakalePage() {
  const [user, areas, articles] = await Promise.all([
    getSessionUser(),
    prisma.practiceArea.findMany({ orderBy: { order: "asc" }, select: { slug: true, t: true } }),
    prisma.article.findMany({ orderBy: { createdAt: "desc" }, select: { slug: true, t: true } }),
  ]);

  const practiceAreaOptions = areas.map((a) => ({
    value: a.slug,
    label: (a.t as { tr: { title: string } }).tr.title,
  }));

  // İç bağlantı seçicisinin listesi — yollar burada üretilir, kullanıcı elle yazmaz.
  const linkTargets: LinkTargetOption[] = [
    ...areas.map((a) => ({
      title: (a.t as { tr: { title: string } }).tr.title,
      href: getPathname({
        href: { pathname: "/calisma-alanlari/[slug]", params: { slug: a.slug } },
        locale: "tr" as const,
      }),
      kind: "Çalışma alanı",
    })),
    ...articles.map((r) => ({
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
      <AdminTopbar
        eyebrow="PANEL / MAKALELER / YENİ"
        title="Yapay zeka ile yeni makale"
        userName={user?.name ?? "Yönetici"}
      />
      <div className="flex-1 p-8">
        <Wizard practiceAreaOptions={practiceAreaOptions} linkTargets={linkTargets} />
      </div>
    </>
  );
}
