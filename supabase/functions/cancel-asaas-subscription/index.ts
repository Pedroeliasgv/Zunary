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
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Método não permitido." }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const asaasApiKey = Deno.env.get("ASAAS_API_KEY");
    const asaasApiUrl =
      Deno.env.get("ASAAS_API_URL") || "https://api-sandbox.asaas.com/v3";

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return jsonResponse(
        { error: "Variáveis do Supabase não configuradas." },
        500
      );
    }

    if (!asaasApiKey) {
      return jsonResponse({ error: "ASAAS_API_KEY não configurada." }, 500);
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

    const { company_id, subscription_id } = (await req.json()) as RequestBody;

    if (!company_id || !subscription_id) {
      return jsonResponse(
        { error: "Empresa e assinatura são obrigatórias." },
        400
      );
    }

    const { data: company, error: companyError } = await supabaseAdmin
      .from("companies")
      .select("id, owner_id")
      .eq("id", company_id)
      .single();

    if (companyError || !company) {
      return jsonResponse({ error: "Empresa não encontrada." }, 404);
    }

    const { data: isAdmin, error: adminError } = await supabaseAdmin.rpc(
      "is_admin"
    );

    if (adminError) {
      return jsonResponse(
        { error: "Erro ao verificar permissão de admin." },
        500
      );
    }

    const isOwner = company.owner_id === user.id;

    if (!isOwner && !isAdmin) {
      return jsonResponse(
        { error: "Você não tem permissão para cancelar esta assinatura." },
        403
      );
    }

    const { data: subscription, error: subscriptionError } = await supabaseAdmin
      .from("company_subscriptions")
      .select("*")
      .eq("id", subscription_id)
      .eq("company_id", company_id)
      .single();

    if (subscriptionError || !subscription) {
      return jsonResponse({ error: "Assinatura local não encontrada." }, 404);
    }

    if (subscription.status === "canceled") {
      return jsonResponse({
        success: true,
        message: "Assinatura já estava cancelada.",
        subscription,
      });
    }

    if (subscription.asaas_subscription_id) {
      const asaasResponse = await fetch(
        `${asaasApiUrl}/subscriptions/${subscription.asaas_subscription_id}`,
        {
          method: "DELETE",
          headers: {
            accept: "application/json",
            access_token: asaasApiKey,
          },
        }
      );

      const asaasData = await asaasResponse.json().catch(() => null);

      if (!asaasResponse.ok) {
        return jsonResponse(
          {
            error: "Erro ao cancelar assinatura no Asaas.",
            details: asaasData,
          },
          400
        );
      }
    }

    const { data: updatedSubscription, error: updateError } =
      await supabaseAdmin
        .from("company_subscriptions")
        .update({
          status: "canceled",
          billing_status: "canceled",
          ends_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", subscription.id)
        .select("*")
        .single();

    if (updateError) {
      return jsonResponse(
        {
          error: "Assinatura cancelada no Asaas, mas falhou no Supabase.",
          details: updateError.message,
        },
        500
      );
    }

    await supabaseAdmin.from("billing_events").insert({
      company_id: company.id,
      company_subscription_id: subscription.id,
      provider: "asaas",
      event_type: "SUBSCRIPTION_CANCELED_MANUALLY",
      asaas_subscription_id: subscription.asaas_subscription_id || null,
      asaas_customer_id: subscription.asaas_customer_id || null,
      asaas_payment_id: subscription.asaas_payment_id || null,
      payload: {
        source: isAdmin ? "zunary_admin" : "zunary_user",
        action: "cancel_subscription",
        local_subscription_id: subscription.id,
        asaas_subscription_id: subscription.asaas_subscription_id,
        canceled_by_user_id: user.id,
      },
    });

    return jsonResponse({
      success: true,
      message: "Assinatura cancelada com sucesso.",
      subscription: updatedSubscription,
    });
  } catch (error) {
    return jsonResponse(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro inesperado ao cancelar assinatura.",
      },
      500
    );
  }
});