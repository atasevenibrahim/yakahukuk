import { prisma } from "@/lib/prisma";

const MAX_ATTEMPTS = 5;
// Art arda başarısız denemede artan kilit süresi (dakika).
const LOCKOUT_MINUTES = [1, 5, 15, 60];

export async function isLockedOut(userId: string): Promise<{ locked: boolean; until?: Date }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { lockedUntil: true },
  });
  if (user?.lockedUntil && user.lockedUntil > new Date()) {
    return { locked: true, until: user.lockedUntil };
  }
  return { locked: false };
}

/** Başarısız girişi kaydeder; eşik aşılırsa artan süreyle kilitler. */
export async function registerFailedAttempt(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { failedLoginCount: true },
  });
  const nextCount = (user?.failedLoginCount ?? 0) + 1;

  let lockedUntil: Date | null = null;
  if (nextCount >= MAX_ATTEMPTS) {
    const tier = Math.min(nextCount - MAX_ATTEMPTS, LOCKOUT_MINUTES.length - 1);
    lockedUntil = new Date(Date.now() + LOCKOUT_MINUTES[tier] * 60 * 1000);
  }

  await prisma.user.update({
    where: { id: userId },
    data: { failedLoginCount: nextCount, lockedUntil },
  });
}

export async function resetFailedAttempts(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() },
  });
}
