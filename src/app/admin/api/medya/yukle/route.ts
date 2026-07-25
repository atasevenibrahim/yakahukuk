import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { logAudit, readRequestInfo } from "@/lib/auth/audit";
import { MediaError, uploadImage } from "@/lib/media/storage";

/**
 * Görsel yükleme. Server Action yerine Route Handler: dosya yüklemesi `multipart/form-data`
 * ile geliyor ve ilerleme/iptal için doğrudan `fetch` kontrolü gerekiyor.
 *
 * Yol `/admin` altında olmak ZORUNDA — oturum çerezi `path: "/admin"` ile yazılıyor
 * (`src/lib/auth/session.ts`), kök `/api/...`'ye tarayıcı bu çerezi hiç göndermez.
 */

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

export async function POST(request: Request): Promise<Response> {
  const user = await getSessionUser();
  if (!user) return json({ error: "Yetkisiz erişim: oturum bulunamadı." }, 401);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ error: "Geçersiz istek gövdesi." }, 400);
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return json({ error: "Dosya bulunamadı." }, 400);
  }

  try {
    const uploaded = await uploadImage(file);
    const asset = await prisma.mediaAsset.create({
      data: { ...uploaded, alt: "", uploadedById: user.id },
    });

    await logAudit({
      actorId: user.id,
      action: "media_uploaded",
      module: "MEDYA",
      entityId: asset.id,
      detail: `${asset.filename} · ${Math.round(asset.size / 1024)} KB`,
      request: await readRequestInfo(),
    });

    return json({ asset }, 201);
  } catch (err) {
    if (err instanceof MediaError) {
      // Yapılandırma/boyut/tür hataları kullanıcı hatası ya da kurulum eksiği — 400.
      return json({ error: err.userMessage }, err.kind === "config" ? 503 : 400);
    }
    console.error("[medya] yükleme hatası:", err);
    return json({ error: "Beklenmeyen bir hata oluştu. Tekrar deneyin." }, 500);
  }
}
