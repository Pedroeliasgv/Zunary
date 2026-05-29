import { supabase } from "./supabase";
import type { AppointmentStatus } from "../types";

type CreateAppointmentData = {
  company_id: string;
  service_id: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  notes?: string;
};

type UpdateAppointmentStatusData = {
  appointmentId: string;
  status: AppointmentStatus;
  cancellationReason?: string | null;
};

export async function getAppointmentsByCompany(companyId: string) {
  const { data, error } = await supabase
    .from("appointments")
    .select(
      `
      *,
      services (
        name,
        duration_minutes,
        price
      ),
      customers (
        name,
        email,
        phone
      )
    `
    )
    .eq("company_id", companyId)
    .order("appointment_date", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getAppointmentsCountByCompany(companyId: string) {
  const { count, error } = await supabase
    .from("appointments")
    .select("*", { count: "exact", head: true })
    .eq("company_id", companyId);

  if (error) {
    throw new Error(error.message);
  }

  return count || 0;
}

export async function getBookedTimesByCompanyAndDate(
  companyId: string,
  appointmentDate: string
) {
  const { data, error } = await supabase.rpc("get_booked_times", {
    target_company_id: companyId,
    target_date: appointmentDate,
  });

  if (error) {
    throw new Error(error.message);
  }

  return (data || []).map((item: { start_time: string }) =>
    item.start_time.slice(0, 5)
  );
}

export async function createPublicAppointment(data: CreateAppointmentData) {
  const { data: appointment, error } = await supabase.rpc(
    "create_public_appointment",
    {
      target_company_id: data.company_id,
      target_service_id: data.service_id,
      target_customer_name: data.customer_name,
      target_customer_email: data.customer_email || "",
      target_customer_phone: data.customer_phone || "",
      target_appointment_date: data.appointment_date,
      target_start_time: data.start_time,
      target_end_time: data.end_time,
      target_notes: data.notes || "",
    }
  );

  if (error) {
    throw new Error(error.message);
  }

  return appointment;
}

export async function updateAppointmentStatus(
  appointmentId: string,
  status: AppointmentStatus
) {
  return updateAppointmentStatusWithReason({
    appointmentId,
    status,
    cancellationReason: null,
  });
}

export async function updateAppointmentStatusWithReason({
  appointmentId,
  status,
  cancellationReason,
}: UpdateAppointmentStatusData) {
  const updateData: {
    status: AppointmentStatus;
    cancellation_reason?: string | null;
  } = {
    status,
  };

  if (status === "canceled") {
    updateData.cancellation_reason = cancellationReason?.trim() || null;
  }

  if (status !== "canceled") {
    updateData.cancellation_reason = null;
  }

  const { error } = await supabase
    .from("appointments")
    .update(updateData)
    .eq("id", appointmentId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function sendAppointmentEmail(data: {
  appointmentId: string;
  type: "created" | "confirmed" | "canceled";
}) {
  const { data: response, error } = await supabase.functions.invoke(
    "send-appointment-email",
    {
      body: {
        appointment_id: data.appointmentId,
        type: data.type,
      },
    }
  );

  if (error) {
    throw new Error(error.message || "Erro ao enviar notificação por e-mail.");
  }

  if (response?.error) {
    throw new Error(response.error);
  }

  return response;
}