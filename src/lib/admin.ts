import { supabase } from "./supabase";

export async function isCurrentUserAdmin() {
  const { data, error } = await supabase.rpc("is_admin");

  if (error) {
    return false;
  }

  return Boolean(data);
}