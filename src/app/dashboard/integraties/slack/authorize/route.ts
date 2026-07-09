import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { startAuthorization } from "@vercel/connect";
import { getCompanyContext } from "@/lib/company";
import { untyped } from "@/lib/integraties";
import {
  resolveSlackConnectorUid,
  slackTokenParams,
} from "@/components/dashboard/integraties/slackConnect";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COOKIE = "pp_slack_connect_company";

export async function GET(req: NextRequest) {
  const dashboard = new URL("/dashboard/integraties", req.nextUrl.origin);

  const { supabase, companyId } = await getCompanyContext();
  if (!companyId) {
    return NextResponse.redirect(new URL("/login", req.nextUrl.origin));
  }

  const { data } = await untyped(supabase)
    .from("integraties")
    .select("config")
    .eq("bedrijf_id", companyId)
    .eq("provider", "slack")
    .maybeSingle();

  const config = (data?.config ?? {}) as Record<string, unknown>;
  const connector = resolveSlackConnectorUid(config);
  if (!connector) {
    dashboard.searchParams.set(
      "error",
      "Slack-connector ontbreekt. Stel SLACK_CONNECTOR in of vul de connector-UID in.",
    );
    return NextResponse.redirect(dashboard);
  }

  const callbackUrl = new URL(
    "/dashboard/integraties/slack/callback",
    req.nextUrl.origin,
  ).toString();

  try {
    const { url } = await startAuthorization(connector, slackTokenParams(), {
      callbackUrl,
    });

    const cookieStore = await cookies();
    cookieStore.set(COOKIE, String(companyId), {
      httpOnly: true,
      secure: req.nextUrl.protocol === "https:",
      sameSite: "lax",
      path: "/",
      maxAge: 600,
    });

    return NextResponse.redirect(url);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Slack-autorisatie mislukt.";
    dashboard.searchParams.set("error", message);
    return NextResponse.redirect(dashboard);
  }
}
