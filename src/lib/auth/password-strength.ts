/**
 * Şifre gücü kontrolü — Admin Giriş mockup'ındaki kurallarla birebir:
 * en az 10 karakter, büyük+küçük harf, en az bir rakam ve özel karakter.
 * argon2 bağımlılığı yok — client bileşenlerinden de (şifre gücü göstergesi) güvenle import edilir.
 */
export function passwordStrength(value: string): {
  score: 0 | 1 | 2 | 3;
  hasLength: boolean;
  hasCase: boolean;
  hasNumberAndSymbol: boolean;
} {
  const hasLength = value.length >= 10;
  const hasCase = /[a-z]/.test(value) && /[A-Z]/.test(value);
  const hasNumberAndSymbol = /\d/.test(value) && /[^a-zA-Z0-9]/.test(value);
  const score = [hasLength, hasCase, hasNumberAndSymbol].filter(Boolean).length as 0 | 1 | 2 | 3;
  return { score, hasLength, hasCase, hasNumberAndSymbol };
}
