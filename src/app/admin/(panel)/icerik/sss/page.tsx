import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { ContentModuleBrowser } from "@/components/admin/content/ContentModuleBrowser";
import type { FieldDef } from "@/lib/admin/content-fields";
import { toModuleItem } from "./mapper";
import { saveFaqItem, deleteFaqItem, reorderFaqItems } from "./actions";

export const metadata: Metadata = { title: "SSS" };

export default async function IcerikSssPage() {
  const user = await getSessionUser();
  const [rows, categories] = await Promise.all([
    prisma.faqItem.findMany({ orderBy: { order: "asc" }, include: { category: { select: { t: true } } } }),
    prisma.faqCategory.findMany({ orderBy: { order: "asc" } }),
  ]);
  const items = rows.map(toModuleItem);

  const categoryOptions = categories.map((c) => ({
    value: c.id,
    label: (c.t as { tr: { name: string } }).tr.name,
  }));

  const topFields: FieldDef[] = [
    { key: "categoryId", label: "Kategori", kind: "select", localized: false, options: categoryOptions },
  ];

  const localizedFields: FieldDef[] = [
    { key: "question", label: "Soru", kind: "text", localized: true },
    { key: "answer", label: "Cevap", kind: "textarea", localized: true, rows: 5 },
  ];

  return (
    <>
      <AdminTopbar eyebrow="PANEL / İÇERİK" title="SSS" userName={user?.name ?? "Yönetici"} />
      <ContentModuleBrowser
        moduleTitle="SSS"
        items={items}
        topFields={topFields}
        localizedFields={localizedFields}
        onSave={saveFaqItem}
        onDelete={deleteFaqItem}
        onReorder={reorderFaqItems}
      />
    </>
  );
}
