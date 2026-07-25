import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { ContentModuleBrowser } from "@/components/admin/content/ContentModuleBrowser";
import type { FieldDef } from "@/lib/admin/content-fields";
import { toModuleItem } from "./mapper";
import { savePracticeArea, deletePracticeArea, reorderPracticeAreas } from "./actions";

export const metadata: Metadata = { title: "Çalışma Alanları" };

const ICON_OPTIONS = [
  "heart",
  "gavel",
  "lightbulb",
  "globe",
  "landmark",
  "trendingDown",
  "layers",
  "heartPulse",
  "umbrella",
  "briefcase",
  "shoppingBag",
  "receipt",
].map((v) => ({ value: v, label: v }));

const topFields: FieldDef[] = [
  { key: "slug", label: "Slug", kind: "text", localized: false, hint: "URL'de kullanılır, örn. aile-hukuku" },
  { key: "icon", label: "İkon", kind: "select", localized: false, options: ICON_OPTIONS },
];

const localizedFields: FieldDef[] = [
  { key: "title", label: "Başlık", kind: "text", localized: true, required: true },
  { key: "excerpt", label: "Özet", kind: "textarea", localized: true, rows: 2 },
  {
    key: "whatWeDo",
    label: "Bu alanda ne yapıyoruz",
    kind: "lines",
    localized: true,
    rows: 5,
    hint: "Her satır bir paragraf.",
  },
  {
    key: "typicalCases",
    label: "Tipik dava ve işler",
    kind: "lines",
    localized: true,
    rows: 5,
    hint: "Her satır bir madde.",
  },
];

export default async function IcerikCalismaAlanlariPage() {
  const user = await getSessionUser();
  const rows = await prisma.practiceArea.findMany({ orderBy: { order: "asc" } });
  const items = rows.map(toModuleItem);

  return (
    <>
      <AdminTopbar eyebrow="PANEL / İÇERİK" title="Çalışma Alanları" userName={user?.name ?? "Yönetici"} />
      <ContentModuleBrowser
        moduleTitle="Çalışma Alanları"
        items={items}
        topFields={topFields}
        localizedFields={localizedFields}
        showFeatured
        featuredLabel="Ana sayfada öne çıkar"
        onSave={savePracticeArea}
        onDelete={deletePracticeArea}
        onReorder={reorderPracticeAreas}
      />
    </>
  );
}
