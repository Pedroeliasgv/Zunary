import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, asaas-access-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type AsaasWebhookBody = {
  event: string;
  payment?: {
    id?: string;
    customer?: string;
    subscription?: string;
    status?: string;
    billingType?: string;
    value?: number;
    netValue?: number;
    dueDate?: string;
    paymentDate?: string;
    clientPaymentDate?: string;
    invoiceUrl?: string;
    bankSlipUrl?: string;
    transactionReceiptUrl?: string;
    externalReference?: string;
  };
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

function mapBillingStatus(event: string) {
  if (event === "PAYMENT_RECEIVED" || event === "PAYMENT_CONFIRMED") {
    return {
      subscriptionStatus: "active",
      billingStatus: "paid",
    };
  }

  if (event === "PAYMENT_OVERDUE") {
    return {
      subscriptionStatus: "active",
      billingStatus: "overdue",
    };
  }

  if (event === "PAYMENT_DELETED") {
    return {
      subscriptionStatus: "canceled",
      billingStatus: "canceled",
    };
  }

  if (event === "PAYMENT_REFUNDED") {
    return {
      subscriptionStatus: "canceled",
      billingStatus: "refunded",
    };
  }

  return {
    subscriptionStatus: "inactive",
    billingStatus: "pending",
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Método não permitido." }, 405);
  }

  try {
    const webhookToken = Deno.env.get("ASAAS_WEBHOOK_TOKEN");
    const receivedToken = req.headers.get("asaas-access-token");

    if (!webhookToken) {
      return jsonResponse(
        { error: "ASAAS_WEBHOOK_TOKEN não configurado." },
        500
      );
    }

    if (receivedToken !== webhookToken) {
      return jsonResponse({ error: "Token inválido." }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return jsonResponse(
        { error: "Variáveis do Supabase não configuradas." },
        500
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const body = (await req.json()) as AsaasWebhookBody;

    const event = body.event;
    const payment = body.payment;

    if (!event || !payment) {
      return jsonResponse({
        received: true,
        message: "Evento sem payment. Ignorado.",
      });
    }

    const asaasSubscriptionId = payment.subscription;
    const asaasPaymentId = payment.id;
    const asaasCustomerId = payment.customer;

    if (!asaasSubscriptionId) {
      return jsonResponse({
        received: true,
        message: "Pagamento sem subscription. Ignorado.",
      });
    }

    const { subscriptionStatus, billingStatus } = mapBillingStatus(event);

    const updatePayload = {
      status: subscriptionStatus,
      billing_status: billingStatus,
      asaas_payment_id: asaasPaymentId || null,
      asaas_customer_id: asaasCustomerId || null,
      payment_method: payment.billingType || null,
      next_due_date: payment.dueDate || null,
      updated_at: new Date().toISOString(),
      ...(subscriptionStatus === "active"
        ? {
            ends_at: null,
          }
        : {}),
      ...(subscriptionStatus === "canceled"
        ? {
            ends_at: new Date().toISOString(),
          }
        : {}),
    };

    const { data: subscription, error: subscriptionError } = await supabase
      .from("company_subscriptions")
      .update(updatePayload)
      .eq("asaas_subscription_id", asaasSubscriptionId)
      .select("*")
      .maybeSingle();

    if (subscriptionError) {
      return jsonResponse(
        {
          error: "Erro ao atualizar assinatura.",
          details: subscriptionError.message,
        },
        500
      );
    }

    if (!subscription) {
      return jsonResponse({
        received: true,
        message: "Assinatura local não encontrada para este evento.",
        asaas_subscription_id: asaasSubscriptionId,
      });
    }

    return jsonResponse({
      received: true,
      event,
      subscription_id: subscription.id,
      company_id: subscription.company_id,
      status: subscription.status,
      billing_status: subscription.billing_status,
    });
  } catch (error) {
    return jsonResponse(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro inesperado no webhook Asaas.",
      },
      500
    );
  }
});