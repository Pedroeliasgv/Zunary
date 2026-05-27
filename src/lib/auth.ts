import { supabase } from "./supabase";

type SignUpData = {
  fullName: string;
  email: string;
  password: string;
};

type SignInData = {
  email: string;
  password: string;
};

export async function signUpWithEmail(data: SignUpData) {
  const { error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        full_name: data.fullName,
      },
    },
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function signInWithEmail(data: SignInData) {
  const { error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(error.message);
  }
}

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    return null;
  }

  return data.user;
}