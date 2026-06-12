import { supabase } from "./supabase";
import { getCurrentUser } from "./auth";
import type { Company, CompanyReview } from "../types";

type CreateCompanyData = {
  name: string;
  slug: string;
  business_type: string;
  description?: string;
  logo_url?: string;
  cover_url?: string;
  whatsapp?: string;
  instagram?: string;
  address?: string;
  amenities?: string[];
  reviews?: CompanyReview[];
};

type UpdateCompanyData = {
  name?: string;
  slug?: string;
  business_type?: string | null;
  description?: string | null;
  logo_url?: string | null;
  cover_url?: string | null;
  whatsapp?: string | null;
  instagram?: string | null;
  address?: string | null;
  amenities?: string[];
  reviews?: CompanyReview[];
  public_booking_enabled?: boolean;
};

export type PublicBookingStatusReason =
  | "ok"
  | "company_not_found"
  | "booking_disabled"
  | "plan_inactive";

export type PublicBookingStatus = {
  can_book: boolean;
  reason: PublicBookingStatusReason;
  company_id: string | null;
  owner_id: string | null;
  name: string | null;
  slug: string | null;
  business_type: string | null;
  description: string | null;
  logo_url: string | null;
  cover_url: string | null;
  whatsapp: string | null;
  instagram: string | null;
  address: string | null;
  amenities: string[] | null;
  reviews: CompanyReview[] | null;
  public_booking_enabled: boolean | null;
  created_at: string | null;
  updated_at: string | null;
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

  return {
    ...data,
    amenities: data?.amenities || [],
    reviews: data?.reviews || [],
  } as Company | null;
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
      logo_url: data.logo_url || null,
      cover_url: data.cover_url || null,
      whatsapp: data.whatsapp || null,
      instagram: data.instagram || null,
      address: data.address || null,
      amenities: data.amenities || [],
      reviews: data.reviews || [],
      public_booking_enabled: true,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

const TRIAL_PLAN_ID = import.meta.env.VITE_TRIAL_PLAN_ID;

  const { error: subscriptionError } = await supabase
    .from("company_subscriptions")
    .insert({
      company_id: company.id,
      plan_id: TRIAL_PLAN_ID,
      status: "trial",
      started_at: new Date().toISOString(),
      ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      billing_status: "trial",
    });

  if (subscriptionError) {
    throw new Error(subscriptionError.message);
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

export async function getPublicBookingStatus(slug: string) {
  const { data, error } = await supabase.rpc("get_public_booking_status", {
    target_slug: slug,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data?.[0] as PublicBookingStatus;
}

export async function getPublicCompanyBySlug(slug: string) {
  const status = await getPublicBookingStatus(slug);

  if (!status || !status.can_book) {
    throw new Error(
      "Empresa não encontrada, página desativada ou plano inativo."
    );
  }

  return {
    id: status.company_id,
    owner_id: status.owner_id,
    name: status.name,
    slug: status.slug,
    business_type: status.business_type,
    description: status.description,
    logo_url: status.logo_url,
    cover_url: status.cover_url,
    whatsapp: status.whatsapp,
    instagram: status.instagram,
    address: status.address,
    amenities: status.amenities || [],
    reviews: status.reviews || [],
    public_booking_enabled: status.public_booking_enabled,
    created_at: status.created_at,
    updated_at: status.updated_at,
  } as Company;
}