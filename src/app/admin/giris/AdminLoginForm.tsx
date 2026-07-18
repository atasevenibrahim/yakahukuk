"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import logo from "../../../../public/yaka-logo.png";
import { passwordStrength } from "@/lib/auth/password-strength";
import {
  loginWithPassword,
  verifyTwoFactorCode,
  verifyBackupCode,
  requestPasswordReset,
  resetPasswordWithToken,
} from "./actions";

type Screen = "giris" | "2fa" | "s1" | "s2" | "s3" | "basari";

const inputClass =
  "h-[46px] rounded border border-line bg-surface px-3.5 font-sans text-[14.5px] text-ink outline-none focus:border-gold focus:shadow-[0_2px_8px_rgba(156,124,74,0.12)] box-border";

export function AdminLoginForm({ initialResetToken }: { initialResetToken?: string }) {
  const router = useRouter();
  const [screen, setScreen] = useState<Screen>(initialResetToken ? "s3" : "giris");

  // Adım 1
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Adım 2 (2FA)
  const [codeDigits, setCodeDigits] = useState(["", "", "", "", "", ""]);
  const [twoFaError, setTwoFaError] = useState<string | null>(null);
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [backupCode, setBackupCode] = useState("");
  const boxRefs = useRef<Array<HTMLInputElement | null>>([]);

  // Şifremi unuttum
  const [resetEmail, setResetEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPassword2, setNewPassword2] = useState("");
  const [resetError, setResetError] = useState<string | null>(null);

  async function handleLoginSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setGeneralError(null);
    const result = await loginWithPassword(email, password, remember);
    setSubmitting(false);
    if (result.step === "error") {
      setGeneralError(
        result.locked
          ? "Çok fazla başarısız deneme. Lütfen birkaç dakika sonra tekrar deneyin."
          : "E-posta veya şifre hatalı. Lütfen tekrar deneyin.",
      );
      return;
    }
    if (result.step === "2fa") {
      setScreen("2fa");
      return;
    }
    setScreen("basari");
    router.refresh();
    setTimeout(() => router.push("/admin"), 900);
  }

  async function handleVerify() {
    setSubmitting(true);
    setTwoFaError(null);
    const result = useBackupCode
      ? await verifyBackupCode(backupCode, remember)
      : await verifyTwoFactorCode(codeDigits.join(""), remember);
    setSubmitting(false);
    if (!result.ok) {
      if (result.expired) {
        setTwoFaError("Oturum süresi doldu, lütfen tekrar giriş yapın.");
        setScreen("giris");
        return;
      }
      setTwoFaError(
        result.locked
          ? "Çok fazla başarısız deneme. Lütfen birkaç dakika sonra tekrar deneyin."
          : "Kod hatalı.",
      );
      setCodeDigits(["", "", "", "", "", ""]);
      boxRefs.current[0]?.focus();
      return;
    }
    setScreen("basari");
    router.refresh();
    setTimeout(() => router.push("/admin"), 900);
  }

  async function handleResetRequest(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await requestPasswordReset(resetEmail);
    setSubmitting(false);
    setScreen("s2");
  }

  async function handleSetNewPassword(e: FormEvent) {
    e.preventDefault();
    if (!initialResetToken) return;
    if (newPassword !== newPassword2) return;
    setSubmitting(true);
    setResetError(null);
    const result = await resetPasswordWithToken(initialResetToken, newPassword);
    setSubmitting(false);
    if (!result.ok) {
      setResetError(
        result.reason === "invalid"
          ? "Bağlantının süresi dolmuş ya da geçersiz. Yeniden talep edin."
          : "Şifre yeterince güçlü değil.",
      );
      return;
    }
    setScreen("basari");
  }

  const strength = passwordStrength(newPassword);
  const passwordsMismatch = newPassword2.length > 0 && newPassword !== newPassword2;
  const canSave = strength.score >= 3 && newPassword === newPassword2 && newPassword.length > 0;

  return (
    <div
      className="flex min-h-screen items-center justify-center px-6 py-12"
      style={{
        background:
          "repeating-linear-gradient(45deg, #F6F3EC 0, #F6F3EC 60px, #F3EFE6 60px, #F3EFE6 120px)",
      }}
    >
      <div className="w-full max-w-[440px]">
        <div className="mb-7 text-center">
          <Image src={logo} alt="YAKA logo" width={64} height={64} className="mx-auto object-contain" />
          <div className="mt-2.5 font-serif text-[26px] font-semibold tracking-[3px]">YAKA</div>
          <div className="mt-1 font-mono text-[10px] tracking-[3px] text-muted">YÖNETİM PANELİ</div>
        </div>

        <div className="rounded-md border border-line border-t-2 border-t-gold bg-surface p-9 shadow-[0_2px_4px_rgba(28,34,48,0.06),0_16px_40px_rgba(28,34,48,0.08)]">
          {screen === "giris" && (
            <form onSubmit={handleLoginSubmit}>
              <h1 className="m-0 mb-1.5 font-serif text-[28px] font-medium">Yönetici girişi</h1>
              <p className="m-0 mb-6 text-sm text-muted">
                Devam etmek için hesabınızla oturum açın.
              </p>
              {generalError && (
                <div className="mb-5 rounded border border-[#E8C5C1] bg-[#FBF1F0] px-4 py-3">
                  <p className="m-0 text-[13.5px] text-[#A23A32]">{generalError}</p>
                </div>
              )}
              <div className="flex flex-col gap-[18px]">
                <div className="flex flex-col gap-[7px]">
                  <label className="text-[13.5px] font-semibold">E-posta</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@yakahukuk.com"
                    className={inputClass}
                    required
                  />
                </div>
                <div className="flex flex-col gap-[7px]">
                  <div className="flex items-baseline justify-between">
                    <label className="text-[13.5px] font-semibold">Şifre</label>
                    <button
                      type="button"
                      onClick={() => setScreen("s1")}
                      className="cursor-pointer border-b border-gold bg-transparent text-[12.5px] font-semibold text-gold"
                    >
                      Şifremi unuttum
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`${inputClass} w-full pr-[52px]`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label="Şifreyi göster/gizle"
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 cursor-pointer bg-transparent p-2 font-mono text-[10px] tracking-[1px] text-muted hover:text-gold"
                    >
                      {showPassword ? "GİZLE" : "GÖSTER"}
                    </button>
                  </div>
                </div>
                <div className="flex h-[66px] items-center justify-center rounded border border-dashed border-line bg-[#FAF8F3]">
                  <span className="font-mono text-[11px] tracking-[1px] text-muted">
                    [ CAPTCHA doğrulaması ]
                  </span>
                </div>
                <label className="flex cursor-pointer items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-[17px] w-[17px] cursor-pointer accent-gold"
                  />
                  <span className="text-[13.5px] text-muted">Beni hatırla</span>
                </label>
                <button
                  type="submit"
                  disabled={submitting}
                  className="cursor-pointer rounded bg-ink py-3.5 font-sans text-[15px] font-semibold text-cream transition-colors hover:bg-gold disabled:opacity-70"
                >
                  {submitting ? "Kontrol ediliyor…" : "Giriş Yap"}
                </button>
              </div>
            </form>
          )}

          {screen === "2fa" && (
            <div>
              <h1 className="m-0 mb-1.5 font-serif text-[28px] font-medium">
                Doğrulama kodunu girin
              </h1>
              <p className="m-0 mb-6 text-sm leading-relaxed text-muted">
                {useBackupCode
                  ? "Yedek kodlarınızdan birini girin."
                  : "Kimlik doğrulayıcı uygulamanızdaki 6 haneli kodu girin."}
              </p>
              {twoFaError && (
                <div className="mb-5 rounded border border-[#E8C5C1] bg-[#FBF1F0] px-4 py-3">
                  <p className="m-0 text-[13.5px] text-[#A23A32]">{twoFaError}</p>
                </div>
              )}
              {!useBackupCode ? (
                <div className="flex justify-center gap-2.5">
                  {codeDigits.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => {
                        boxRefs.current[i] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, "").slice(-1);
                        setCodeDigits((prev) => {
                          const next = [...prev];
                          next[i] = v;
                          return next;
                        });
                        setTwoFaError(null);
                        if (v && i < 5) boxRefs.current[i + 1]?.focus();
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Backspace" && !codeDigits[i] && i > 0) {
                          boxRefs.current[i - 1]?.focus();
                        }
                      }}
                      className="h-[58px] w-[46px] rounded border border-line bg-surface text-center font-mono text-2xl text-ink outline-none focus:border-gold focus:shadow-[0_2px_8px_rgba(156,124,74,0.12)] sm:w-[50px]"
                    />
                  ))}
                </div>
              ) : (
                <input
                  type="text"
                  value={backupCode}
                  onChange={(e) => {
                    setBackupCode(e.target.value);
                    setTwoFaError(null);
                  }}
                  placeholder="XXXX-XXXX"
                  className={`${inputClass} w-full text-center font-mono uppercase`}
                />
              )}
              <button
                type="button"
                onClick={handleVerify}
                disabled={submitting}
                className="mt-[26px] w-full cursor-pointer rounded bg-ink py-3.5 font-sans text-[15px] font-semibold text-cream transition-colors hover:bg-gold disabled:opacity-70"
              >
                {submitting ? "Doğrulanıyor…" : "Doğrula"}
              </button>
              <div className="mt-5 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setUseBackupCode((v) => !v);
                    setTwoFaError(null);
                  }}
                  className="cursor-pointer border-b border-gold bg-transparent text-[13px] font-semibold text-gold"
                >
                  {useBackupCode ? "Kod uygulamasına dön" : "Yedek kod kullan"}
                </button>
              </div>
            </div>
          )}

          {screen === "s1" && (
            <form onSubmit={handleResetRequest}>
              <h1 className="m-0 mb-1.5 font-serif text-[28px] font-medium">Şifre sıfırlama</h1>
              <p className="m-0 mb-6 text-sm leading-relaxed text-muted">
                Hesabınıza bağlı e-posta adresini girin; sıfırlama bağlantısı gönderelim.
              </p>
              <div className="flex flex-col gap-[18px]">
                <div className="flex flex-col gap-[7px]">
                  <label className="text-[13.5px] font-semibold">E-posta</label>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="admin@yakahukuk.com"
                    className={inputClass}
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="cursor-pointer rounded bg-ink py-3.5 font-sans text-[15px] font-semibold text-cream transition-colors hover:bg-gold disabled:opacity-70"
                >
                  {submitting ? "Gönderiliyor…" : "Bağlantı Gönder"}
                </button>
                <button
                  type="button"
                  onClick={() => setScreen("giris")}
                  className="cursor-pointer bg-transparent text-[13.5px] font-semibold text-muted transition-colors hover:text-gold"
                >
                  ← Girişe dön
                </button>
              </div>
            </form>
          )}

          {screen === "s2" && (
            <div className="py-2 text-center">
              <span className="inline-flex h-[52px] w-[52px] items-center justify-center rounded-full border-[1.5px] border-[#3F7A5B] text-[22px] text-[#3F7A5B]">
                ✉
              </span>
              <h1 className="mt-[18px] font-serif text-[26px] font-medium">Bağlantı gönderildi.</h1>
              <p className="mt-2.5 text-sm leading-relaxed text-muted">
                E-postanızdaki bağlantıya tıklayarak yeni şifrenizi belirleyin. Bağlantı 30 dakika
                geçerlidir.
              </p>
              <button
                type="button"
                onClick={() => setScreen("giris")}
                className="mt-[22px] cursor-pointer rounded border border-gold bg-surface px-6 py-3 font-sans text-sm font-semibold text-ink transition-colors hover:bg-cream"
              >
                Girişe dön
              </button>
            </div>
          )}

          {screen === "s3" && (
            <form onSubmit={handleSetNewPassword}>
              <h1 className="m-0 mb-1.5 font-serif text-[28px] font-medium">
                Yeni şifre belirleyin
              </h1>
              <p className="m-0 mb-6 text-sm text-muted">
                Güçlü bir şifre seçin; daha önce kullandıklarınızdan farklı olsun.
              </p>
              {!initialResetToken && (
                <div className="mb-5 rounded border border-[#E8C5C1] bg-[#FBF1F0] px-4 py-3">
                  <p className="m-0 text-[13.5px] text-[#A23A32]">
                    Geçersiz bağlantı. Lütfen sıfırlama işlemini yeniden başlatın.
                  </p>
                </div>
              )}
              {resetError && (
                <div className="mb-5 rounded border border-[#E8C5C1] bg-[#FBF1F0] px-4 py-3">
                  <p className="m-0 text-[13.5px] text-[#A23A32]">{resetError}</p>
                </div>
              )}
              <div className="flex flex-col gap-[18px]">
                <div className="flex flex-col gap-[7px]">
                  <label className="text-[13.5px] font-semibold">Yeni şifre</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className={inputClass}
                  />
                  <div className="mt-1 flex gap-1.5">
                    {[1, 2, 3].map((tier) => (
                      <span
                        key={tier}
                        className="h-1 flex-1 rounded-full transition-colors"
                        style={{
                          background:
                            strength.score >= tier
                              ? strength.score === 3
                                ? "#3F7A5B"
                                : "#C08A3E"
                              : "#E4DFD5",
                        }}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 text-[13px] text-muted">
                  <span className="flex items-center gap-2">
                    <span style={{ color: strength.hasLength ? "#3F7A5B" : "#E4DFD5" }}>●</span>
                    En az 10 karakter
                  </span>
                  <span className="flex items-center gap-2">
                    <span style={{ color: strength.hasCase ? "#3F7A5B" : "#E4DFD5" }}>●</span>
                    Büyük ve küçük harf
                  </span>
                  <span className="flex items-center gap-2">
                    <span style={{ color: strength.hasNumberAndSymbol ? "#3F7A5B" : "#E4DFD5" }}>
                      ●
                    </span>
                    En az bir rakam ve özel karakter
                  </span>
                </div>
                <div className="flex flex-col gap-[7px]">
                  <label className="text-[13.5px] font-semibold">Yeni şifre (tekrar)</label>
                  <input
                    type="password"
                    value={newPassword2}
                    onChange={(e) => setNewPassword2(e.target.value)}
                    placeholder="••••••••"
                    className={inputClass}
                    style={{ borderColor: passwordsMismatch ? "#A23A32" : undefined }}
                  />
                  {passwordsMismatch && (
                    <span className="text-[12.5px] text-[#A23A32]">Şifreler eşleşmiyor.</span>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={!canSave || !initialResetToken || submitting}
                  className="cursor-pointer rounded py-3.5 font-sans text-[15px] font-semibold transition-colors disabled:cursor-not-allowed"
                  style={{
                    background: canSave && initialResetToken ? "#1C2230" : "#E4DFD5",
                    color: canSave && initialResetToken ? "#F6F3EC" : "#5B6270",
                  }}
                >
                  Şifreyi Kaydet
                </button>
              </div>
            </form>
          )}

          {screen === "basari" && (
            <div className="py-2 text-center">
              <span className="inline-flex h-[52px] w-[52px] items-center justify-center rounded-full border-[1.5px] border-[#3F7A5B] text-[22px] text-[#3F7A5B]">
                ✓
              </span>
              <h1 className="mt-[18px] font-serif text-[26px] font-medium">
                {newPassword ? "Şifreniz güncellendi." : "Giriş başarılı."}
              </h1>
              <p className="mt-2.5 text-sm leading-relaxed text-muted">
                {newPassword
                  ? "Yeni şifrenizle oturum açabilirsiniz."
                  : "Yönetim paneline yönlendiriliyorsunuz."}
              </p>
              <Link
                href={newPassword ? "/admin/giris" : "/admin"}
                className="mt-[22px] inline-block rounded bg-ink px-7 py-3.5 font-sans text-[14.5px] font-semibold text-cream transition-colors hover:bg-gold"
              >
                {newPassword ? "Girişe dön" : "Panele git →"}
              </Link>
            </div>
          )}
        </div>

        <p className="mt-6 text-center font-mono text-[11px] tracking-[1.5px] text-muted">
          GÜVENLİ BAĞLANTI ·{" "}
          <Link href="/tr" className="text-gold">
            SİTEYE DÖN
          </Link>
        </p>
      </div>
    </div>
  );
}
