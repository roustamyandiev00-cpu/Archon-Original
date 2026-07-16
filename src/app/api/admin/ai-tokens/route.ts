import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isPlatformAdmin } from "@/lib/platform-admin";
import {
  bulkUpdateTrialLimits,
  grantCompanyTokens,
  updateCompanyTokenLimit,
} from "@/lib/admin/ai-tokens";

type UpdateLimitBody = {
  action: "update_limit";
  companyId: number;
  tokenLimit: number | null;
};

type GrantTokensBody = {
  action: "grant_tokens";
  companyId: number;
  tokensToAdd: number;
  note?: string;
};

type BulkUpdateBody = {
  action: "bulk_update_trial";
  tokenLimit: number;
};

type RequestBody = UpdateLimitBody | GrantTokensBody | BulkUpdateBody;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isAdmin = await isPlatformAdmin(user.id, user.email);
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const serviceSupabase = createServiceClient();

  switch (body.action) {
    case "update_limit": {
      const result = await updateCompanyTokenLimit(
        serviceSupabase,
        body.companyId,
        body.tokenLimit,
      );
      if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: 500 });
      }
      return NextResponse.json({ ok: true });
    }

    case "grant_tokens": {
      const result = await grantCompanyTokens(
        serviceSupabase,
        body.companyId,
        body.tokensToAdd,
        body.note,
      );
      if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: 500 });
      }
      return NextResponse.json({ ok: true });
    }

    case "bulk_update_trial": {
      const result = await bulkUpdateTrialLimits(serviceSupabase, body.tokenLimit);
      if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: 500 });
      }
      return NextResponse.json({ ok: true, updated: result.updated });
    }

    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}
