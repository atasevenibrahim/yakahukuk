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
  request?: { ip: string | null; userAgent: string | null };
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
    },
  });
}

/** İstek bağlamının hâlâ erişilebilir olduğu bir noktada çağrılıp `logAudit`'e taşınabilir. */
export async function readRequestInfo(): Promise<{ ip: string | null; userAgent: string | null }> {
  const headerList = await headers();
  return {
    ip: headerList.get("x-forwarded-for"),
    userAgent: headerList.get("user-agent"),
  };
}
