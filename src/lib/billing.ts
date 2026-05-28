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