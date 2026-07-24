import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { ContentModuleBrowser } from "@/components/admin/content/ContentModuleBrowser";
import type { FieldDef } from "@/lib/admin/content-fields";
import { toModuleItem } from "./mapper";
import { savePressItem, deletePressItem, reorderPressItems } from "./actions";

export const metadata: Metadata = { title: "Basında Biz" };

const topFields: FieldDef[] = [
  { key: "slug", label: "Slug", kind: "text", localized: false },
  { key: "tag", label: "Etiket", kind: "select", localized: false, options: [
    { value: "BASIN", label: "BASIN" },
    { value: "DUYURU", label: "DUYURU" },
  ] },
  { key: "date", label: "Görünen tarih", kind: "text", localized: false, hint: "Örn. 02 TEM 2026" },
  { key: "isoDate", label: "Tarih (YYYY-AA-GG)", kind: "text", localized: false, hint: "Örn. 2026-07-02" },
  { key: "source", label: "Kaynak", kind: "text", localized: false, hint: "Yalnızca BASIN etiketinde kullanılır." },
];

const localizedFields: FieldDef[] = [
  { key: "title", label: "Başlık", kind: "text", localized: true },
  { key: "excerpt", label: "Özet", kind: "textarea", localized: true, rows: 2 },
  { key: "content", label: "İçerik", kind: "textarea", localized: true, rows: 6 },
];

export default async function IcerikBasindaBizPage() {
  const user = await getSessionUser();
  const rows = await prisma.pressItem.findMany({ orderBy: { order: "asc" } });
  const items = rows.map(toModuleItem);

  return (
    <>
      <AdminTopbar eyebrow="PANEL / İÇERİK" title="Basında Biz" userName={user?.name ?? "Yönetici"} />
      <ContentModuleBrowser
        moduleTitle="Basında Biz"
        items={items}
        topFields={topFields}
        localizedFields={localizedFields}
        onSave={savePressItem}
        onDelete={deletePressItem}
        onReorder={reorderPressItems}
      />
    </>
  );
}
