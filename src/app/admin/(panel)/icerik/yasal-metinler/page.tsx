import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { ContentModuleBrowser } from "@/components/admin/content/ContentModuleBrowser";
import type { FieldDef } from "@/lib/admin/content-fields";
import { toModuleItem } from "./mapper";
import { saveLegalDocument, deleteLegalDocument, reorderLegalDocuments } from "./actions";

export const metadata: Metadata = { title: "Yasal Metinler" };

const topFields: FieldDef[] = [
  { key: "slug", label: "Slug", kind: "text", localized: false, readOnly: true },
];

const localizedFields: FieldDef[] = [
  { key: "tabLabel", label: "Sekme başlığı", kind: "text", localized: true },
  { key: "tag", label: "Kısa etiket", kind: "text", localized: true, hint: "Örn. KVKK" },
  { key: "title", label: "Başlık", kind: "text", localized: true },
  { key: "intro", label: "Giriş metni", kind: "textarea", localized: true, rows: 3 },
  {
    key: "sections",
    label: "Maddeler",
    kind: "lines",
    localized: true,
    rows: 10,
    hint: "Her satır: No | Başlık | Metin — örn. 01 | Veri sorumlusu | Açıklama metni",
  },
];

export default async function IcerikYasalMetinlerPage() {
  const user = await getSessionUser();
  const rows = await prisma.legalDocument.findMany({ orderBy: { order: "asc" } });
  const items = rows.map(toModuleItem);

  return (
    <>
      <AdminTopbar eyebrow="PANEL / İÇERİK" title="Yasal Metinler" userName={user?.name ?? "Yönetici"} />
      <ContentModuleBrowser
        moduleTitle="Yasal Metinler"
        items={items}
        topFields={topFields}
        localizedFields={localizedFields}
        showPublished={false}
        allowCreate={false}
        allowDelete={false}
        onSave={saveLegalDocument}
        onDelete={deleteLegalDocument}
        onReorder={reorderLegalDocuments}
      />
    </>
  );
}
