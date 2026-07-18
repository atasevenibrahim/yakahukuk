"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSessionUser } from "@/lib/auth/session";
import { logAudit } from "@/lib/auth/audit";

export type ActionResult = { ok: true } | { ok: false; error: string };

function isUniqueConstraintError(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
}

export async function confirmAppointment(id: string): Promise<ActionResult> {
  const user = await requireSessionUser();
  try {
    await prisma.appointment.update({ where: { id }, data: { status: "CONFIRMED" } });
  } catch (err) {
    if (isUniqueConstraintError(err)) {
      return { ok: false, error: "Bu slot için başka bir randevu zaten onaylanmış." };
    }
    throw err;
  }
  await logAudit({ actorId: user.id, action: "appointment_confirmed", module: "RANDEVU", entityId: id });
  revalidatePath("/admin/randevular");
  revalidatePath("/admin");
  revalidatePath("/admin/gelen-talepler");
  return { ok: true };
}

export async function rejectAppointment(id: string): Promise<ActionResult> {
  const user = await requireSessionUser();
  await prisma.appointment.update({ where: { id }, data: { status: "REJECTED" } });
  await logAudit({ actorId: user.id, action: "appointment_rejected", module: "RANDEVU", entityId: id });
  revalidatePath("/admin/randevular");
  revalidatePath("/admin");
  revalidatePath("/admin/gelen-talepler");
  return { ok: true };
}

export async function rescheduleAppointment(id: string): Promise<ActionResult> {
  const user = await requireSessionUser();
  await prisma.appointment.update({ where: { id }, data: { status: "RESCHEDULED" } });
  await logAudit({
    actorId: user.id,
    action: "appointment_rescheduled",
    module: "RANDEVU",
    entityId: id,
  });
  revalidatePath("/admin/randevular");
  revalidatePath("/admin");
  revalidatePath("/admin/gelen-talepler");
  return { ok: true };
}

export async function saveAvailability(weeklyOpen: boolean[], slotMinutes: number): Promise<void> {
  const user = await requireSessionUser();
  const existing = await prisma.availabilityRule.findMany();
  const byWeekday = new Map(existing.map((r) => [r.weekday, r]));

  for (let weekday = 0; weekday < 7; weekday++) {
    const open = weeklyOpen[weekday];
    const rule = byWeekday.get(weekday);
    if (rule) {
      await prisma.availabilityRule.update({
        where: { id: rule.id },
        data: { isActive: open, slotMinutes },
      });
    } else if (open) {
      await prisma.availabilityRule.create({
        data: {
          weekday,
          startTime: "09:00",
          endTime: "18:00",
          slotMinutes,
          bufferMinutes: 15,
          isActive: true,
        },
      });
    }
  }

  await logAudit({ actorId: user.id, action: "availability_saved", module: "RANDEVU" });
  revalidatePath("/admin/randevular");
}

export async function addBlockedDate(dateKey: string, reason: string): Promise<void> {
  const user = await requireSessionUser();
  await prisma.blockedDate.create({
    data: { date: new Date(`${dateKey}T00:00:00`), reason: reason.trim() || null },
  });
  await logAudit({ actorId: user.id, action: "blocked_date_added", module: "RANDEVU" });
  revalidatePath("/admin/randevular");
}

export async function removeBlockedDate(id: string): Promise<void> {
  const user = await requireSessionUser();
  await prisma.blockedDate.delete({ where: { id } });
  await logAudit({ actorId: user.id, action: "blocked_date_removed", module: "RANDEVU" });
  revalidatePath("/admin/randevular");
}
