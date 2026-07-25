import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { istanbulDateKey, dateFromKey } from "@/lib/booking";
import { getArticlesRaw } from "@/content/articles";
import { getPracticeAreasRaw } from "@/content/practice-areas";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import {
  timeAgo,
  relativeDayLabel,
  initialsFromName,
  messageStatusBadge,
  appointmentStatusBadge,
  describeAuditAction,
} from "@/lib/admin/format";

export const metadata: Metadata = { title: "Dashboard" };

export default async function AdminDashboardPage() {
  const user = await getSessionUser();
  const todayStart = dateFromKey(istanbulDateKey(new Date()));

  const [
    pendingAppointmentCount,
    pendingCreatedTodayCount,
    newMessageCount,
    latestNewMessage,
    recentMessages,
    recentAppointments,
    upcomingAppointments,
    auditEntries,
    articles,
    practiceAreas,
  ] = await Promise.all([
    prisma.appointment.count({ where: { status: "PENDING" } }),
    prisma.appointment.count({ where: { status: "PENDING", createdAt: { gte: todayStart } } }),
    prisma.contactMessage.count({ where: { status: "NEW" } }),
    prisma.contactMessage.findFirst({ where: { status: "NEW" }, orderBy: { createdAt: "desc" } }),
    prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.appointment.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.appointment.findMany({
      where: { status: { in: ["PENDING", "CONFIRMED"] }, date: { gte: todayStart } },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
      take: 3,
    }),
    prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 4 }),
    getArticlesRaw(),
    getPracticeAreasRaw(),
  ]);

  // Kart alt yazıları önceden sabit "Tümü yayında" yazıyordu — taslak varken bile. Artık
  // gerçek sayılar okunuyor. (`getArticlesRaw`/`getPracticeAreasRaw` yalnızca yayındakileri
  // döndürdüğü için taslak/gizli sayısı ayrıca sorgulanmalı.)
  const [draftArticleCount, scheduledArticleCount, hiddenAreaCount] = await Promise.all([
    prisma.article.count({ where: { status: "DRAFT" } }),
    prisma.article.count({ where: { status: "SCHEDULED" } }),
    prisma.practiceArea.count({ where: { published: false } }),
  ]);

  const articleSubtitle = [
    draftArticleCount > 0 ? `${draftArticleCount} taslak` : null,
    scheduledArticleCount > 0 ? `${scheduledArticleCount} zamanlanmış` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const areaLabel = (slug: string | null) =>
    slug ? (practiceAreas.find((a) => a.slug === slug)?.t.tr.title ?? slug) : null;

  const combinedRequests = [
    ...recentMessages.map((m) => ({
      id: m.id,
      kind: "message" as const,
      kim: m.name,
      konu: "İletişim formu",
      ozet: m.subject,
      badge: messageStatusBadge(m.status),
      createdAt: m.createdAt,
    })),
    ...recentAppointments.map((a) => ({
      id: a.id,
      kind: "appointment" as const,
      kim: a.name,
      konu: "Randevu talebi",
      ozet: `${areaLabel(a.practiceAreaSlug) ?? "Genel"} · ${new Intl.DateTimeFormat("tr-TR", {
        timeZone: "Europe/Istanbul",
        day: "2-digit",
        month: "short",
      })
        .format(a.date)
        .toUpperCase()} ${a.startTime} slotu için`,
      badge: appointmentStatusBadge(a.status),
      createdAt: a.createdAt,
    })),
  ]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 5);

  const cards = [
    {
      etiket: "BEKLEYEN RANDEVU",
      sayi: String(pendingAppointmentCount).padStart(2, "0"),
      alt: pendingCreatedTodayCount > 0 ? `${pendingCreatedTodayCount} tanesi bugün geldi` : "Bugün yeni yok",
      vurgu: pendingAppointmentCount > 0 ? "#9C7C4A" : "transparent",
      altRenk: pendingAppointmentCount > 0 ? "#9C7C4A" : "#5B6270",
      href: "/admin/randevular",
    },
    {
      etiket: "YENİ MESAJ",
      sayi: String(newMessageCount).padStart(2, "0"),
      alt: latestNewMessage ? `Son: ${timeAgo(latestNewMessage.createdAt)} önce` : "Bekleyen yok",
      vurgu: newMessageCount > 0 ? "#9C7C4A" : "transparent",
      altRenk: newMessageCount > 0 ? "#9C7C4A" : "#5B6270",
      href: "/admin/gelen-talepler",
    },
    {
      etiket: "YAYINDAKİ MAKALE",
      sayi: String(articles.length).padStart(2, "0"),
      alt: articleSubtitle || "Taslak yok",
      vurgu: "transparent",
      altRenk: articleSubtitle ? "#9C7C4A" : "#5B6270",
      href: "/admin/makaleler",
    },
    {
      etiket: "ÇALIŞMA ALANI",
      sayi: String(practiceAreas.length).padStart(2, "0"),
      alt: hiddenAreaCount > 0 ? `${hiddenAreaCount} yayında değil` : "Tümü yayında",
      vurgu: "transparent",
      altRenk: hiddenAreaCount > 0 ? "#9C7C4A" : "#5B6270",
      href: "/admin/icerik/calisma-alanlari",
    },
  ];

  return (
    <>
      <AdminTopbar
        title="Dashboard"
        userName={user?.name ?? "Yönetici"}
        notificationCount={newMessageCount}
      />
      <div className="flex flex-1 flex-col gap-6 p-8">
        <div className="grid grid-cols-2 gap-[18px] lg:grid-cols-4">
          {cards.map((k) => {
            const inner = (
              <>
                <span className="font-mono text-[10.5px] tracking-[2px] text-muted">{k.etiket}</span>
                <div className="mt-2 font-mono text-[38px] font-medium leading-none text-ink">
                  {k.sayi}
                </div>
                <span className="mt-2.5 inline-block text-[12.5px]" style={{ color: k.altRenk }}>
                  {k.alt}
                </span>
              </>
            );
            const className =
              "block rounded-md border border-line bg-surface px-6 py-[22px] shadow-[0_1px_2px_rgba(28,34,48,0.05)] transition-all";
            return k.href ? (
              <Link
                key={k.etiket}
                href={k.href}
                className={`${className} hover:-translate-y-0.5 hover:shadow-[0_4px_14px_rgba(28,34,48,0.09)]`}
                style={{ borderTopWidth: 2, borderTopColor: k.vurgu }}
              >
                {inner}
              </Link>
            ) : (
              <div
                key={k.etiket}
                className={className}
                style={{ borderTopWidth: 2, borderTopColor: k.vurgu }}
              >
                {inner}
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div className="rounded-md border border-line bg-surface shadow-[0_1px_2px_rgba(28,34,48,0.05)]">
            <div className="flex items-center justify-between border-b border-line px-6 py-[18px]">
              <h2 className="m-0 text-[15px] font-bold">Son gelen talepler</h2>
              <Link href="/admin/gelen-talepler" className="text-[13px] font-semibold text-gold">
                Tümünü gör →
              </Link>
            </div>
            <div className="flex flex-col">
              {combinedRequests.length === 0 && (
                <p className="px-6 py-8 text-center text-sm text-muted">Henüz gelen talep yok.</p>
              )}
              {combinedRequests.map((t) => (
                <Link
                  key={`${t.kind}-${t.id}`}
                  href="/admin/gelen-talepler"
                  className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-3.5 border-b border-cream px-6 py-3.5 transition-colors hover:bg-[#FAF8F3]"
                >
                  <span className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-cream text-[12px] font-bold text-muted">
                    {initialsFromName(t.kim)}
                  </span>
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="overflow-hidden text-ellipsis whitespace-nowrap text-[13.5px] font-semibold">
                      {t.kim} — {t.konu}
                    </span>
                    <span className="overflow-hidden text-ellipsis whitespace-nowrap text-xs text-muted">
                      {t.ozet}
                    </span>
                  </span>
                  <span
                    className="rounded-full border px-2.5 py-1 font-mono text-[9.5px] tracking-[1.5px]"
                    style={{ color: t.badge.color, borderColor: t.badge.border, background: t.badge.bg }}
                  >
                    {t.badge.label}
                  </span>
                  <span className="font-mono text-[11px] text-muted">{timeAgo(t.createdAt)}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="rounded-md border border-line bg-surface shadow-[0_1px_2px_rgba(28,34,48,0.05)]">
              <div className="flex items-center justify-between border-b border-line px-6 py-[18px]">
                <h2 className="m-0 text-[15px] font-bold">Yaklaşan randevular</h2>
                <Link href="/admin/randevular" className="text-[13px] font-semibold text-gold">
                  Takvim →
                </Link>
              </div>
              <div className="flex flex-col">
                {upcomingAppointments.length === 0 && (
                  <p className="px-6 py-8 text-center text-sm text-muted">Yaklaşan randevu yok.</p>
                )}
                {upcomingAppointments.map((r) => (
                  <div key={r.id} className="flex items-center gap-3.5 border-b border-cream px-6 py-3.5">
                    <span className="flex w-12 flex-none flex-col items-center rounded border border-line bg-cream py-1.5">
                      <span className="font-mono text-[9px] tracking-[1.5px] text-gold">
                        {relativeDayLabel(r.date)}
                      </span>
                      <span className="font-mono text-[15px] font-medium">{r.startTime}</span>
                    </span>
                    <span className="flex min-w-0 flex-col gap-0.5">
                      <span className="text-[13.5px] font-semibold">{r.name}</span>
                      <span className="text-xs text-muted">
                        {areaLabel(r.practiceAreaSlug) ?? "Genel"} · ön görüşme
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-md border border-line bg-surface p-6 shadow-[0_1px_2px_rgba(28,34,48,0.05)]">
              <h2 className="m-0 mb-3.5 text-[15px] font-bold">Hızlı eylemler</h2>
              <div className="grid grid-cols-2 gap-2.5">
                <Link
                  href="/admin/randevular"
                  className="rounded border border-line bg-[#FAF8F3] px-2 py-3 text-center text-[13px] font-semibold transition-colors hover:border-gold hover:text-gold"
                >
                  Müsaitlik ayarla
                </Link>
                <span className="cursor-not-allowed rounded border border-line bg-[#FAF8F3] px-2 py-3 text-center text-[13px] font-semibold text-muted/50">
                  + Yeni makale
                </span>
                <span className="cursor-not-allowed rounded border border-line bg-[#FAF8F3] px-2 py-3 text-center text-[13px] font-semibold text-muted/50">
                  + Ekip üyesi
                </span>
                <span className="cursor-not-allowed rounded border border-line bg-[#FAF8F3] px-2 py-3 text-center text-[13px] font-semibold text-muted/50">
                  Ayarlar
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-md border border-line bg-surface shadow-[0_1px_2px_rgba(28,34,48,0.05)]">
          <div className="flex items-center justify-between border-b border-line px-6 py-[18px]">
            <h2 className="m-0 text-[15px] font-bold">Son işlem kayıtları</h2>
            <span className="text-[13px] font-semibold text-muted/50">Audit log →</span>
          </div>
          <div className="flex flex-col">
            {auditEntries.length === 0 && (
              <p className="px-6 py-8 text-center text-sm text-muted">Henüz işlem kaydı yok.</p>
            )}
            {auditEntries.map((i) => (
              <div
                key={i.id}
                className="grid grid-cols-[150px_1fr_120px] items-baseline gap-4 border-b border-cream px-6 py-3"
              >
                <span className="font-mono text-[11px] text-muted">
                  {new Intl.DateTimeFormat("tr-TR", {
                    timeZone: "Europe/Istanbul",
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  }).format(i.createdAt)}
                </span>
                <span className="text-[13.5px]">
                  <span className="font-semibold">{user?.name ?? "Yönetici"}</span>{" "}
                  <span className="text-muted">{describeAuditAction(i.action)}</span>
                </span>
                <span className="text-right font-mono text-[10px] tracking-[1px] text-gold">
                  {i.module}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
