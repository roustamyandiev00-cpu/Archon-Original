import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import { requireAdminAccess } from "@/components/dashboard/context";
import {
  isPlatformOAuthProvider,
  untyped,
  integratiesSettingsUrl,
} from "@/lib/integraties";
import { oauthConfig, oauthRedirectUri } from "@/lib/oauth";
import { getPlatformOAuthCredentials } from "@/components/dashboard/integraties/platformOAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ provider: string }> },
) {
  const { provider } = await ctx.params;
  const cfg = oauthConfig(provider);
  const dashboard = integratiesSettingsUrl(req.nextUrl.origin);
  if (!cfg) {
    dashboard.searchParams.set("error", "Onbekende OAuth-provider.");
    return NextResponse.redirect(dashboard);
  }

  const access = await requireAdminAccess();
  if ("error" in access) {
    dashboard.searchParams.set("error", access.error);
    return NextResponse.redirect(dashboard);
  }
  const { supabase, companyId } = access;

  const { data } = await untyped(supabase)
    .from("integraties")
    .select("config")
    .eq("bedrijf_id", companyId)
    .eq("provider", provider)
    .maybeSingle();

  let config = (data?.config ?? {}) as Record<string, string>;

  if (isPlatformOAuthProvider(provider)) {
    const platform = getPlatformOAuthCredentials(provider);
    if (!platform) {
      dashboard.searchParams.set(
        "error",
        `${provider}: platform-credentials ontbreken in .env.`,
      );
      return NextResponse.redirect(dashboard);
    }

    const now = new Date().toISOString();
    config = { ...config, authMode: "platform" };
    delete config.clientId;
    delete config.clientSecret;

    const persistResult = data
      ? await untyped(supabase)
        .from("integraties")
        .update({
          config,
          status: config.tokens ? "connected" : "configured",
          updated_at: now,
        })
        .eq("bedrijf_id", companyId)
        .eq("provider", provider)
      : await untyped(supabase).from("integraties").insert({
          bedrijf_id: companyId,
          provider,
          status: "configured",
          config,
          created_at: now,
          updated_at: now,
        });

    if (persistResult.error) {
      dashboard.searchParams.set("error", persistResult.error.message);
      return NextResponse.redirect(dashboard);
    }
  }

  const clientId = isPlatformOAuthProvider(provider)
    ? getPlatformOAuthCredentials(provider)?.clientId
    : config.clientId;
  if (!clientId) {
    dashboard.searchParams.set(
      "error",
      "Configureer eerst Client ID en Client Secret.",
    );
    return NextResponse.redirect(dashboard);
  }

  const state = randomUUID();
  const cookieStore = await cookies();
  cookieStore.set(`pp_oauth_state_${provider}`, state, {
    httpOnly: true,
    secure: req.nextUrl.protocol === "https:",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  const authorizeUrl = new URL(cfg.authorizeUrl);
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set(
    "redirect_uri",
    oauthRedirectUri(req.nextUrl.origin, provider),
  );
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("state", state);
  if (cfg.scope) authorizeUrl.searchParams.set("scope", cfg.scope);
  for (const [k, v] of Object.entries(cfg.extraAuthParams ?? {})) {
    authorizeUrl.searchParams.set(k, v);
  }

  return NextResponse.redirect(authorizeUrl);
}
