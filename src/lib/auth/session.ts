import { randomBytes, createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const COOKIE_NAME = "yaka_admin_session";
const PENDING_2FA_COOKIE = "yaka_admin_pending_2fa";
const DEFAULT_TTL_MS = 8 * 60 * 60 * 1000; // 8 saat
const REMEMBER_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 gün
const PENDING_2FA_TTL_MS = 5 * 60 * 1000; // 5 dakika

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Yeni oturum açar: opaque token üretir, DB'de yalnızca hash'ini tutar, httpOnly çerez yazar. */
export async function createSession(userId: string, remember: boolean): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const ttl = remember ? REMEMBER_TTL_MS : DEFAULT_TTL_MS;
  const expiresAt = new Date(Date.now() + ttl);

  await prisma.session.create({
    data: { userId, tokenHash: hashToken(token), expiresAt },
  });

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",
    expires: expiresAt,
  });
}

/** Geçerli oturumun kullanıcısını döner; yoksa/süresi dolmuşsa null. */
export async function getSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  return session.user;
}

/**
 * Admin mutasyon Server Action'larının başında çağrılır — layout guard'ı yalnızca
 * sayfa render'ını korur, Server Action'lar ağdan bağımsız çağrılabildiği için her
 * mutasyon kendi oturum kontrolünü de yapmalı.
 */
export async function requireSessionUser() {
  const user = await getSessionUser();
  if (!user) throw new Error("Yetkisiz erişim: oturum bulunamadı.");
  return user;
}

/** Oturumu kapatır: DB kaydını siler + çerezi temizler. */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  }
  cookieStore.delete(COOKIE_NAME);
}

/** Şifre değişince tüm oturumları iptal eder (spesifikasyonun "yetki değişince invalidasyon" gereği). */
export async function destroyAllSessionsForUser(userId: string): Promise<void> {
  await prisma.session.deleteMany({ where: { userId } });
}

function signPending(userId: string, expiresAt: number): string {
  const mac = createHmac("sha256", getPendingKey()).update(`${userId}.${expiresAt}`).digest("hex");
  return `${userId}.${expiresAt}.${mac}`;
}

function getPendingKey(): string {
  const key = process.env.TWOFA_ENCRYPTION_KEY;
  if (!key) throw new Error("TWOFA_ENCRYPTION_KEY eksik.");
  return key;
}

/**
 * Şifre doğrulandıktan sonra, 2FA adımı tamamlanana kadar "hangi kullanıcı
 * doğrulama bekliyor" bilgisini güvenli şekilde taşır (imzalı, kısa ömürlü,
 * httpOnly çerez — ayrı bir DB tablosu gerektirmez).
 */
export async function createPending2FA(userId: string): Promise<void> {
  const expiresAt = Date.now() + PENDING_2FA_TTL_MS;
  const cookieStore = await cookies();
  cookieStore.set(PENDING_2FA_COOKIE, signPending(userId, expiresAt), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",
    expires: new Date(expiresAt),
  });
}

export async function readPending2FA(): Promise<string | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(PENDING_2FA_COOKIE)?.value;
  if (!raw) return null;

  const [userId, expiresAtStr, mac] = raw.split(".");
  if (!userId || !expiresAtStr || !mac) return null;

  const expiresAt = Number(expiresAtStr);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return null;

  const expectedMac = createHmac("sha256", getPendingKey())
    .update(`${userId}.${expiresAt}`)
    .digest("hex");
  const macBuf = Buffer.from(mac, "hex");
  const expectedBuf = Buffer.from(expectedMac, "hex");
  if (macBuf.length !== expectedBuf.length || !timingSafeEqual(macBuf, expectedBuf)) {
    return null;
  }
  return userId;
}

export async function clearPending2FA(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(PENDING_2FA_COOKIE);
}
