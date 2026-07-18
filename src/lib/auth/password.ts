import argon2 from "argon2";

export { passwordStrength } from "./password-strength";

export async function hashPassword(plain: string): Promise<string> {
  return argon2.hash(plain, { type: argon2.argon2id });
}

export async function verifyPassword(hash: string, plain: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, plain);
  } catch {
    return false;
  }
}

/** Rastgele, güçlü bir şifre üretir (yalnızca bir kerelik admin seed'i için). */
export function generateStrongPassword(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const digits = "23456789";
  const symbols = "!@#$%^&*-_+=";
  const all = upper + lower + digits + symbols;

  const randomFrom = (set: string) => set[Math.floor(Math.random() * set.length)];
  const required = [randomFrom(upper), randomFrom(lower), randomFrom(digits), randomFrom(symbols)];
  const rest = Array.from({ length: 12 }, () => randomFrom(all));
  const chars = [...required, ...rest];
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}
