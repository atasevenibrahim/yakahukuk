import { prisma } from "@/lib/prisma";

/**
 * Makale görüntülenme sayacı.
 *
 * Neden ayrı bir uç nokta: makale sayfası SSG + saatlik ISR ile üretiliyor, dolayısıyla sunucu
 * render'ı ziyaret başına çalışmıyor — sayım orada yapılamaz. İstemci sayfayı açtığında buraya
 * tek bir "ateşle ve unut" isteği atıyor.
 *
 * `/admin` altında DEĞİL: oturum çerezinin yolu `/admin` ve bu uç nokta genel siteden,
 * oturumsuz çağrılıyor.
 *
 * Şişmeye karşı üç katman: istemcide `sessionStorage` işareti (aynı sekmede tekrar sayılmaz),
 * burada user-agent tabanlı bot süzgeci ve yalnızca YAYINDA olan makalelerin sayılması.
 */

export const dynamic = "force-dynamic";

const SLUG_PATTERN = /^[a-z0-9-]{1,120}$/;

// Arama motoru ve önizleme botları sayaca girmemeli. Liste kısa tutuldu: amaç kusursuz bot
// tespiti değil (imkânsız), sayının açıkça yanıltıcı olmasını engellemek.
const BOT_PATTERN =
  /bot|crawler|spider|crawling|slurp|bingpreview|headless|phantom|curl|wget|python-requests|axios|facebookexternalhit|whatsapp|telegrambot|preview/i;

export async function POST(request: Request) {
  let slug: unknown;
  try {
    ({ slug } = (await request.json()) as { slug?: unknown });
  } catch {
    return Response.json({ ok: false, error: "invalid-body" }, { status: 400 });
  }

  if (typeof slug !== "string" || !SLUG_PATTERN.test(slug)) {
    return Response.json({ ok: false, error: "invalid-slug" }, { status: 400 });
  }

  const userAgent = request.headers.get("user-agent") ?? "";
  // UA'sı olmayan istek de sayılmaz: gerçek tarayıcı daima gönderir.
  if (!userAgent || BOT_PATTERN.test(userAgent)) {
    return Response.json({ ok: true, counted: false });
  }

  try {
    const result = await prisma.article.updateMany({
      where: { slug, status: "PUBLISHED" },
      data: { views: { increment: 1 } },
    });
    if (result.count === 0) return Response.json({ ok: true, counted: false });

    const row = await prisma.article.findUnique({ where: { slug }, select: { views: true } });
    return Response.json({ ok: true, counted: true, views: row?.views ?? null });
  } catch {
    // Sayaç ikincil bir işlev; DB'ye ulaşılamadığında ziyaretçiye hata göstermenin anlamı yok.
    return Response.json({ ok: false }, { status: 200 });
  }
}
