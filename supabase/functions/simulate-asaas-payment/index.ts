import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type RequestBody = {
  company_id: string;
  subscription_id: string;
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
    const asaasApiUrl = Deno.env.get("ASAAS_API_URL") || "";

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return jsonResponse(
        { error: "Variáveis do Supabase não configuradas." },
        500
      );
    }

    if (!asaasApiUrl.includes("sandbox")) {
      return jsonResponse(
        {
          error:
            "Simulação bloqueada. Esta função só pode ser usada em ambiente sandbox.",
        },
        403
      );
    }

    const authorizationHeader = req.headers.get("Authorization");

    if (!authorizationHeader) {
      return jsonResponse({ error: "Usuário não autenticado." }, 401);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      global: {
        headers: {
          Authorization: authorizationHeader,
        },
      },
    });

    const { company_id, subscription_id } = (await req.json()) as RequestBody;

    if (!company_id || !subscription_id) {
      return jsonResponse(
        { error: "Empresa e assinatura são obrigatórias." },
        400
      );
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return jsonResponse({ error: "Usuário não autenticado." }, 401);
    }

    const { data: adminStatus, error: adminError } = await supabase.rpc(
      "is_admin"
    );

    if (adminError || !adminStatus) {
      return jsonResponse({ error: "Acesso negado." }, 403);
    }

    const { data: subscription, error: subscriptionError } = await supabase
      .from("company_subscriptions")
      .select("*")
      .eq("id", subscription_id)
      .eq("company_id", company_id)
      .single();

    if (subscriptionError || !subscription) {
      return jsonResponse({ error: "Assinatura não encontrada." }, 404);
    }

    if (subscription.status === "canceled") {
      return jsonResponse(
        { error: "Não é possível simular pagamento de assinatura cancelada." },
        400
      );
    }

    const { data: updatedSubscription, error: updateError } = await supabase
      .from("company_subscriptions")
      .update({
        status: "active",
        billing_status: "paid",
        ends_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", subscription.id)
      .select("*")
      .single();

    if (updateError) {
      return jsonResponse(
        {
          error: "Erro ao ativar assinatura.",
          details: updateError.message,
        },
        500
      );
    }

    await supabase.from("billing_events").insert({
      company_id,
      company_subscription_id: subscription.id,
      provider: "asaas",
      event_type: "SIMULATED_PAYMENT_RECEIVED",
      asaas_subscription_id: subscription.asaas_subscription_id || null,
      asaas_customer_id: subscription.asaas_customer_id || null,
      asaas_payment_id: subscription.asaas_payment_id || null,
      payload: {
        source: "zunary_admin",
        action: "simulate_payment",
        environment: "sandbox",
        local_subscription_id: subscription.id,
      },
    });

    return jsonResponse({
      success: true,
      message: "Pagamento simulado com sucesso.",
      subscription: updatedSubscription,
    });
  } catch (error) {
    return jsonResponse(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro inesperado ao simular pagamento.",
      },
      500
    );
  }
});