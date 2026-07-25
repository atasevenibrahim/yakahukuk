import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";

/**
 * MediaPicker'ın görsel listesi. Kip açıldığında bir kez çekilir.
 * `/admin` altında — oturum çerezi `path: "/admin"` ile yazılıyor.
 */
export async function GET(): Promise<Response> {
  const user = await getSessionUser();
  if (!user) {
    return new Response(JSON.stringify({ error: "Yetkisiz erişim." }), {
      status: 401,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  }

  const assets = await prisma.mediaAsset.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      url: true,
      filename: true,
      mimeType: true,
      size: true,
      alt: true,
      createdAt: true,
    },
  });

  return new Response(JSON.stringify({ assets }), {
    status: 200,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}
