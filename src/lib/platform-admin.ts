import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

function normalizeEmail(value: string | null | undefined): string | null {
  const email = value?.trim().toLowerCase();
  return email || null;
}

function isBootstrapEnabled(): boolean {
  const raw = process.env.PLATFORM_ADMIN_BOOTSTRAP_ENABLED?.trim().toLowerCase();
  return raw === "1" || raw === "true" || raw === "yes";
}

/** Bootstrap-admins via env — alleen wanneer PLATFORM_ADMIN_BOOTSTRAP_ENABLED aan staat. */
function bootstrapPlatformAdminEmails(): string[] {
  if (!isBootstrapEnabled()) return [];

  const emails = new Set<string>();
  const ceo = normalizeEmail(process.env.PLATFORM_CEO_EMAIL);
  if (ceo) emails.add(ceo);

  for (const part of (process.env.PLATFORM_ADMIN_EMAILS ?? "").split(",")) {
    const email = normalizeEmail(part);
    if (email) emails.add(email);
  }

  return [...emails];
}

let bootstrapWarningLogged = false;
const auditedBootstrapUsers = new Set<string>();

function warnBootstrapInProduction(): void {
  if (process.env.NODE_ENV !== "production") return;
  if (bootstrapWarningLogged) return;
  if (!isBootstrapEnabled()) return;
  bootstrapWarningLogged = true;
  console.warn(
    "[security] PLATFORM_ADMIN_BOOTSTRAP_ENABLED staat aan in productie. Gebruik databaseplatform-admins (is_platform_admin) en schakel bootstrap uit zodra mogelijk.",
  );
}

async function auditBootstrapAccess(userId: string, email: string): Promise<void> {
  if (auditedBootstrapUsers.has(userId)) return;
  auditedBootstrapUsers.add(userId);

  console.warn("[security] platform admin bootstrap access", {
    userId,
    email,
    source: "PLATFORM_ADMIN_BOOTSTRAP_ENABLED",
  });

  // audit_logs vereist een geldige company_id (FK). Platform-bootstrap heeft die niet;
  // we loggen daarom best-effort zonder de auth-beslissing te blokkeren.
  try {
    const service = createServiceClient();
    const { data: membership } = await service
      .from("company_memberships")
      .select("company_id")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();

    const companyId =
      typeof membership?.company_id === "number" ? membership.company_id : null;
    if (!companyId) return;

    const { error } = await service.from("audit_logs").insert({
      company_id: companyId,
      actor_id: userId,
      event_category: "platform_admin",
      event_type: "platform.admin.bootstrap_access",
      severity: "warn",
      target_type: "user",
      target_id: userId,
      metadata: {
        email,
        bootstrap: true,
        source: "PLATFORM_ADMIN_BOOTSTRAP_ENABLED",
      },
    });
    if (error) {
      console.error("platform admin bootstrap audit:", error.message);
    }
  } catch (error) {
    console.error(
      "platform admin bootstrap audit failed:",
      error instanceof Error ? error.message : "onbekend",
    );
  }
}

export async function isPlatformAdmin(
  userId?: string,
  email?: string | null,
): Promise<boolean> {
  warnBootstrapInProduction();

  const bootstrapEmails = bootstrapPlatformAdminEmails();
  const normalizedEmail = normalizeEmail(email);

  // Bootstrap is additief: een niet-matchend e-mailadres mag een geldige
  // platform_admins-rij nooit blokkeren, anders sluit een aanstaande bootstrap
  // de echte CEO buiten.
  if (bootstrapEmails.length > 0 && userId && normalizedEmail) {
    if (bootstrapEmails.includes(normalizedEmail)) {
      await auditBootstrapAccess(userId, normalizedEmail);
      return true;
    }
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
