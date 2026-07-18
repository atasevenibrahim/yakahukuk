import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/admin/giris");

  const [newMessageCount, pendingAppointmentCount] = await Promise.all([
    prisma.contactMessage.count({ where: { status: "NEW" } }),
    prisma.appointment.count({ where: { status: "PENDING" } }),
  ]);

  return (
    <div className="flex min-h-screen">
      <AdminSidebar
        newMessageCount={newMessageCount}
        pendingAppointmentCount={pendingAppointmentCount}
      />
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
