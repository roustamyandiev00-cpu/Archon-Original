"use server";

import { createMutableServerClient } from "@/lib/supabase/server";
import { isPlatformAdmin } from "@/lib/platform-admin";
import { pickPostLoginPath } from "@/lib/auth/post-login-redirect";

export type SignInResult =
  | { ok: true; destination: string }
  | { ok: false; error: string };

/**
 * Snelle wachtwoord-login: alleen auth + landingspad.
 * Geen provision/onboarding hier — dat gebeurt op het dashboard.
 */
export async function signInWithPasswordAction(input: {
  email: string;
  password: string;
  redirectTo?: string | null;
}): Promise<SignInResult> {
  const email = input.email.trim();
  const password = input.password;

  if (!email || !password) {
    return { ok: false, error: "Vul e-mail en wachtwoord in." };
  }

  const supabase = await createMutableServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  const user = data.user;
  if (!user) {
    return { ok: false, error: "Inloggen mislukt. Probeer opnieuw." };
  }

  const admin = await isPlatformAdmin(user.id, user.email);
  const destination = pickPostLoginPath({
    isPlatformAdmin: admin,
    requested: input.redirectTo,
  });

  return { ok: true, destination };
}
