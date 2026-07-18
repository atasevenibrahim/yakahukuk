import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function logAudit(entry: {
  actorId?: string | null;
  action: string;
  module: string;
  entityId?: string | null;
}): Promise<void> {
  const headerList = await headers();
  await prisma.auditLog.create({
    data: {
      actorId: entry.actorId ?? null,
      action: entry.action,
      module: entry.module,
      entityId: entry.entityId ?? null,
      ip: headerList.get("x-forwarded-for"),
      userAgent: headerList.get("user-agent"),
    },
  });
}
