import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { getTokenResponse } from "@vercel/connect";
import { getCompanyContext } from "@/lib/company";
import { untyped } from "@/lib/integraties";
import { slackTokenParams } from "@/components/dashboard/integraties/slackConnect";
import { resolveSlackConnectorForCompany } from "@/components/dashboard/integraties/slackSetup";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COOKIE = "pp_slack_connect_company";

export async function GET(req: NextRequest) {
  const dashboard = new URL("/dashboard/integraties", req.nextUrl.origin);

  const providerError = req.nextUrl.searchParams.get("error");
  if (providerError) {
    dashboard.searchParams.set("error", `Slack: ${providerError}`);
    return NextResponse.redirect(dashboard);
  }

  const cookieStore = await cookies();
  const companyIdRaw = cookieStore.get(COOKIE)?.value;
  cookieStore.delete(COOKIE);

  const expectedCompanyId = companyIdRaw ? Number(companyIdRaw) : NaN;
  const { supabase, companyId } = await getCompanyContext();

  if (!companyId || !Number.isFinite(expectedCompanyId) || companyId !== expectedCompanyId) {
    dashboard.searchParams.set("error", "Slack-koppeling verlopen. Probeer opnieuw.");
    return NextResponse.redirect(dashboard);
  }

  const { data } = await untyped(supabase)
    .from("integraties")
    .select("config")
    .eq("bedrijf_id", companyId)
    .eq("provider", "slack")
    .maybeSingle();

  const existing = (data?.config ?? {}) as Record<string, unknown>;
  const connector = resolveSlackConnectorForCompany(existing);
  if (!connector) {
    dashboard.searchParams.set("error", "Slack-connector niet gevonden.");
    return NextResponse.redirect(dashboard);
  }

  try {
    // Geen bestaande installationId: na installatie geeft Connect de nieuwe tenant.
    const response = await getTokenResponse(
      connector,
      slackTokenParams(),
      { forceRefresh: true },
    );

    if (!response.installationId) {
      dashboard.searchParams.set(
        "error",
        "Slack-workspace gekoppeld maar installatie-id ontbreekt. Probeer opnieuw.",
      );
      return NextResponse.redirect(dashboard);
    }

    const now = new Date().toISOString();
    const { error } = await untyped(supabase)
      .from("integraties")
      .upsert(
        {
          bedrijf_id: companyId,
          provider: "slack",
          status: "connected",
          config: {
            ...existing,
            connectorUid: connector,
            installationId: response.installationId,
            workspaceName: response.name ?? existing.workspaceName,
            tenantId: response.tenantId ?? existing.tenantId,
            testSentAt: null,
          },
          connected_at: now,
          updated_at: now,
        },
        { onConflict: "bedrijf_id,provider" },
      );

    if (error) {
      dashboard.searchParams.set("error", error.message);
      return NextResponse.redirect(dashboard);
    }

    dashboard.searchParams.set("connected", "slack");
    return NextResponse.redirect(dashboard);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Slack-workspace koppelen mislukt.";
    dashboard.searchParams.set("error", message);
    return NextResponse.redirect(dashboard);
  }
}
