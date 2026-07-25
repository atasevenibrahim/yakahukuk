"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSessionUser } from "@/lib/auth/session";
import { logAudit } from "@/lib/auth/audit";
import { MediaError, deleteImage } from "@/lib/media/storage";

const MODULE_LABEL = "MEDYA";

export type MediaResult = { ok: true } | { ok: false; error: string };

/** Alt metin kaydı. Boş bırakılabilir; SEO paneli eksikse uyarır. */
export async function updateMediaAlt(id: string, alt: string): Promise<MediaResult> {
  const user = await requireSessionUser();
  const asset = await prisma.mediaAsset.update({
    where: { id },
    data: { alt: alt.trim().slice(0, 300) },
  });
  await logAudit({
    actorId: user.id,
    action: "media_alt_updated",
    module: MODULE_LABEL,
    entityId: id,
    detail: asset.filename,
  });
  // Görseli kullanan genel sayfalar alt metni yeniden okusun.
  revalidatePath("/[locale]", "layout");
  return { ok: true };
}

export async function deleteMedia(id: string): Promise<MediaResult> {
  const user = await requireSessionUser();
  const asset = await prisma.mediaAsset.findUnique({ where: { id } });
  if (!asset) return { ok: false, error: "Görsel bulunamadı." };

  try {
    await deleteImage(asset.path);
  } catch (err) {
    if (err instanceof MediaError) return { ok: false, error: err.userMessage };
    throw err;
  }

  await prisma.mediaAsset.delete({ where: { id } });
  await logAudit({
    actorId: user.id,
    action: "media_deleted",
    module: MODULE_LABEL,
    entityId: id,
    detail: asset.filename,
  });
  revalidatePath("/[locale]", "layout");
  return { ok: true };
}
