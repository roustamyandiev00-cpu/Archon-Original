import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { getCompanyContext } from "@/lib/company";
import { untyped } from "@/lib/integraties";
import { exchangeCodeForTokens, oauthConfig, oauthRedirectUri } from "@/lib/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ provider: string }> },
) {
  const { provider } = await ctx.params;
  const dashboard = new URL("/dashboard/integraties", req.nextUrl.origin);

  const cfg = oauthConfig(provider);
  if (!cfg) {
    dashboard.searchParams.set("error", "Onbekende OAuth-provider.");
    return NextResponse.redirect(dashboard);
  }

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const providerError = req.nextUrl.searchParams.get("error");
  if (providerError) {
    dashboard.searchParams.set("error", `${provider}: ${providerError}`);
    return NextResponse.redirect(dashboard);
  }

  const cookieStore = await cookies();
  const cookieName = `pp_oauth_state_${provider}`;
  const savedState = cookieStore.get(cookieName)?.value;
  cookieStore.delete(cookieName);
  if (!code || !state || !savedState || state !== savedState) {
    dashboard.searchParams.set("error", "Autorisatie ongeldig of verlopen.");
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
  if (!config.clientId || !config.clientSecret) {
    dashboard.searchParams.set("error", "Client-gegevens ontbreken.");
    return NextResponse.redirect(dashboard);
  }

  const result = await exchangeCodeForTokens(provider, {
    code,
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    redirectUri: oauthRedirectUri(req.nextUrl.origin, provider),
  });

  if (!result.ok) {
    dashboard.searchParams.set("error", result.error);
    return NextResponse.redirect(dashboard);
  }

  const now = new Date().toISOString();
  const { error } = await untyped(supabase)
    .from("integraties")
    .update({
      status: "connected",
      config: { ...config, tokens: result.tokens },
      connected_at: now,
      updated_at: now,
    })
    .eq("bedrijf_id", companyId)
    .eq("provider", provider);

  if (error) {
    dashboard.searchParams.set("error", error.message);
    return NextResponse.redirect(dashboard);
  }

  dashboard.searchParams.set("connected", provider);
  return NextResponse.redirect(dashboard);
}
