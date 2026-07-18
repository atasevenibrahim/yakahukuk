const ISTANBUL_TZ = "Europe/Istanbul";

/** Mockup'taki "22 dk / 1 sa / Dün / 3 gün" göreli zaman biçimi. */
export function timeAgo(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "az önce";
  if (minutes < 60) return `${minutes} dk`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} sa`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Dün";
  if (days < 7) return `${days} gün`;
  return new Intl.DateTimeFormat("tr-TR", { timeZone: ISTANBUL_TZ, day: "2-digit", month: "short" })
    .format(date)
    .toUpperCase();
}

/** Randevu kartlarındaki "BUGÜN / YARIN / 24 TEM" gün etiketi. */
export function relativeDayLabel(date: Date): string {
  const fmt = (d: Date) =>
    new Intl.DateTimeFormat("en-CA", { timeZone: ISTANBUL_TZ }).format(d);
  const today = new Date();
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

  if (fmt(date) === fmt(today)) return "BUGÜN";
  if (fmt(date) === fmt(tomorrow)) return "YARIN";
  return new Intl.DateTimeFormat("tr-TR", { timeZone: ISTANBUL_TZ, day: "2-digit", month: "short" })
    .format(date)
    .toUpperCase();
}

export type BadgeStyle = { label: string; color: string; border: string; bg: string };

/** ContactMessage.status → mockup'taki YENİ/OKUNDU/YANITLANDI/KAPANDI rozet stilleri. */
export function messageStatusBadge(status: "NEW" | "READ" | "REPLIED" | "CLOSED"): BadgeStyle {
  switch (status) {
    case "NEW":
      return { label: "YENİ", color: "#9C7C4A", border: "#9C7C4A", bg: "rgba(156,124,74,.08)" };
    case "REPLIED":
      return { label: "YANITLANDI", color: "#3F7A5B", border: "#CDE0D4", bg: "rgba(63,122,91,.06)" };
    case "READ":
      return { label: "OKUNDU", color: "#5B6270", border: "#E4DFD5", bg: "transparent" };
    case "CLOSED":
      return { label: "KAPANDI", color: "#5B6270", border: "#E4DFD5", bg: "transparent" };
  }
}

/** Appointment.status → aynı rozet dilinde randevu karşılıkları. */
export function appointmentStatusBadge(
  status: "PENDING" | "CONFIRMED" | "REJECTED" | "RESCHEDULED" | "CANCELLED",
): BadgeStyle {
  switch (status) {
    case "PENDING":
      return { label: "YENİ", color: "#9C7C4A", border: "#9C7C4A", bg: "rgba(156,124,74,.08)" };
    case "CONFIRMED":
      return { label: "ONAYLANDI", color: "#3F7A5B", border: "#CDE0D4", bg: "rgba(63,122,91,.06)" };
    case "RESCHEDULED":
      return { label: "YENİDEN PLANLANDI", color: "#5B6270", border: "#E4DFD5", bg: "transparent" };
    case "REJECTED":
      return { label: "REDDEDİLDİ", color: "#A23A32", border: "#E8C5C1", bg: "rgba(162,58,50,.06)" };
    case "CANCELLED":
      return { label: "İPTAL", color: "#5B6270", border: "#E4DFD5", bg: "transparent" };
  }
}

const AUDIT_ACTION_LABELS: Record<string, string> = {
  login: "giriş yaptı",
  login_2fa: "2FA ile giriş yaptı",
  login_backup_code: "yedek kodla giriş yaptı",
  login_failed: "başarısız giriş denemesi yaptı",
  "2fa_failed": "2FA doğrulamasında hata aldı",
  backup_code_failed: "yedek kod doğrulamasında hata aldı",
  logout: "oturumu kapattı",
  password_reset_requested: "şifre sıfırlama talep etti",
  password_reset: "şifresini sıfırladı",
  appointment_confirmed: "randevu talebini onayladı",
  appointment_rejected: "randevu talebini reddetti",
  appointment_rescheduled: "randevuyu yeniden planladı",
  message_status_changed: "talep durumunu güncelledi",
  message_note_saved: "dahili not ekledi",
  availability_saved: "müsaitlik ayarlarını güncelledi",
  blocked_date_added: "kapalı gün ekledi",
  blocked_date_removed: "kapalı günü kaldırdı",
};

export function describeAuditAction(action: string): string {
  return AUDIT_ACTION_LABELS[action] ?? action;
}

export function initialsFromName(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
