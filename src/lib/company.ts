import { supabase } from "./supabase";
import { getCurrentUser } from "./auth";
import type { Company } from "../types";

type CreateCompanyData = {
  name: string;
  slug: string;
  business_type: string;
  description?: string;
};

type UpdateCompanyData = {
  name?: string;
  slug?: string;
  business_type?: string | null;
  description?: string | null;
  public_booking_enabled?: boolean;
};

export async function getCurrentUserCompany() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as Company | null;
}

export async function createCompany(data: CreateCompanyData) {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Usuário não autenticado.");
  }

  const { data: company, error } = await supabase
    .from("companies")
    .insert({
      owner_id: user.id,
      name: data.name,
      slug: data.slug,
      business_type: data.business_type,
      description: data.description || null,
      public_booking_enabled: true,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return company as Company;
}

export async function updateCompany(companyId: string, data: UpdateCompanyData) {
  const { data: company, error } = await supabase
    .from("companies")
    .update(data)
    .eq("id", companyId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return company as Company;
}

export async function getPublicCompanyBySlug(slug: string) {
  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .eq("slug", slug)
    .eq("public_booking_enabled", true)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Company;
}