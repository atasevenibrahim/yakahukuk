"use server";

import { redirect } from "next/navigation";
import { getSessionUser, destroySession } from "@/lib/auth/session";
import { logAudit } from "@/lib/auth/audit";

export async function logout(): Promise<void> {
  const user = await getSessionUser();
  await destroySession();
  if (user) {
    await logAudit({ actorId: user.id, action: "logout", module: "AUTH" });
  }
  redirect("/admin/giris");
}
