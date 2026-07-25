import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { ContentModuleBrowser } from "@/components/admin/content/ContentModuleBrowser";
import type { FieldDef } from "@/lib/admin/content-fields";
import { toModuleItem } from "./mapper";
import { saveTestimonial, deleteTestimonial, reorderTestimonials } from "./actions";

export const metadata: Metadata = { title: "Yorumlar" };

export default async function IcerikYorumlarPage() {
  const user = await getSessionUser();
  const [rows, areas] = await Promise.all([
    prisma.testimonial.findMany({ orderBy: { order: "asc" } }),
    prisma.practiceArea.findMany({ orderBy: { order: "asc" }, select: { slug: true, t: true } }),
  ]);
  const items = rows.map(toModuleItem);

  const areaOptions = areas.map((a) => ({
    value: a.slug,
    label: (a.t as { tr: { title: string } }).tr.title,
  }));

  const topFields: FieldDef[] = [
    { key: "practiceAreaSlug", label: "İlgili çalışma alanı", kind: "select", localized: false, options: areaOptions },
    { key: "areaLabel", label: "Kısa alan etiketi", kind: "text", localized: false, hint: "Büyük harf, örn. TİCARET" },
    { key: "initials", label: "İsim / rumuz", kind: "text", localized: false, required: true, hint: "Örn. A. K." },
    { key: "monthLabel", label: "Ay etiketi", kind: "text", localized: false, hint: "Örn. HAZİRAN 2026" },
    { key: "rating", label: "Yıldız (1–5)", kind: "number", localized: false },
  ];

  const localizedFields: FieldDef[] = [
    { key: "quote", label: "Yorum metni", kind: "textarea", localized: true, rows: 4, required: true },
  ];

  return (
    <>
      <AdminTopbar eyebrow="PANEL / İÇERİK" title="Yorumlar" userName={user?.name ?? "Yönetici"} />
      <ContentModuleBrowser
        moduleTitle="Yorumlar"
        items={items}
        topFields={topFields}
        localizedFields={localizedFields}
        publishedLabel="Onaylı (yayınlanır)"
        onSave={saveTestimonial}
        onDelete={deleteTestimonial}
        onReorder={reorderTestimonials}
      />
    </>
  );
}
