import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type AppointmentEmailType = "created" | "confirmed" | "canceled";

type RequestBody = {
  appointment_id: string;
  type: AppointmentEmailType;
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

function formatTime(time: string) {
  return time.slice(0, 5);
}

function buildEmailContent(params: {
  type: AppointmentEmailType;
  companyName: string;
  customerName: string;
  serviceName: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  cancellationReason?: string | null;
}) {
  const {
    type,
    companyName,
    customerName,
    serviceName,
    appointmentDate,
    startTime,
    endTime,
    cancellationReason,
  } = params;

  const dateLabel = formatDate(appointmentDate);
  const timeLabel = `${formatTime(startTime)} até ${formatTime(endTime)}`;

  if (type === "created") {
    return {
      subject: `Novo agendamento recebido - ${companyName}`,
      title: "Novo agendamento recebido",
      preview: `${customerName} solicitou um agendamento.`,
      message: `${customerName} solicitou um novo agendamento para ${serviceName}.`,
      statusLabel: "Aguardando confirmação",
      dateLabel,
      timeLabel,
    };
  }

  if (type === "confirmed") {
    return {
      subject: `Agendamento confirmado - ${companyName}`,
      title: "Agendamento confirmado",
      preview: `Seu agendamento foi confirmado por ${companyName}.`,
      message: `Seu agendamento para ${serviceName} foi confirmado por ${companyName}.`,
      statusLabel: "Confirmado",
      dateLabel,
      timeLabel,
    };
  }

  return {
    subject: `Agendamento cancelado - ${companyName}`,
    title: "Agendamento cancelado",
    preview: `Seu agendamento foi cancelado por ${companyName}.`,
    message: `Seu agendamento para ${serviceName} foi cancelado por ${companyName}.`,
    statusLabel: "Cancelado",
    dateLabel,
    timeLabel,
    cancellationReason,
  };
}

function buildHtmlEmail(params: {
  title: string;
  preview: string;
  message: string;
  companyName: string;
  customerName: string;
  serviceName: string;
  statusLabel: string;
  dateLabel: string;
  timeLabel: string;
  cancellationReason?: string | null;
}) {
  const {
    title,
    preview,
    message,
    companyName,
    customerName,
    serviceName,
    statusLabel,
    dateLabel,
    timeLabel,
    cancellationReason,
  } = params;

  return `
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <title>${title}</title>
  </head>
  <body style="margin:0;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#020617;">
    <span style="display:none;visibility:hidden;opacity:0;height:0;width:0;overflow:hidden;">
      ${preview}
    </span>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #e2e8f0;border-radius:20px;overflow:hidden;">
            <tr>
              <td style="padding:28px 28px 18px;">
                <div style="font-size:12px;text-transform:uppercase;letter-spacing:.12em;font-weight:800;color:#2563eb;">
                  Zunary
                </div>

                <h1 style="margin:10px 0 8px;font-size:28px;line-height:1.1;color:#020617;">
                  ${title}
                </h1>

                <p style="margin:0;color:#475569;font-size:15px;line-height:1.6;">
                  ${message}
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:0 28px 24px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;padding:16px;">
                  <tr>
                    <td style="padding:8px 0;color:#64748b;font-size:12px;font-weight:700;">Empresa</td>
                    <td style="padding:8px 0;color:#020617;font-size:14px;font-weight:700;text-align:right;">${companyName}</td>
                  </tr>

                  <tr>
                    <td style="padding:8px 0;color:#64748b;font-size:12px;font-weight:700;">Cliente</td>
                    <td style="padding:8px 0;color:#020617;font-size:14px;font-weight:700;text-align:right;">${customerName}</td>
                  </tr>

                  <tr>
                    <td style="padding:8px 0;color:#64748b;font-size:12px;font-weight:700;">Serviço</td>
                    <td style="padding:8px 0;color:#020617;font-size:14px;font-weight:700;text-align:right;">${serviceName}</td>
                  </tr>

                  <tr>
                    <td style="padding:8px 0;color:#64748b;font-size:12px;font-weight:700;">Data</td>
                    <td style="padding:8px 0;color:#020617;font-size:14px;font-weight:700;text-align:right;">${dateLabel}</td>
                  </tr>

                  <tr>
                    <td style="padding:8px 0;color:#64748b;font-size:12px;font-weight:700;">Horário</td>
                    <td style="padding:8px 0;color:#020617;font-size:14px;font-weight:700;text-align:right;">${timeLabel}</td>
                  </tr>

                  <tr>
                    <td style="padding:8px 0;color:#64748b;font-size:12px;font-weight:700;">Status</td>
                    <td style="padding:8px 0;color:#020617;font-size:14px;font-weight:700;text-align:right;">${statusLabel}</td>
                  </tr>
                </table>

                ${
                  cancellationReason
                    ? `
                      <div style="margin-top:16px;background:#fef2f2;border:1px solid #fecaca;border-radius:16px;padding:14px;">
                        <strong style="display:block;color:#991b1b;font-size:13px;margin-bottom:4px;">Motivo do cancelamento</strong>
                        <span style="color:#7f1d1d;font-size:14px;line-height:1.5;">${cancellationReason}</span>
                      </div>
                    `
                    : ""
                }

                <p style="margin:18px 0 0;color:#64748b;font-size:12px;line-height:1.5;text-align:center;">
                  Esta é uma notificação automática enviada pela Zunary.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;
}

async function sendEmail(params: {
  resendApiKey: string;
  from: string;
  to: string;
  subject: string;
  html: string;
}) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: params.from,
      to: params.to,
      subject: params.subject,
      html: params.html,
    }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.message || data?.error || "Erro ao enviar e-mail pelo Resend."
    );
  }

  return data;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Método não permitido." }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const mailFrom = Deno.env.get("MAIL_FROM") || "Zunary <onboarding@resend.dev>";

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return jsonResponse(
        { error: "Variáveis do Supabase não configuradas." },
        500
      );
    }

    if (!resendApiKey) {
      return jsonResponse({ error: "RESEND_API_KEY não configurada." }, 500);
    }

    const authorizationHeader = req.headers.get("Authorization");

    if (!authorizationHeader) {
      return jsonResponse({ error: "Usuário não autenticado." }, 401);
    }

    const userToken = authorizationHeader.replace("Bearer ", "");

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(userToken);

    if (userError || !user) {
      return jsonResponse({ error: "Usuário não autenticado." }, 401);
    }

    const { appointment_id, type } = (await req.json()) as RequestBody;

    if (!appointment_id || !type) {
      return jsonResponse(
        { error: "Agendamento e tipo de e-mail são obrigatórios." },
        400
      );
    }

    if (!["created", "confirmed", "canceled"].includes(type)) {
      return jsonResponse({ error: "Tipo de e-mail inválido." }, 400);
    }

    const { data: appointment, error: appointmentError } = await supabaseAdmin
      .from("appointments")
      .select(
        `
        *,
        companies (
          id,
          name,
          owner_id
        ),
        services (
          name
        ),
        customers (
          name,
          email,
          phone
        )
      `
      )
      .eq("id", appointment_id)
      .single();

    if (appointmentError || !appointment) {
      return jsonResponse({ error: "Agendamento não encontrado." }, 404);
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id, email, role")
      .eq("id", user.id)
      .single();

    const isAdmin = profile?.role === "admin";
    const isOwner = appointment.companies?.owner_id === user.id;

    if (!isAdmin && !isOwner) {
      return jsonResponse(
        { error: "Você não tem permissão para enviar esta notificação." },
        403
      );
    }

    const companyName = appointment.companies?.name || "Empresa";
    const customerName = appointment.customers?.name || "Cliente";
    const customerEmail = appointment.customers?.email || null;
    const ownerEmail = profile?.email || null;
    const serviceName = appointment.services?.name || "Serviço";

    const content = buildEmailContent({
      type,
      companyName,
      customerName,
      serviceName,
      appointmentDate: appointment.appointment_date,
      startTime: appointment.start_time,
      endTime: appointment.end_time,
      cancellationReason: appointment.cancellation_reason,
    });

    const html = buildHtmlEmail({
      ...content,
      companyName,
      customerName,
      serviceName,
      cancellationReason: appointment.cancellation_reason,
    });

    const recipients: string[] = [];

    if (type === "created") {
      if (ownerEmail) recipients.push(ownerEmail);
    }

    if (type === "confirmed" || type === "canceled") {
      if (customerEmail) recipients.push(customerEmail);
    }

    if (recipients.length === 0) {
      return jsonResponse({
        success: true,
        skipped: true,
        message: "Nenhum destinatário encontrado para esta notificação.",
      });
    }

    const sentEmails = [];

    for (const recipient of recipients) {
      const sent = await sendEmail({
        resendApiKey,
        from: mailFrom,
        to: recipient,
        subject: content.subject,
        html,
      });

      sentEmails.push(sent);
    }

    return jsonResponse({
      success: true,
      message: "Notificação enviada com sucesso.",
      sent: sentEmails,
    });
  } catch (error) {
    return jsonResponse(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro inesperado ao enviar notificação.",
      },
      500
    );
  }
});