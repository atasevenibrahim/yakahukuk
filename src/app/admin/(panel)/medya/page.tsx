import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { isStorageConfigured } from "@/lib/media/storage";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { MedyaBrowser } from "./MedyaBrowser";

export const metadata: Metadata = { title: "Medya" };

export default async function AdminMedyaPage() {
  const [user, rows] = await Promise.all([
    getSessionUser(),
    prisma.mediaAsset.findMany({ orderBy: { createdAt: "desc" }, take: 200 }),
  ]);

  const assets = rows.map((r) => ({
    id: r.id,
    url: r.url,
    filename: r.filename,
    mimeType: r.mimeType,
    size: r.size,
    alt: r.alt,
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <>
      <AdminTopbar
        eyebrow="PANEL / MEDYA"
        title="Medya Kütüphanesi"
        userName={user?.name ?? "Yönetici"}
      />
      <MedyaBrowser initialAssets={assets} storageConfigured={isStorageConfigured()} />
    </>
  );
}
