import { supabase } from "./supabase";

export type AdminRecentCompany = {
  id: string;
  name: string;
  slug: string;
  business_type: string | null;
  public_booking_enabled: boolean;
  created_at: string;
  owner_name: string | null;
  owner_email: string | null;
};

export type AdminRecentEvent = {
  id: string;
  event_type: string;
  provider: string;
  created_at: string;
  company_name: string | null;
  subscription_status: string | null;
  billing_status: string | null;
};

export type AdminRecentSubscription = {
  id: string;
  status: string;
  billing_status: string | null;
  created_at: string;
  next_due_date: string | null;
  checkout_url: string | null;
  company_name: string | null;
  plan_name: string | null;
};

export type AdminOverview = {
  users_count: number;
  companies_count: number;
  subscriptions_count: number;
  active_subscriptions_count: number;
  pending_subscriptions_count: number;
  canceled_subscriptions_count: number;
  recent_companies: AdminRecentCompany[];
  recent_events: AdminRecentEvent[];
  recent_subscriptions: AdminRecentSubscription[];
};

export async function isCurrentUserAdmin() {
  const { data, error } = await supabase.rpc("is_admin");

  if (error) {
    return false;
  }

  return Boolean(data);
}

export async function getAdminOverview() {
  const { data, error } = await supabase.rpc("get_admin_overview");

  if (error) {
    throw new Error(error.message);
  }

  return data as AdminOverview;
}

export type AdminCompany = {
  id: string;
  name: string;
  slug: string;
  business_type: string | null;
  public_booking_enabled: boolean;
  created_at: string;
  owner_name: string | null;
  owner_email: string | null;
};

export async function getAdminCompanies() {
  const { data, error } = await supabase.rpc("get_admin_companies");

  if (error) {
    throw new Error(error.message);
  }

  return data as AdminCompany[];
}

export type AdminSubscription = {
  id: string;
  company_id: string;
  company_name: string | null;
  plan_name: string | null;
  status: string;
  billing_status: string | null;
  checkout_url: string | null;
  next_due_date: string | null;
  created_at: string;
  asaas_subscription_id: string | null;
  asaas_payment_id: string | null;
};

export async function getAdminSubscriptions() {
  const { data, error } = await supabase.rpc("get_admin_subscriptions");

  if (error) {
    throw new Error(error.message);
  }

  return data as AdminSubscription[];
}

export type AdminBillingEvent = {
  id: string;
  company_id: string | null;
  company_name: string | null;
  company_subscription_id: string | null;
  provider: string;
  event_type: string;
  asaas_payment_id: string | null;
  asaas_subscription_id: string | null;
  asaas_customer_id: string | null;
  created_at: string;
};

export async function getAdminBillingEvents() {
  const { data, error } = await supabase.rpc("get_admin_billing_events");

  if (error) {
    throw new Error(error.message);
  }

  return data as AdminBillingEvent[];
}

export type AdminUser = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: "user" | "admin";
  created_at: string;
};

export async function getAdminUsers() {
  const { data, error } = await supabase.rpc("get_admin_users");

  if (error) {
    throw new Error(error.message);
  }

  return data as AdminUser[];
}