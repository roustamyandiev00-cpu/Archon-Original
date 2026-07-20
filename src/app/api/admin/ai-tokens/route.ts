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
  idempotencyKey: string;
  note?: string;
};

type BulkUpdateBody = {
  action: "bulk_update_trial";
  tokenLimit: number;
};

type RequestBody = UpdateLimitBody | GrantTokensBody | BulkUpdateBody;

const MAX_TOKEN_LIMIT = 1_000_000_000;
const MAX_SINGLE_GRANT = 10_000_000;
const MAX_NOTE_LENGTH = 500;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isCompanyId(value: unknown): value is number {
  return Number.isSafeInteger(value) && Number(value) > 0;
}

function isUuid(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}

function isBoundedInteger(
  value: unknown,
  minimum: number,
  maximum: number,
): value is number {
  return (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value >= minimum &&
    value <= maximum
  );
}

export function isTrustedAdminMutationOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (origin) {
    try {
      return new URL(origin).origin === new URL(request.url).origin;
    } catch {
      return false;
    }
  }

  return request.headers.get("sec-fetch-site") === "same-origin";
}

export function parseAdminTokenRequest(value: unknown): RequestBody | null {
  if (!isRecord(value) || typeof value.action !== "string") return null;

  if (value.action === "update_limit") {
    if (!isCompanyId(value.companyId)) return null;
    if (
      value.tokenLimit !== null &&
      !isBoundedInteger(value.tokenLimit, 0, MAX_TOKEN_LIMIT)
    ) {
      return null;
    }
    return {
      action: "update_limit",
      companyId: value.companyId,
      tokenLimit: value.tokenLimit,
    };
  }

  if (value.action === "grant_tokens") {
    if (
      !isCompanyId(value.companyId) ||
      !isBoundedInteger(value.tokensToAdd, 1, MAX_SINGLE_GRANT) ||
      !isUuid(value.idempotencyKey)
    ) {
      return null;
    }
    if (value.note !== undefined && typeof value.note !== "string") return null;
    const note = value.note?.trim();
    if (note && note.length > MAX_NOTE_LENGTH) return null;
    return {
      action: "grant_tokens",
      companyId: value.companyId,
      tokensToAdd: value.tokensToAdd,
      idempotencyKey: value.idempotencyKey,
      ...(note ? { note } : {}),
    };
  }

  if (value.action === "bulk_update_trial") {
    if (!isBoundedInteger(value.tokenLimit, 0, MAX_TOKEN_LIMIT)) return null;
    return { action: "bulk_update_trial", tokenLimit: value.tokenLimit };
  }

  return null;
}

export async function POST(request: Request) {
  if (!isTrustedAdminMutationOrigin(request)) {
    return NextResponse.json(
      { error: "Untrusted request origin" },
      { status: 403 },
    );
  }

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

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const body = parseAdminTokenRequest(rawBody);
  if (!body) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
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
        user.id,
        body.idempotencyKey,
        body.note,
      );
      if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: 500 });
      }
      return NextResponse.json({
        ok: true,
        applied: result.applied,
        transactionId: result.transactionId,
        creditsBefore: result.creditsBefore,
        creditsAfter: result.creditsAfter,
      });
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
