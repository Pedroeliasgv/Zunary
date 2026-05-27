import type { AppointmentStatus } from "../types";

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  canceled: "Cancelado",
  completed: "Concluído",
};