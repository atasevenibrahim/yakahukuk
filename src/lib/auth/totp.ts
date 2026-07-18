import { generateSecret, generateURI, verify as verifyOtp } from "otplib";
import { randomBytes } from "node:crypto";
import QRCode from "qrcode";

const ISSUER = "YAKA Hukuk";

export function generateTotpSecret(): string {
  return generateSecret();
}

export function totpAuthUri(secret: string, email: string): string {
  return generateURI({ issuer: ISSUER, label: email, secret });
}

export async function totpQrDataUrl(secret: string, email: string): Promise<string> {
  return QRCode.toDataURL(totpAuthUri(secret, email));
}

/** 30 saniyelik pencere toleransıyla 6 haneli kodu doğrular. */
export async function verifyTotpToken(secret: string, token: string): Promise<boolean> {
  if (!/^\d{6}$/.test(token)) return false;
  const result = await verifyOtp({ secret, token, epochTolerance: 30 });
  return result.valid;
}

/** 10 adet okunaklı (karışmayan karakterler hariç) yedek kod üretir, örn. "XKPD-93QZ". */
export function generateBackupCodes(count = 10): string[] {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 0/O, 1/I hariç
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const bytes = randomBytes(8);
    let code = "";
    for (let b = 0; b < 8; b++) code += alphabet[bytes[b] % alphabet.length];
    codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
  }
  return codes;
}
