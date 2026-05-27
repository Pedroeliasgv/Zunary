import { supabase } from "./supabase";
import type { AvailabilityRule } from "../types";

type CreateAvailabilityRuleData = {
  company_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
};

type UpdateAvailabilityRuleData = {
  day_of_week?: number;
  start_time?: string;
  end_time?: string;
  is_active?: boolean;
};

export async function getAvailabilityByCompany(companyId: string) {
  const { data, error } = await supabase
    .from("availability_rules")
    .select("*")
    .eq("company_id", companyId)
    .order("day_of_week", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data as AvailabilityRule[];
}

export async function getActiveAvailabilityByCompany(companyId: string) {
  const { data, error } = await supabase
    .from("availability_rules")
    .select("*")
    .eq("company_id", companyId)
    .eq("is_active", true)
    .order("day_of_week", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data as AvailabilityRule[];
}

export async function createAvailabilityRule(data: CreateAvailabilityRuleData) {
  const { data: rule, error } = await supabase
    .from("availability_rules")
    .insert({
      company_id: data.company_id,
      day_of_week: data.day_of_week,
      start_time: data.start_time,
      end_time: data.end_time,
      is_active: true,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return rule as AvailabilityRule;
}

export async function updateAvailabilityRule(
  ruleId: string,
  data: UpdateAvailabilityRuleData
) {
  const { data: rule, error } = await supabase
    .from("availability_rules")
    .update(data)
    .eq("id", ruleId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return rule as AvailabilityRule;
}

export async function toggleAvailabilityRuleStatus(
  ruleId: string,
  isActive: boolean
) {
  return updateAvailabilityRule(ruleId, {
    is_active: isActive,
  });
}

export async function deleteAvailabilityRule(ruleId: string) {
  const { error } = await supabase
    .from("availability_rules")
    .delete()
    .eq("id", ruleId);

  if (error) {
    throw new Error(error.message);
  }
}