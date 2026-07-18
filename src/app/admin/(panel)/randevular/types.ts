import type { AppointmentStatus } from "@prisma/client";

export type CalendarAppointment = {
  id: string;
  dateKey: string;
  startTime: string;
  kim: string;
  konu: string;
  status: AppointmentStatus;
};

export type BlockedDateItem = {
  id: string;
  dateKey: string;
  label: string;
  reason: string;
};
