"use client";

/**
 * Admin ekranlarının ortak bildirim balonu.
 *
 * Neden ayrı bileşen: her ekran kendi toast'ını `fixed bottom-7 z-[99]` ile basıyordu, oysa
 * yapışkan kaydet barı `sticky bottom-4`'te duruyor — ikisi üst üste biniyor ve bildirim
 * "Kaydet" düğmesini kapatıyordu. Yükseklik artık tek yerden yönetiliyor: kaydet barı
 * görünürken balon barın üstüne çıkar.
 */
export function AdminToast({
  message,
  /** Ekranda yapışkan bir kaydet barı varsa balon onun üstüne alınır. */
  aboveSaveBar = false,
}: {
  message: string | null;
  aboveSaveBar?: boolean;
}) {
  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed left-1/2 z-[99] -translate-x-1/2 rounded bg-ink px-6 py-3.5 text-sm font-semibold text-cream shadow-[0_8px_24px_rgba(28,34,48,0.25)]"
      style={{ bottom: aboveSaveBar ? 96 : 28 }}
    >
      {message}
    </div>
  );
}
