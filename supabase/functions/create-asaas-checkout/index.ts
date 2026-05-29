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
  plan_id: string;
  customer_name: string;
  customer_email: string;
  customer_cpf_cnpj: string;
  customer_phone?: string;
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

function addOneDayDate() {
  const date = new Date();
  date.setDate(date.getDate() + 1);

  return date.toISOString().slice(0, 10);
}

function getFirstPaymentUrl(payment: any) {
  return (
    payment?.invoiceUrl ||
    payment?.bankSlipUrl ||
    payment?.transactionReceiptUrl ||
    null
  );
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
      return jsonResponse(
        { error: "Variáveis do Asaas não configuradas." },
        500
      );
    }

    const authorizationHeader = req.headers.get("Authorization");

    if (!authorizationHeader) {
      return jsonResponse({ error: "Usuário não autenticado." }, 401);
    }

    const userToken = authorizationHeader.replace("Bearer ", "");

    const supabaseAdmin = createClient(
      supabaseUrl,
      supabaseServiceRoleKey
    );

    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(userToken);

    if (userError || !user) {
      return jsonResponse({ error: "Usuário não autenticado." }, 401);
    }

    const {
      company_id,
      plan_id,
      customer_name,
      customer_email,
      customer_cpf_cnpj,
      customer_phone,
    } = (await req.json()) as RequestBody;

    if (!company_id || !plan_id) {
      return jsonResponse({ error: "Empresa e plano são obrigatórios." }, 400);
    }

    if (!customer_name || !customer_email || !customer_cpf_cnpj) {
      return jsonResponse(
        { error: "Nome, e-mail e CPF/CNPJ são obrigatórios." },
        400
      );
    }

    const { data: company, error: companyError } = await supabaseAdmin
      .from("companies")
      .select("*")
      .eq("id", company_id)
      .eq("owner_id", user.id)
      .single();

    if (companyError || !company) {
      return jsonResponse(
        { error: "Empresa não encontrada ou sem permissão." },
        403
      );
    }

    const { data: plan, error: planError } = await supabaseAdmin
      .from("plans")
      .select("*")
      .eq("id", plan_id)
      .eq("is_active", true)
      .single();

    if (planError || !plan) {
      return jsonResponse({ error: "Plano não encontrado." }, 404);
    }

    const customerResponse = await fetch(`${asaasApiUrl}/customers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        access_token: asaasApiKey,
      },
      body: JSON.stringify({
        name: customer_name,
        email: customer_email,
        cpfCnpj: customer_cpf_cnpj,
        mobilePhone: customer_phone || undefined,
        externalReference: company.id,
      }),
    });

    const customerData = await customerResponse.json();

    if (!customerResponse.ok) {
      return jsonResponse(
        {
          error: "Erro ao criar cliente no Asaas.",
          details: customerData,
        },
        400
      );
    }

    const subscriptionResponse = await fetch(`${asaasApiUrl}/subscriptions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        access_token: asaasApiKey,
      },
      body: JSON.stringify({
        customer: customerData.id,
        billingType: "UNDEFINED",
        nextDueDate: addOneDayDate(),
        value: Number(plan.price_monthly),
        cycle: "MONTHLY",
        description: `Zunary - Plano ${plan.name}`,
        externalReference: `${company.id}:${plan.id}`,
      }),
    });

    const subscriptionData = await subscriptionResponse.json();

    if (!subscriptionResponse.ok) {
      return jsonResponse(
        {
          error: "Erro ao criar assinatura no Asaas.",
          details: subscriptionData,
        },
        400
      );
    }

    const paymentsResponse = await fetch(
      `${asaasApiUrl}/subscriptions/${subscriptionData.id}/payments`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          access_token: asaasApiKey,
        },
      }
    );

    const paymentsData = await paymentsResponse.json();

    if (!paymentsResponse.ok) {
      return jsonResponse(
        {
          error: "Assinatura criada, mas houve erro ao buscar cobrança.",
          details: paymentsData,
        },
        400
      );
    }

    const firstPayment = paymentsData?.data?.[0] || null;
    const paymentUrl = getFirstPaymentUrl(firstPayment);

    await supabaseAdmin
      .from("company_subscriptions")
      .update({
        status: "canceled",
        billing_status: "canceled",
        ends_at: new Date().toISOString(),
      })
      .eq("company_id", company.id)
      .eq("status", "active");

    const { data: localSubscription, error: localSubscriptionError } =
      await supabaseAdmin
        .from("company_subscriptions")
        .insert({
          company_id: company.id,
          plan_id: plan.id,
          status: "inactive",
          billing_status: "pending",
          asaas_customer_id: customerData.id,
          asaas_subscription_id: subscriptionData.id,
          asaas_payment_id: firstPayment?.id || null,
          checkout_url: paymentUrl,
          payment_method: "UNDEFINED",
          next_due_date:
            firstPayment?.dueDate || subscriptionData.nextDueDate || null,
        })
        .select("*")
        .single();

    if (localSubscriptionError) {
      return jsonResponse(
        {
          error: "Erro ao salvar assinatura local.",
          details: localSubscriptionError.message,
        },
        500
      );
    }

    return jsonResponse({
      success: true,
      message: "Assinatura criada no Asaas.",
      asaas_customer_id: customerData.id,
      asaas_subscription_id: subscriptionData.id,
      asaas_payment_id: firstPayment?.id || null,
      checkout_url: paymentUrl,
      subscription: localSubscription,
      payment: firstPayment,
      next_due_date:
        firstPayment?.dueDate || subscriptionData.nextDueDate || null,
    });
  } catch (error) {
    return jsonResponse(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro inesperado ao criar checkout.",
      },
      500
    );
  }
});