import { supabase } from "./supabase";

export type Plan = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_monthly: number;
  max_services: number | null;
  allow_unlimited_services: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type CompanySubscription = {
  id: string;
  company_id: string;
  plan_id: string;
  status: "active" | "inactive" | "canceled" | "past_due";
  started_at: string;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
  asaas_customer_id?: string | null;
  asaas_subscription_id?: string | null;
  asaas_payment_id?: string | null;
  checkout_url?: string | null;
  billing_status?:
    | "pending"
    | "paid"
    | "overdue"
    | "canceled"
    | "refunded"
    | "failed";
  payment_method?: string | null;
  next_due_date?: string | null;
  plans?: Plan;
};

export async function getActivePlans() {
  const { data, error } = await supabase
    .from("plans")
    .select("*")
    .eq("is_active", true)
    .order("price_monthly", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data as Plan[];
}

export async function getCompanyActiveSubscription(companyId: string) {
  const { data, error } = await supabase
    .from("company_subscriptions")
    .select(
      `
      *,
      plans (*)
    `
    )
    .eq("company_id", companyId)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as CompanySubscription | null;
}

export async function getCompanyPendingSubscription(companyId: string) {
  const { data, error } = await supabase
    .from("company_subscriptions")
    .select(
      `
      *,
      plans (*)
    `
    )
    .eq("company_id", companyId)
    .eq("status", "inactive")
    .eq("billing_status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as CompanySubscription | null;
}

export async function setCompanyPlan(companyId: string, planId: string) {
  const { data, error } = await supabase.rpc("set_company_plan", {
    target_company_id: companyId,
    target_plan_id: planId,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data as CompanySubscription;
}

export async function cancelCompanySubscription(subscriptionId: string) {
  const { error } = await supabase
    .from("company_subscriptions")
    .update({
      status: "canceled",
      billing_status: "canceled",
      ends_at: new Date().toISOString(),
    })
    .eq("id", subscriptionId);

  if (error) {
    throw new Error(error.message);
  }
}

export function canCreateMoreActiveServices(
  subscription: CompanySubscription | null,
  activeServicesCount: number
) {
  const plan = subscription?.plans;

  if (!plan) {
    return {
      allowed: false,
      message: "Escolha um plano antes de cadastrar serviços.",
    };
  }

  if (plan.allow_unlimited_services) {
    return {
      allowed: true,
      message: "",
    };
  }

  if (plan.max_services === null) {
    return {
      allowed: true,
      message: "",
    };
  }

  if (activeServicesCount >= plan.max_services) {
    return {
      allowed: false,
      message: `Seu plano ${plan.name} permite até ${plan.max_services} serviços ativos. Desative um serviço ou faça upgrade de plano.`,
    };
  }

  return {
    allowed: true,
    message: "",
  };
}