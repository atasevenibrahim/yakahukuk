"use server";

import { revalidatePath } from "next/cache";
import argon2 from "argon2";
import { prisma } from "@/lib/prisma";
import { requireSessionUser, destroyAllSessionsForUser } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";
import { passwordStrength } from "@/lib/auth/password-strength";
import { generateTotpSecret, totpQrDataUrl, verifyTotpToken, generateBackupCodes } from "@/lib/auth/totp";
import { encryptSecret } from "@/lib/auth/crypto";
import { logAudit } from "@/lib/auth/audit";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function updateName(name: string): Promise<ActionResult> {
  const user = await requireSessionUser();
  const trimmed = name.trim();
  if (trimmed.length < 2) {
    return { ok: false, error: "Ad soyad en az 2 karakter olmalı." };
  }
  await prisma.user.update({ where: { id: user.id }, data: { name: trimmed } });
  await logAudit({ actorId: user.id, action: "profile_updated", module: "PROFIL" });
  revalidatePath("/admin/profil");
  revalidatePath("/admin");
  return { ok: true };
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<ActionResult> {
  const user = await requireSessionUser();
  const valid = await argon2.verify(user.passwordHash, currentPassword).catch(() => false);
  if (!valid) {
    return { ok: false, error: "Mevcut şifre hatalı." };
  }
  if (passwordStrength(newPassword).score < 3) {
    return { ok: false, error: "Yeni şifre yeterince güçlü değil." };
  }
  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
  await logAudit({ actorId: user.id, action: "password_changed", module: "PROFIL" });
  await destroyAllSessionsForUser(user.id);
  return { ok: true };
}

export type Setup2FAResult = { secret: string; qrDataUrl: string };

export async function setup2FA(): Promise<Setup2FAResult> {
  const user = await requireSessionUser();
  const secret = generateTotpSecret();
  const qrDataUrl = await totpQrDataUrl(secret, user.email);
  return { secret, qrDataUrl };
}

export type Confirm2FAResult = { ok: true; backupCodes: string[] } | { ok: false; error: string };

export async function confirm2FA(secret: string, code: string): Promise<Confirm2FAResult> {
  const user = await requireSessionUser();
  const valid = await verifyTotpToken(secret, code);
  if (!valid) {
    return { ok: false, error: "Kod hatalı, tekrar deneyin." };
  }
  const backupCodes = generateBackupCodes(10);
  const backupCodeHashes = await Promise.all(
    backupCodes.map((c) => argon2.hash(c, { type: argon2.argon2id })),
  );
  await prisma.user.update({
    where: { id: user.id },
    data: {
      twoFAEnabled: true,
      twoFASecret: encryptSecret(secret),
      backupCodeHashes,
    },
  });
  await logAudit({ actorId: user.id, action: "2fa_enabled", module: "PROFIL" });
  revalidatePath("/admin/profil");
  return { ok: true, backupCodes };
}

export async function disable2FA(password: string): Promise<ActionResult> {
  const user = await requireSessionUser();
  const valid = await argon2.verify(user.passwordHash, password).catch(() => false);
  if (!valid) {
    return { ok: false, error: "Şifre hatalı." };
  }
  await prisma.user.update({
    where: { id: user.id },
    data: { twoFAEnabled: false, twoFASecret: null, backupCodeHashes: [] },
  });
  await logAudit({ actorId: user.id, action: "2fa_disabled", module: "PROFIL" });
  revalidatePath("/admin/profil");
  return { ok: true };
}
