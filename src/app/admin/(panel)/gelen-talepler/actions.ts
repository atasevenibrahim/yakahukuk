"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSessionUser } from "@/lib/auth/session";
import { logAudit } from "@/lib/auth/audit";
import type { RequestStatus } from "@prisma/client";

export async function updateMessageStatus(id: string, status: RequestStatus): Promise<void> {
  const user = await requireSessionUser();
  await prisma.contactMessage.update({ where: { id }, data: { status } });
  await logAudit({
    actorId: user.id,
    action: "message_status_changed",
    module: "MESAJLAR",
    entityId: id,
  });
  revalidatePath("/admin/gelen-talepler");
  revalidatePath("/admin");
}

export async function saveMessageNote(id: string, note: string): Promise<void> {
  const user = await requireSessionUser();
  await prisma.contactMessage.update({ where: { id }, data: { internalNote: note } });
  await logAudit({
    actorId: user.id,
    action: "message_note_saved",
    module: "MESAJLAR",
    entityId: id,
  });
  revalidatePath("/admin/gelen-talepler");
}

export async function saveAppointmentNote(id: string, note: string): Promise<void> {
  const user = await requireSessionUser();
  await prisma.appointment.update({ where: { id }, data: { internalNote: note } });
  await logAudit({
    actorId: user.id,
    action: "message_note_saved",
    module: "RANDEVU",
    entityId: id,
  });
  revalidatePath("/admin/gelen-talepler");
}
