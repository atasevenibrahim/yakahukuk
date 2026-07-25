import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function logAudit(entry: {
  actorId?: string | null;
  action: string;
  module: string;
  entityId?: string | null;
  /** Serbest metin ek bilgi — ör. AI çağrılarının token kullanımı. */
  detail?: string | null;
  /**
   * İstek başlıkları. Normalde `headers()` ile okunur; ancak akışlı bir Route Handler'da
   * `ReadableStream` geri çağrısı yanıt gönderilmeye başladıktan sonra çalıştığı için istek
   * bağlamı orada güvenilir değil. Bu durumda değerler baştan okunup buradan geçirilir.
   */
  request?: RequestInfo;
}): Promise<void> {
  const source = entry.request ?? (await readRequestInfo());
  await prisma.auditLog.create({
    data: {
      actorId: entry.actorId ?? null,
      action: entry.action,
      module: entry.module,
      entityId: entry.entityId ?? null,
      detail: entry.detail ?? null,
      ip: source.ip,
      userAgent: source.userAgent,
      location: source.location,
    },
  });
}

export type RequestInfo = {
  ip: string | null;
  userAgent: string | null;
  location: string | null;
};

/**
 * Vercel'in edge katmanı her isteğe coğrafya başlıkları ekler. Bunları okumak harici bir
 * geo-IP servisine sormaktan iyi: bedava, ek gecikme yok ve yöneticinin IP'si üçüncü bir
 * tarafa gitmiyor. Yerelde bu başlıklar olmadığı için null döner ve arayüzde "Yerel ağ" yazar.
 */
function readLocation(headerList: Headers): string | null {
  const decode = (value: string | null) => {
    if (!value) return null;
    // Vercel şehir adlarını yüzde-kodlu gönderiyor (ör. "Istanbul" → "Istanbul", "Şile" → "%C5%9Eile").
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  };

  const city = decode(headerList.get("x-vercel-ip-city"));
  const region = decode(headerList.get("x-vercel-ip-country-region"));
  const country = decode(headerList.get("x-vercel-ip-country"));

  const parts = [city, city ? country : region ?? country].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : null;
}

/** İstek bağlamının hâlâ erişilebilir olduğu bir noktada çağrılıp `logAudit`'e taşınabilir. */
export async function readRequestInfo(): Promise<RequestInfo> {
  const headerList = await headers();
  return {
    // x-forwarded-for zincir olabilir ("gerçek istemci, proxy1, proxy2"); ilki istemcidir.
    ip: headerList.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
    userAgent: headerList.get("user-agent"),
    location: readLocation(headerList),
  };
}
