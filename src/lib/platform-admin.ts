import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

function bootstrapEmails(): string[] {
  const raw = process.env.PLATFORM_ADMIN_EMAILS?.trim();
  if (!raw) return [];
  return raw
    .replace(/^["']|["']$/g, "")
    .split(",")
    .map((email) => email.trim().toLowerCase().replace(/^["']|["']$/g, ""))
    .filter(Boolean);
}

export async function isPlatformAdmin(
  userId?: string,
  email?: string | null,
): Promise<boolean> {
  if (email && bootstrapEmails().includes(email.toLowerCase())) {
    return true;
  }

  if (!userId) return false;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("is_platform_admin", {
    p_user_id: userId,
  });

  if (error) {
    console.error("is_platform_admin:", error.message);
    return false;
  }

  return Boolean(data);
}

export async function requirePlatformAdmin(): Promise<{
  user: User;
  serviceSupabase: ReturnType<typeof createServiceClient>;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/admin");
  }

  const allowed = await isPlatformAdmin(user.id, user.email);
  if (!allowed) {
    redirect("/dashboard/command-center");
  }

  return {
    user,
    serviceSupabase: createServiceClient(),
  };
}
