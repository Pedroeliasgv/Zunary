import { supabase } from "./supabase";

type CreateAsaasCheckoutData = {
  company_id: string;
  plan_id: string;
  customer_name: string;
  customer_email: string;
  customer_cpf_cnpj: string;
  customer_phone?: string;
};

export type CreateAsaasCheckoutResponse = {
  success: boolean;
  message: string;
  asaas_customer_id: string;
  asaas_subscription_id: string;
  asaas_payment_id: string | null;
  checkout_url: string | null;
  next_due_date: string | null;
};

export type BillingEvent = {
  id: string;
  company_id: string | null;
  company_subscription_id: string | null;
  provider: string;
  event_type: string;
  asaas_payment_id: string | null;
  asaas_subscription_id: string | null;
  asaas_customer_id: string | null;
  payload: unknown;
  created_at: string;
};

export async function createAsaasCheckout(data: CreateAsaasCheckoutData) {
  const { data: response, error } = await supabase.functions.invoke(
    "create-asaas-checkout",
    {
      body: data,
    }
  );

  if (error) {
    console.error("Erro bruto da Edge Function:", error);
    throw new Error(error.message || "Erro ao chamar a Edge Function.");
  }

  if (response?.error) {
    console.error("Resposta de erro da Edge Function:", response);

    const details = response?.details
      ? ` Detalhes: ${JSON.stringify(response.details)}`
      : "";

    throw new Error(`${response.error}${details}`);
  }

  return response as CreateAsaasCheckoutResponse;
}

export async function getBillingEventsByCompany(companyId: string) {
  const { data, error } = await supabase
    .from("billing_events")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    throw new Error(error.message);
  }

  return data as BillingEvent[];
}

export async function cancelAsaasSubscription(data: {
  company_id: string;
  subscription_id: string;
}) {
  const { data: response, error } = await supabase.functions.invoke(
    "cancel-asaas-subscription",
    {
      body: data,
    }
  );

  if (error) {
    throw new Error(error.message || "Erro ao cancelar assinatura.");
  }

  if (response?.error) {
    const details = response?.details
      ? ` Detalhes: ${JSON.stringify(response.details)}`
      : "";

    throw new Error(`${response.error}${details}`);
  }

  return response;
}

export async function simulateAsaasPayment(data: {
  company_id: string;
  subscription_id: string;
}) {
  const { data: response, error } = await supabase.functions.invoke(
    "simulate-asaas-payment",
    {
      body: data,
    }
  );

  if (error) {
    throw new Error(error.message || "Erro ao simular pagamento.");
  }

  if (response?.error) {
    const details = response?.details
      ? ` Detalhes: ${JSON.stringify(response.details)}`
      : "";

    throw new Error(`${response.error}${details}`);
  }

  return response;
}