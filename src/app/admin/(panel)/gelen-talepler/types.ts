import type { RequestStatus, AppointmentStatus } from "@prisma/client";
import type { BadgeStyle } from "@/lib/admin/format";

export type InboxItem = {
  id: string;
  kind: "message" | "appointment";
  kim: string;
  konu: string;
  tip: "MESAJ" | "RANDEVU TALEBİ";
  eposta: string;
  telefon: string;
  alan: string;
  mesaj: string;
  zaman: string;
  tamZaman: string;
  badge: BadgeStyle;
  messageStatus: RequestStatus | null;
  appointmentStatus: AppointmentStatus | null;
  slot: string | null;
  internalNote: string;
  kvkkConsent: boolean;
};
