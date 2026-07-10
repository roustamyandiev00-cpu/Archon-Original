import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { provisionWorkspaceIfNeeded } from "@/lib/company";
import { ensureUserReferral } from "@/lib/referral";
import { seedOnboardingFromMetadata } from "@/lib/onboarding/seed";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirect = searchParams.get("redirect") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      await ensureUserReferral(supabase, {
        fullName: user?.user_metadata?.full_name as string | undefined,
        referredBy: user?.user_metadata?.referred_by as string | undefined,
      });
      const companyId = await provisionWorkspaceIfNeeded(supabase);
      if (companyId && user) {
        await seedOnboardingFromMetadata(
          supabase,
          companyId,
          user.user_metadata as Record<string, unknown>,
        );
      }
      return NextResponse.redirect(`${origin}${redirect}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
