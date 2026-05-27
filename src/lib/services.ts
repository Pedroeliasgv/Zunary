import { supabase } from "./supabase";
import type { Service } from "../types";

type CreateServiceData = {
  company_id: string;
  name: string;
  description?: string;
  duration_minutes: number;
  price?: number | null;
};

type UpdateServiceData = {
  name?: string;
  description?: string | null;
  duration_minutes?: number;
  price?: number | null;
  is_active?: boolean;
};

export async function getServicesByCompany(companyId: string) {
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data as Service[];
}

export async function getActiveServicesByCompany(companyId: string) {
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("company_id", companyId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data as Service[];
}

export async function createService(data: CreateServiceData) {
  const { data: service, error } = await supabase
    .from("services")
    .insert({
      company_id: data.company_id,
      name: data.name,
      description: data.description || null,
      duration_minutes: data.duration_minutes,
      price: data.price ?? null,
      is_active: true,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return service as Service;
}

export async function updateService(serviceId: string, data: UpdateServiceData) {
  const { data: service, error } = await supabase
    .from("services")
    .update(data)
    .eq("id", serviceId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return service as Service;
}

export async function toggleServiceStatus(serviceId: string, isActive: boolean) {
  return updateService(serviceId, {
    is_active: isActive,
  });
}

export async function deleteService(serviceId: string) {
  const { error } = await supabase.from("services").delete().eq("id", serviceId);

  if (error) {
    throw new Error(error.message);
  }
}