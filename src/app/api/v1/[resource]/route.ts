import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/database.types";
import { hashApiKey } from "@/lib/apiKeys";
import { API_RESOURCE_IDS } from "@/lib/apiResources";

export const dynamic = "force-dynamic";

/**
 * Lichtgewicht Supabase-client zonder sessie/cookies. De data-toegang loopt via
 * de SECURITY DEFINER-functie `api_v1_fetch`, die de sleutel-hash valideert en
 * uitsluitend data van het bijbehorende bedrijf teruggeeft.
 */
function apiClient() {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } },
  );
}

function extractKey(req: NextRequest): string | null {
  const auth = req.headers.get("authorization");
  if (auth && auth.toLowerCase().startsWith("bearer ")) {
    return auth.slice(7).trim();
  }
  const header = req.headers.get("x-api-key");
  return header ? header.trim() : null;
}

function json(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ resource: string }> },
) {
  const { resource } = await ctx.params;

  if (!API_RESOURCE_IDS.includes(resource)) {
    return json(
      { error: "unknown_resource", message: `Onbekende resource '${resource}'.` },
      404,
    );
  }

  const key = extractKey(req);
  if (!key) {
    return json(
      {
        error: "missing_key",
        message:
          "Geef je API-sleutel mee via de header 'Authorization: Bearer <sleutel>'.",
      },
      401,
    );
  }

  const url = new URL(req.url);
  const parsedLimit = Number(url.searchParams.get("limit") ?? 50);
  const parsedOffset = Number(url.searchParams.get("offset") ?? 0);

  const supabase = apiClient();
  const { data, error } = await supabase.rpc("api_v1_fetch", {
    p_hash: hashApiKey(key),
    p_resource: resource,
    p_limit: Number.isFinite(parsedLimit) ? parsedLimit : 50,
    p_offset: Number.isFinite(parsedOffset) ? parsedOffset : 0,
  });

  if (error) {
    return json({ error: "server_error", message: error.message }, 500);
  }

  const result = (data ?? {}) as { error?: string; data?: unknown };

  if (result.error === "invalid_key") {
    return json(
      { error: "invalid_key", message: "Ongeldige of ingetrokken API-sleutel." },
      401,
    );
  }
  if (result.error === "forbidden") {
    return json(
      {
        error: "forbidden",
        message: `Deze sleutel heeft geen toegang tot '${resource}'.`,
      },
      403,
    );
  }
  if (result.error === "unknown_resource") {
    return json({ error: "unknown_resource" }, 404);
  }

  return json({ resource, data: result.data ?? null });
}
