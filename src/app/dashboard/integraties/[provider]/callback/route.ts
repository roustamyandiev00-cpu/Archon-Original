import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { requireAdminAccess } from "@/components/dashboard/context";
import {
  isPlatformOAuthProvider,
  untyped,
  integratiesSettingsUrl,
} from "@/lib/integraties";
import {
  exchangeCodeForTokens,
  fetchAccountName,
  oauthConfig,
  oauthRedirectUri,
} from "@/lib/oauth";
import { getPlatformOAuthCredentials } from "@/components/dashboard/integraties/platformOAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ provider: string }> },
) {
  const { provider } = await ctx.params;
  const dashboard = integratiesSettingsUrl(req.nextUrl.origin);

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
  const config = (data?.config ?? {}) as Record<string, string>;

  let clientId = config.clientId;
  let clientSecret = config.clientSecret;
  if (isPlatformOAuthProvider(provider)) {
    const platform = getPlatformOAuthCredentials(provider);
    if (platform) {
      clientId = platform.clientId;
      clientSecret = platform.clientSecret;
    }
  }

  if (!clientId || !clientSecret) {
    dashboard.searchParams.set("error", "Client-gegevens ontbreken.");
    return NextResponse.redirect(dashboard);
  }

  const result = await exchangeCodeForTokens(provider, {
    code,
    clientId,
    clientSecret,
    redirectUri: oauthRedirectUri(req.nextUrl.origin, provider),
  });

  if (!result.ok) {
    dashboard.searchParams.set("error", result.error);
    return NextResponse.redirect(dashboard);
  }

  const now = new Date().toISOString();
  const extraConfig: Record<string, unknown> = { tokens: result.tokens };

  if (isPlatformOAuthProvider(provider)) {
    extraConfig.authMode = "platform";
    const identity = await fetchAccountName(
      provider,
      result.tokens.access_token,
    );
    if (identity.ok && identity.account) {
      extraConfig.accountEmail = identity.account;
    }
  } else {
    extraConfig.clientId = clientId;
    extraConfig.clientSecret = clientSecret;
  }

  if (provider === "quickbooks") {
    const realmId = req.nextUrl.searchParams.get("realmId");
    if (realmId) extraConfig.realmId = realmId;
  }

  if (provider === "exact-online") {
    try {
      const meRes = await fetch(
        "https://start.exactonline.be/api/v1/current/Me?$select=CurrentDivision",
        {
          headers: {
            Authorization: `Bearer ${result.tokens.access_token}`,
            Accept: "application/json",
          },
        },
      );
      const meJson = (await meRes.json()) as {
        d?: { results?: { CurrentDivision?: number }[] };
      };
      const division = meJson.d?.results?.[0]?.CurrentDivision;
      if (division) extraConfig.division = String(division);
    } catch {
      // Divisie kan later bij eerste export worden opgehaald.
    }
  }

  const { error } = await untyped(supabase)
    .from("integraties")
    .update({
      status: "connected",
      config: { ...config, ...extraConfig },
      connected_at: now,
      updated_at: now,
    })
    .eq("bedrijf_id", companyId)
    .eq("provider", provider);

  if (error) {
    dashboard.searchParams.set("error", error.message);
    return NextResponse.redirect(dashboard);
  }

  if (provider === "google-calendar") {
    const agenda = new URL("/dashboard/agenda", req.nextUrl.origin);
    agenda.searchParams.set("connected", provider);
    return NextResponse.redirect(agenda);
  }

  dashboard.searchParams.set("connected", provider);
  return NextResponse.redirect(dashboard);
}
