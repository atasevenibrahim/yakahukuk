import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

// User.twoFASecret gibi sırların DB'de şifreli tutulması için (spesifikasyonun
// "twoFASecret — şifreli sakla" gereği). Anahtar yalnızca sunucuda, env'de.
function getKey(): Buffer {
  const hex = process.env.TWOFA_ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error("TWOFA_ENCRYPTION_KEY eksik veya 32 byte (64 hex karakter) değil.");
  }
  return Buffer.from(hex, "hex");
}

/** AES-256-GCM ile şifreler; çıktı `iv:authTag:ciphertext` (hepsi hex). */
export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${ciphertext.toString("hex")}`;
}

export function decryptSecret(encrypted: string): string {
  const [ivHex, authTagHex, ciphertextHex] = encrypted.split(":");
  const decipher = createDecipheriv("aes-256-gcm", getKey(), Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));
  const plain = Buffer.concat([
    decipher.update(Buffer.from(ciphertextHex, "hex")),
    decipher.final(),
  ]);
  return plain.toString("utf8");
}
