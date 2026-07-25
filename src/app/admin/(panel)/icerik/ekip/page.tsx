import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { ContentModuleBrowser } from "@/components/admin/content/ContentModuleBrowser";
import type { FieldDef } from "@/lib/admin/content-fields";
import { toModuleItem } from "./mapper";
import { saveTeamMember, deleteTeamMember, reorderTeamMembers } from "./actions";

export const metadata: Metadata = { title: "Ekip" };

const topFields: FieldDef[] = [
  { key: "slug", label: "Slug", kind: "text", localized: false, hint: "URL'de kullanılır, örn. av-ornek-isim" },
  { key: "name", label: "Ad Soyad", kind: "text", localized: false, required: true },
  { key: "bar", label: "Baro", kind: "text", localized: false },
  { key: "tags", label: "Uzmanlık etiketleri", kind: "lines", localized: false, rows: 3, hint: "Her satır bir etiket, örn. AİLE" },
  {
    key: "areas",
    label: "Çalışma alanları",
    kind: "lines",
    localized: false,
    rows: 3,
    hint: "Çalışma Alanları modülündeki başlıklarla birebir eşleşmeli, her satıra bir tane (örn. Aile Hukuku).",
  },
  { key: "languages", label: "Diller", kind: "lines", localized: false, rows: 2, hint: "Her satır bir dil, örn. TÜRKÇE" },
  {
    key: "articleSlugs",
    label: "İlişkili makale slug'ları",
    kind: "lines",
    localized: false,
    rows: 3,
    hint: "Makaleler modülündeki slug değerleri, her satıra bir tane.",
  },
  {
    key: "portraitUrl",
    label: "Portre görsel URL'si",
    kind: "text",
    localized: false,
    hint: "Medya kütüphanesi eklenene kadar doğrudan görsel adresi girin.",
  },
];

const localizedFields: FieldDef[] = [
  { key: "role", label: "Unvan (eyebrow)", kind: "text", localized: true, hint: "Büyük harf, örn. KURUCU AVUKAT" },
  { key: "roleShort", label: "Kısa unvan", kind: "text", localized: true },
  { key: "bio", label: "Biyografi", kind: "lines", localized: true, rows: 5, hint: "Her satır bir paragraf." },
  {
    key: "education",
    label: "Eğitim",
    kind: "lines",
    localized: true,
    rows: 4,
    hint: "Her satır: dönem — açıklama. Örn. 2010–2014 — Ankara Üniversitesi Hukuk Fakültesi",
  },
];

export default async function IcerikEkipPage() {
  const user = await getSessionUser();
  const rows = await prisma.teamMember.findMany({ orderBy: { order: "asc" } });
  const items = rows.map(toModuleItem);

  return (
    <>
      <AdminTopbar eyebrow="PANEL / İÇERİK" title="Ekip" userName={user?.name ?? "Yönetici"} />
      <ContentModuleBrowser
        moduleTitle="Ekip"
        items={items}
        topFields={topFields}
        localizedFields={localizedFields}
        onSave={saveTeamMember}
        onDelete={deleteTeamMember}
        onReorder={reorderTeamMembers}
      />
    </>
  );
}
