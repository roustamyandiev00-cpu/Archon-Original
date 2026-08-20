"use server";

import { createClient } from "@/lib/supabase/server";
import { isPlatformAdmin } from "@/lib/platform-admin";
import { safeDashboardDestination } from "@/lib/auth/destination";

const DEFAULT_DASHBOARD_PATH = "/dashboard/command-center";
const CONNECTION_ERROR_MESSAGE =
  "De verbinding met de inlogdienst is mislukt. Controleer je internetverbinding en probeer opnieuw.";

function isConnectionErrorMessage(message: string | undefined): boolean {
  const normalized = message?.toLowerCase() ?? "";
  return (
    normalized.includes("fetch failed") ||
    normalized.includes("network") ||
    normalized.includes("timeout") ||
    normalized.includes("econnrefused") ||
    normalized.includes("enotfound") ||
    normalized.includes("connect timeout")
  );
}

async function destinationForUser(
  user: { id: string; email?: string | null },
  requested: string,
): Promise<string> {
  if (await isPlatformAdmin(user.id, user.email)) {
    return "/admin";
  }

  return safeDashboardDestination(requested) ?? DEFAULT_DASHBOARD_PATH;
}

export async function resolvePostLoginDestination(
  requested: string,
): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return "/login";

  return destinationForUser(user, requested);
}

export async function signInWithPasswordAction(input: {
  email: string;
  password: string;
  requested: string;
}): Promise<{ destination?: string; error?: string }> {
  const email = input.email.trim().toLowerCase();
  if (!email || !input.password) {
    return { error: "Vul je e-mailadres en wachtwoord in." };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: input.password,
    });

    if (error || !data.user) {
      if (isConnectionErrorMessage(error?.message)) {
        return { error: CONNECTION_ERROR_MESSAGE };
      }
      if (
        error?.message.toLowerCase().includes("invalid login credentials") ||
        error?.message.toLowerCase().includes("invalid credentials")
      ) {
        return { error: "E-mailadres of wachtwoord is niet correct." };
      }
      return { error: error?.message ?? "Inloggen is mislukt." };
    }

    const destination = await destinationForUser(data.user, input.requested);
    if (destination !== "/admin") {
      await supabase.rpc("ensure_user_referral", {
        p_user_id: data.user.id,
        p_full_name:
          (data.user.user_metadata?.full_name as string | undefined) ??
          undefined,
        p_referred_by:
          (data.user.user_metadata?.referred_by as string | undefined) ??
          undefined,
      });
    }

    return { destination };
  } catch (error) {
    console.error(
      "Loginverbinding mislukt:",
      error instanceof Error ? error.message : "onbekende fout",
    );
    return { error: CONNECTION_ERROR_MESSAGE };
  }
}
