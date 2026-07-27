import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import {
  NEWSLETTER_CONSENT_TEXT,
  NEWSLETTER_CONSENT_VERSION,
  NEWSLETTER_SENDING_ENABLED,
} from "@/lib/newsletter/consent";
import { BultenBrowser } from "./BultenBrowser";

export const metadata: Metadata = { title: "Bülten" };

export default async function AdminBultenPage() {
  const [user, rows] = await Promise.all([
    getSessionUser(),
    prisma.newsletterSubscriber.findMany({ orderBy: { createdAt: "desc" }, take: 1000 }),
  ]);

  const subscribers = rows.map((r) => ({
    id: r.id,
    email: r.email,
    consentVersion: r.consentVersion,
    consentAt: r.consentAt.toISOString(),
    unsubscribedAt: r.unsubscribedAt?.toISOString() ?? null,
    ip: r.ip,
  }));

  return (
    <>
      <AdminTopbar
        eyebrow="PANEL / BÜLTEN"
        title="Bülten Aboneleri"
        userName={user?.name ?? "Yönetici"}
      />
      <BultenBrowser
        subscribers={subscribers}
        sendingEnabled={NEWSLETTER_SENDING_ENABLED}
        consentText={NEWSLETTER_CONSENT_TEXT}
        consentVersion={NEWSLETTER_CONSENT_VERSION}
      />
    </>
  );
}
