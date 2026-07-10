import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import { getCompanyContext } from "@/lib/company";
import { untyped, integratiesSettingsUrl } from "@/lib/integraties";
import { oauthConfig, oauthRedirectUri } from "@/lib/oauth";

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

  const { supabase, companyId } = await getCompanyContext();
  if (!companyId) {
    return NextResponse.redirect(new URL("/login", req.nextUrl.origin));
  }

  const { data } = await untyped(supabase)
    .from("integraties")
    .select("config")
    .eq("bedrijf_id", companyId)
    .eq("provider", provider)
    .maybeSingle();

  const config = (data?.config ?? {}) as Record<string, string>;
  if (!config.clientId) {
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
  authorizeUrl.searchParams.set("client_id", config.clientId);
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
