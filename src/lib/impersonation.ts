import crypto from "node:crypto";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isPlatformAdmin } from "@/lib/platform-admin";
import { untyped } from "@/lib/integraties";

export const IMPERSONATION_COOKIE = "archon_impersonation";
const SESSION_SECONDS = 60 * 60; // 1 uur

type ImpersonationPayload = {
  adminUserId: string;
  targetCompanyId: number;
  expiresAt: number;
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

export async function startImpersonation(
  targetCompanyId: number,
): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Niet ingelogd." };

  const allowed = await isPlatformAdmin(user.id, user.email);
  if (!allowed) return { error: "Geen platform-admin rechten." };

  const payload: ImpersonationPayload = {
    adminUserId: user.id,
    targetCompanyId,
    expiresAt: Date.now() + SESSION_SECONDS * 1000,
  };

  const cookieStore = await cookies();
  cookieStore.set(IMPERSONATION_COOKIE, encode(payload), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_SECONDS,
  });

  const serviceSupabase = createServiceClient();
  const { error: logError } = await untyped(serviceSupabase)
    .from("admin_impersonation_log")
    .insert({ admin_user_id: user.id, target_company_id: targetCompanyId });
  if (logError) {
    console.error("admin_impersonation_log insert:", logError.message);
  }

  return { ok: true };
}

export async function stopImpersonation(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(IMPERSONATION_COOKIE);
}

export async function getImpersonationContext(): Promise<{
  adminUserId: string;
  targetCompanyId: number;
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
  if (payload.expiresAt < Date.now()) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.id !== payload.adminUserId) return null;

  const allowed = await isPlatformAdmin(user.id, user.email);
  if (!allowed) return null;

  return { adminUserId: payload.adminUserId, targetCompanyId: payload.targetCompanyId };
}
