export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "canceled"
  | "completed";

export type CompanyReview = {
  id: string;
  name: string;
  rating: number;
  comment: string;
};

export type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
};

export type Company = {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  business_type: string | null;
  description: string | null;
  logo_url: string | null;
  cover_url: string | null;
  whatsapp: string | null;
  instagram: string | null;
  address: string | null;
  amenities: string[];
  reviews: CompanyReview[];
  public_booking_enabled: boolean;
  created_at: string;
  updated_at: string;
};

export type Service = {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type AvailabilityRule = {
  id: string;
  company_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Customer = {
  id: string;
  company_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
};

export type Appointment = {
  id: string;
  company_id: string;
  service_id: string;
  customer_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
};