"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { passwordStrength } from "@/lib/auth/password-strength";
import { updateName, changePassword, setup2FA, confirm2FA, disable2FA } from "./actions";
import { AdminToast } from "@/components/admin/AdminToast";

type RecentLogin = {
  id: string;
  device: string;
  ip: string;
  /** Vercel geo başlıklarından; yerelde "Yerel ağ". */
  location: string;
  time: string;
};
type TwoFAStage = "kapali" | "kurulum" | "yedek" | "aktif";

const inputClass =
  "h-[42px] rounded border border-line bg-surface px-3.5 text-[13.5px] text-ink outline-none focus:border-gold";

export function ProfilBrowser({
  name: initialName,
  email,
  twoFAEnabled,
  recentLogins,
}: {
  name: string;
  email: string;
  twoFAEnabled: boolean;
  recentLogins: RecentLogin[];
}) {
  const router = useRouter();
  const [toast, setToast] = useState<string | null>(null);

  const [name, setName] = useState(initialName);
  const [nameSaving, setNameSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSaving, setPasswordSaving] = useState(false);

  const [stage, setStage] = useState<TwoFAStage>(twoFAEnabled ? "aktif" : "kapali");
  const [pendingSecret, setPendingSecret] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [twoFAError, setTwoFAError] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [disablePassword, setDisablePassword] = useState("");
  const [showDisableForm, setShowDisableForm] = useState(false);

  function showToast(message: string) {
    setToast(message);
    setTimeout(() => setToast((current) => (current === message ? null : current)), 2500);
  }

  async function handleSaveName() {
    setNameSaving(true);
    const result = await updateName(name);
    setNameSaving(false);
    showToast(result.ok ? "Ad soyad güncellendi" : result.error);
    router.refresh();
  }

  async function handleChangePassword() {
    setPasswordError(null);
    setPasswordSaving(true);
    const result = await changePassword(currentPassword, newPassword);
    setPasswordSaving(false);
    if (!result.ok) {
      setPasswordError(result.error);
      return;
    }
    showToast("Şifreniz güncellendi, yeniden giriş yapmanız gerekiyor…");
    setTimeout(() => router.push("/admin/giris"), 1200);
  }

  async function handleStart2FA() {
    const result = await setup2FA();
    setPendingSecret(result.secret);
    setQrDataUrl(result.qrDataUrl);
    setStage("kurulum");
  }

  async function handleConfirm2FA() {
    setTwoFAError(null);
    const result = await confirm2FA(pendingSecret, totpCode);
    if (!result.ok) {
      setTwoFAError(result.error);
      return;
    }
    setBackupCodes(result.backupCodes);
    setStage("yedek");
  }

  function handleFinish2FASetup() {
    setStage("aktif");
    setTotpCode("");
    setBackupCodes([]);
    showToast("2FA etkinleştirildi");
    router.refresh();
  }

  async function handleDisable2FA() {
    setTwoFAError(null);
    const result = await disable2FA(disablePassword);
    if (!result.ok) {
      setTwoFAError(result.error);
      return;
    }
    setStage("kapali");
    setDisablePassword("");
    setShowDisableForm(false);
    showToast("2FA devre dışı bırakıldı");
    router.refresh();
  }

  const strength = passwordStrength(newPassword);
  const strengthColors = ["#E4DFD5", "#A23A32", "#C08A3E", "#3F7A5B"];
  const strengthLabels = ["", "ZAYIF", "ORTA", "GÜÇLÜ"];

  return (
    <div className="flex flex-1 flex-col gap-6 px-8 py-6">
      <div className="grid max-w-[1000px] grid-cols-1 items-start gap-5 lg:grid-cols-2">
        <div className="flex flex-col gap-5">
          <div className="rounded-md border border-line bg-surface p-6 shadow-[0_1px_2px_rgba(28,34,48,0.05)]">
            <h2 className="m-0 mb-[18px] text-sm font-bold">Hesap bilgileri</h2>
            <div className="mb-5 flex items-center gap-4">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-ink text-xl font-bold text-cream">
                {name
                  .split(" ")
                  .map((p) => p[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </span>
              <button
                type="button"
                onClick={() => showToast("Medya kütüphanesi eklendiğinde kullanılabilir olacak")}
                className="rounded border border-dashed border-gold px-4 py-2.5 text-xs font-semibold text-gold transition-colors hover:bg-[#FAF8F3]"
              >
                Avatar değiştir
              </button>
            </div>
            <div className="flex flex-col gap-3.5">
              <div className="flex flex-col gap-1.5">
                <label className="text-[12.5px] font-semibold">Ad Soyad</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12.5px] font-semibold">E-posta</label>
                <input
                  type="text"
                  value={email}
                  disabled
                  className={`${inputClass} cursor-not-allowed font-mono text-[12.5px] text-muted opacity-70`}
                />
              </div>
              <button
                type="button"
                onClick={handleSaveName}
                disabled={nameSaving || name.trim() === initialName}
                className="self-start rounded bg-ink px-5 py-2.5 text-[13px] font-semibold text-cream transition-colors hover:bg-gold disabled:opacity-50"
              >
                {nameSaving ? "Kaydediliyor…" : "Kaydet"}
              </button>
            </div>
          </div>

          <div className="rounded-md border border-line bg-surface p-6 shadow-[0_1px_2px_rgba(28,34,48,0.05)]">
            <h2 className="m-0 mb-4 text-sm font-bold">Şifre değiştir</h2>
            {passwordError && (
              <div className="mb-3.5 rounded border border-[#E8C5C1] bg-[#FBF1F0] px-3.5 py-2.5">
                <p className="m-0 text-[13px] text-[#A23A32]">{passwordError}</p>
              </div>
            )}
            <div className="flex flex-col gap-3.5">
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Mevcut şifre"
                className={inputClass}
              />
              <div className="flex flex-col gap-1.5">
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Yeni şifre"
                  className={inputClass}
                />
                <div className="flex gap-1.5">
                  {[1, 2, 3].map((tier) => (
                    <span
                      key={tier}
                      className="h-1 flex-1 rounded-full transition-colors"
                      style={{
                        background: strength.score >= tier ? strengthColors[strength.score] : "#E4DFD5",
                      }}
                    />
                  ))}
                </div>
                {newPassword && (
                  <span
                    className="font-mono text-[10.5px] tracking-[1px]"
                    style={{ color: strengthColors[strength.score] || "#5B6270" }}
                  >
                    {strengthLabels[strength.score]}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={handleChangePassword}
                disabled={passwordSaving || !currentPassword || strength.score < 3}
                className="rounded bg-ink py-3 text-[13.5px] font-semibold text-cream transition-colors hover:bg-gold disabled:opacity-50"
              >
                {passwordSaving ? "Güncelleniyor…" : "Şifreyi güncelle"}
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div className="rounded-md border border-line border-t-2 border-t-gold bg-surface p-6 shadow-[0_1px_2px_rgba(28,34,48,0.05)]">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="m-0 text-sm font-bold">İki adımlı doğrulama (2FA)</h2>
              <span
                className="rounded-full border px-2.5 py-[3px] font-mono text-[9px] tracking-[1px]"
                style={
                  stage === "aktif"
                    ? { color: "#3F7A5B", borderColor: "#CDE0D4", background: "rgba(63,122,91,.06)" }
                    : { color: "#5B6270", borderColor: "#E4DFD5", background: "transparent" }
                }
              >
                {stage === "aktif" ? "ETKİN" : "KAPALI"}
              </span>
            </div>

            {twoFAError && (
              <div className="mb-3.5 rounded border border-[#E8C5C1] bg-[#FBF1F0] px-3.5 py-2.5">
                <p className="m-0 text-[13px] text-[#A23A32]">{twoFAError}</p>
              </div>
            )}

            {stage === "kapali" && (
              <>
                <p className="m-0 mb-4 text-[13px] leading-relaxed text-muted">
                  Hesabınızı korumak için kimlik doğrulayıcı uygulamayla 2FA kurun.
                </p>
                <button
                  type="button"
                  onClick={handleStart2FA}
                  className="rounded bg-ink px-[22px] py-3 text-[13.5px] font-semibold text-cream transition-colors hover:bg-gold"
                >
                  2FA kurulumunu başlat
                </button>
              </>
            )}

            {stage === "kurulum" && (
              <div className="flex flex-wrap items-start gap-[18px]">
                {qrDataUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={qrDataUrl}
                    alt="2FA QR kodu"
                    width={132}
                    height={132}
                    className="flex-none rounded border border-line"
                  />
                )}
                <div className="flex min-w-[200px] flex-1 flex-col gap-2.5">
                  <p className="m-0 text-[12.5px] leading-relaxed text-muted">
                    1. QR kodu doğrulayıcı uygulamanızla tarayın.
                    <br />
                    2. Üretilen 6 haneli kodu girin.
                  </p>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    className={`${inputClass} text-center font-mono text-base tracking-[4px]`}
                  />
                  <button
                    type="button"
                    onClick={handleConfirm2FA}
                    disabled={totpCode.length !== 6}
                    className="rounded bg-ink py-2.5 text-[13px] font-semibold text-cream transition-colors hover:bg-gold disabled:opacity-50"
                  >
                    Doğrula ve etkinleştir
                  </button>
                </div>
              </div>
            )}

            {stage === "yedek" && (
              <>
                <div className="mb-3.5 rounded border border-gold/30 bg-gold/[0.06] px-4 py-3.5">
                  <p className="m-0 mb-2.5 text-[12.5px] font-bold text-gold">
                    ⚠ Yedek kodlarınız — yalnızca BİR KEZ gösterilir
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {backupCodes.map((code) => (
                      <span
                        key={code}
                        className="rounded border border-line bg-surface px-2.5 py-1.5 text-center font-mono text-[12.5px] tracking-[1px]"
                      >
                        {code}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleFinish2FASetup}
                  className="w-full rounded bg-ink py-2.5 text-[13px] font-semibold text-cream transition-colors hover:bg-gold"
                >
                  Kodları sakladım, bitir
                </button>
              </>
            )}

            {stage === "aktif" && (
              <>
                <p className="m-0 mb-3.5 text-[13px] leading-relaxed text-muted">
                  2FA etkin. Her girişte doğrulayıcı kodunuz istenir.
                </p>
                {!showDisableForm ? (
                  <button
                    type="button"
                    onClick={() => setShowDisableForm(true)}
                    className="rounded border border-[#E8C5C1] bg-surface px-4 py-2.5 text-xs font-semibold text-[#A23A32] transition-colors hover:bg-[#FBF1F0]"
                  >
                    2FA&apos;yı devre dışı bırak
                  </button>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    <input
                      type="password"
                      value={disablePassword}
                      onChange={(e) => setDisablePassword(e.target.value)}
                      placeholder="Şifrenizi girin"
                      className={inputClass}
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleDisable2FA}
                        className="rounded bg-[#A23A32] px-4 py-2.5 text-xs font-semibold text-white"
                      >
                        Onayla, devre dışı bırak
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowDisableForm(false)}
                        className="rounded border border-line px-4 py-2.5 text-xs font-semibold text-muted"
                      >
                        Vazgeç
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="rounded-md border border-line bg-surface shadow-[0_1px_2px_rgba(28,34,48,0.05)]">
            <h2 className="m-0 border-b border-line px-6 py-[18px] text-sm font-bold">
              Son girişler
            </h2>
            {recentLogins.length === 0 && (
              <p className="px-6 py-6 text-sm text-muted">Henüz kayıtlı giriş yok.</p>
            )}
            {recentLogins.map((g) => (
              <div
                key={g.id}
                className="grid grid-cols-[1fr_auto] items-baseline gap-3 border-b border-cream px-6 py-3"
              >
                <span className="flex flex-col gap-0.5">
                  <span className="text-[13px] font-semibold">{g.device}</span>
                  <span className="font-mono text-[10.5px] text-muted">
                    {g.location} · {g.ip}
                  </span>
                </span>
                <span className="font-mono text-[10.5px] text-muted">{g.time}</span>
              </div>
            ))}
            <Link
              href="/admin/ayarlar"
              className="block px-6 py-3 text-[12.5px] font-semibold text-gold transition-colors hover:text-ink"
            >
              Tüm işlem kayıtlarını gör →
            </Link>
          </div>
        </div>
      </div>

      <AdminToast message={toast} />
    </div>
  );
}
