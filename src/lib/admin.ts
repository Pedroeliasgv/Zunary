import { supabase } from "./supabase";

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