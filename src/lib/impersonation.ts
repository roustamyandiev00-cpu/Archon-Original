import crypto from "node:crypto";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isPlatformAdmin } from "@/lib/platform-admin";

export const IMPERSONATION_COOKIE = "archon_impersonation";
const SESSION_SECONDS = 30 * 60; // 30 minuten

type ImpersonationPayload = {
  adminUserId: string;
  targetCompanyId: number;
  expiresAt: number;
  reason?: string;
};

function getSecret(): string {
  const secret = process.env.IMPERSONATION_SECRET?.trim();
  if (!secret) {
    throw new Error("IMPERSONATION_SECRET niet geconfigureerd.");
  }
  return secret;
}

function sign(body: string): string {
  return crypto.createHmac("sha256", getSecret()).update(body).digest("base64url");
}

function encode(payload: ImpersonationPayload): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

function decode(raw: string): ImpersonationPayload | null {
  const [body, signature] = raw.split(".");
  if (!body || !signature) return null;

  const expected = sign(body);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (
      typeof payload?.adminUserId === "string" &&
      typeof payload?.targetCompanyId === "number" &&
      typeof payload?.expiresAt === "number"
    ) {
      return payload as ImpersonationPayload;
    }
    return null;
  } catch {
    return null;
  }
}

async function writeImpersonationAudit(input: {
  companyId: number;
  actorId: string;
  eventType: string;
  reason?: string;
  outcome: string;
}): Promise<{ error?: string }> {
  const { error } = await createServiceClient()
    .from("audit_logs")
    .insert({
      company_id: input.companyId,
      actor_id: input.actorId,
      event_category: "platform_admin",
      event_type: input.eventType,
      severity: "warn",
      target_type: "company",
      target_id: String(input.companyId),
      metadata: {
        outcome: input.outcome,
        ...(input.reason ? { reason: input.reason } : {}),
      },
    });
  if (error) {
    console.error(input.eventType, error.message);
    return { error: error.message };
  }
  return {};
}

export async function startImpersonation(
  targetCompanyId: number,
  reason?: string,
): Promise<{ ok: true } | { error: string }> {
  if (!Number.isSafeInteger(targetCompanyId) || targetCompanyId <= 0) {
    return { error: "Ongeldig bedrijf." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Niet ingelogd." };

  const allowed = await isPlatformAdmin(user.id, user.email);
  if (!allowed) return { error: "Geen platform-admin rechten." };

  const serviceSupabase = createServiceClient();
  const { data: company, error: companyError } = await serviceSupabase
    .from("bedrijven")
    .select("id")
    .eq("id", targetCompanyId)
    .maybeSingle();

  if (companyError) {
    console.error("impersonation company lookup:", companyError.message);
    return { error: "Bedrijf kon niet veilig worden gecontroleerd." };
  }
  if (!company) return { error: "Bedrijf niet gevonden." };

  // Blokkeer impersonatie van bedrijven waar een andere platform-CEO lid is.
  const { data: members } = await serviceSupabase
    .from("company_memberships")
    .select("user_id")
    .eq("company_id", targetCompanyId);

  const memberIds = (members ?? [])
    .map((row) => row.user_id as string | undefined)
    .filter((id): id is string => Boolean(id) && id !== user.id);

  if (memberIds.length > 0) {
    const { data: otherAdmins } = await serviceSupabase
      .from("platform_admins")
      .select("user_id")
      .eq("role", "ceo")
      .in("user_id", memberIds);

    if ((otherAdmins ?? []).length > 0) {
      return {
        error:
          "Impersonatie van een bedrijf met een andere platform-admin is niet toegestaan.",
      };
    }
  }

  const trimmedReason = reason?.trim() || undefined;

  const { error: logError } = await serviceSupabase
    .from("admin_impersonation_log")
    .insert({
      admin_user_id: user.id,
      target_company_id: targetCompanyId,
    });
  if (logError) {
    console.error("admin_impersonation_log insert:", logError.message);
    return { error: "Impersonatie kon niet veilig worden gelogd." };
  }

  const audit = await writeImpersonationAudit({
    companyId: targetCompanyId,
    actorId: user.id,
    eventType: "platform.impersonation.started",
    reason: trimmedReason,
    outcome: "started",
  });
  if (audit.error) {
    return { error: "Impersonatie kon niet veilig worden gelogd." };
  }

  const payload: ImpersonationPayload = {
    adminUserId: user.id,
    targetCompanyId,
    expiresAt: Date.now() + SESSION_SECONDS * 1000,
    ...(trimmedReason ? { reason: trimmedReason } : {}),
  };

  const cookieStore = await cookies();
  cookieStore.set(IMPERSONATION_COOKIE, encode(payload), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_SECONDS,
  });

  return { ok: true };
}

export async function stopImpersonation(): Promise<void> {
  const context = await getImpersonationContext();
  if (context) {
    await writeImpersonationAudit({
      companyId: context.targetCompanyId,
      actorId: context.adminUserId,
      eventType: "platform.impersonation.stopped",
      reason: context.reason,
      outcome: "completed",
    });
  }

  const cookieStore = await cookies();
  cookieStore.delete(IMPERSONATION_COOKIE);
}

export async function getImpersonationContext(): Promise<{
  adminUserId: string;
  targetCompanyId: number;
  reason?: string;
} | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(IMPERSONATION_COOKIE)?.value;
  if (!raw) return null;

  let payload: ImpersonationPayload | null;
  try {
    payload = decode(raw);
  } catch {
    return null;
  }
  if (!payload) return null;
  if (payload.expiresAt < Date.now()) {
    cookieStore.delete(IMPERSONATION_COOKIE);
    return null;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.id !== payload.adminUserId) return null;

  const allowed = await isPlatformAdmin(user.id, user.email);
  if (!allowed) return null;

  return {
    adminUserId: payload.adminUserId,
    targetCompanyId: payload.targetCompanyId,
    ...(payload.reason ? { reason: payload.reason } : {}),
  };
}
