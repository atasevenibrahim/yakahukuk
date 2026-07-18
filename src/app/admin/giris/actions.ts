"use server";

import { createHash, randomBytes } from "node:crypto";
import argon2 from "argon2";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { passwordStrength } from "@/lib/auth/password-strength";
import {
  createSession,
  createPending2FA,
  readPending2FA,
  clearPending2FA,
  destroyAllSessionsForUser,
} from "@/lib/auth/session";
import { isLockedOut, registerFailedAttempt, resetFailedAttempts } from "@/lib/auth/lockout";
import { verifyTotpToken } from "@/lib/auth/totp";
import { logAudit } from "@/lib/auth/audit";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

// --- Adım 1: e-posta + şifre ---

export type LoginResult =
  | { step: "2fa" }
  | { step: "success" }
  | { step: "error"; locked?: boolean };

export async function loginWithPassword(
  email: string,
  password: string,
  remember: boolean,
): Promise<LoginResult> {
  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });

  // Kullanıcı yoksa bile aynı genel hatayı döndür (enumeration engeli).
  if (!user) {
    return { step: "error" };
  }

  const lockStatus = await isLockedOut(user.id);
  if (lockStatus.locked) {
    return { step: "error", locked: true };
  }

  const valid = await argon2.verify(user.passwordHash, password).catch(() => false);
  if (!valid) {
    await registerFailedAttempt(user.id);
    await logAudit({ actorId: user.id, action: "login_failed", module: "AUTH" });
    return { step: "error" };
  }

  if (user.twoFAEnabled) {
    await createPending2FA(user.id);
    return { step: "2fa" };
  }

  await resetFailedAttempts(user.id);
  await createSession(user.id, remember);
  await logAudit({ actorId: user.id, action: "login", module: "AUTH" });
  return { step: "success" };
}

// --- Adım 2: TOTP / yedek kod doğrulama ---

export type TwoFactorResult =
  | { ok: true }
  | { ok: false; locked?: boolean; expired?: boolean };

export async function verifyTwoFactorCode(
  code: string,
  remember: boolean,
): Promise<TwoFactorResult> {
  const userId = await readPending2FA();
  if (!userId) return { ok: false, expired: true };

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { ok: false, expired: true };

  const lockStatus = await isLockedOut(user.id);
  if (lockStatus.locked) return { ok: false, locked: true };

  let valid = false;
  if (user.twoFASecret) {
    const { decryptSecret } = await import("@/lib/auth/crypto");
    valid = await verifyTotpToken(decryptSecret(user.twoFASecret), code);
  }

  if (!valid) {
    await registerFailedAttempt(user.id);
    await logAudit({ actorId: user.id, action: "2fa_failed", module: "AUTH" });
    return { ok: false };
  }

  await clearPending2FA();
  await resetFailedAttempts(user.id);
  await createSession(user.id, remember);
  await logAudit({ actorId: user.id, action: "login_2fa", module: "AUTH" });
  return { ok: true };
}

export async function verifyBackupCode(code: string, remember: boolean): Promise<TwoFactorResult> {
  const userId = await readPending2FA();
  if (!userId) return { ok: false, expired: true };

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { ok: false, expired: true };

  const lockStatus = await isLockedOut(user.id);
  if (lockStatus.locked) return { ok: false, locked: true };

  const normalized = code.trim().toUpperCase();
  let matchedHash: string | null = null;
  for (const hash of user.backupCodeHashes) {
    if (await argon2.verify(hash, normalized).catch(() => false)) {
      matchedHash = hash;
      break;
    }
  }

  if (!matchedHash) {
    await registerFailedAttempt(user.id);
    await logAudit({ actorId: user.id, action: "backup_code_failed", module: "AUTH" });
    return { ok: false };
  }

  // Kullanılan yedek kodu listeden çıkar (tek kullanımlık).
  await prisma.user.update({
    where: { id: user.id },
    data: { backupCodeHashes: user.backupCodeHashes.filter((h) => h !== matchedHash) },
  });

  await clearPending2FA();
  await resetFailedAttempts(user.id);
  await createSession(user.id, remember);
  await logAudit({ actorId: user.id, action: "login_backup_code", module: "AUTH" });
  return { ok: true };
}

// --- Şifremi unuttum ---

export async function requestPasswordReset(email: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  // Kullanıcı yoksa da sessizce çık — çağıran taraf her durumda aynı "gönderildi" ekranını gösterir.
  if (!user) return;

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
  await prisma.passwordResetToken.create({
    data: { userId: user.id, tokenHash: hashToken(token), expiresAt },
  });

  // Gerçek e-posta gönderimi henüz yok (sendMail hook'u ileride bağlanacak) —
  // spesifikasyondaki "dev-logger" ilkesiyle bağlantı yalnızca sunucu konsoluna yazılır.
  console.log(
    `[dev-logger] Şifre sıfırlama bağlantısı (${user.email}): /admin/giris?resetToken=${token}`,
  );
  await logAudit({ actorId: user.id, action: "password_reset_requested", module: "AUTH" });
}

export type ResetPasswordResult = { ok: true } | { ok: false; reason: "invalid" | "weak" };

export async function resetPasswordWithToken(
  token: string,
  newPassword: string,
): Promise<ResetPasswordResult> {
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
  });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return { ok: false, reason: "invalid" };
  }

  const strength = passwordStrength(newPassword);
  if (strength.score < 3) {
    return { ok: false, reason: "weak" };
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
  ]);

  await destroyAllSessionsForUser(record.userId);
  await logAudit({ actorId: record.userId, action: "password_reset", module: "AUTH" });
  return { ok: true };
}

export async function checkResetToken(token: string): Promise<boolean> {
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
  });
  return !!record && !record.usedAt && record.expiresAt > new Date();
}
