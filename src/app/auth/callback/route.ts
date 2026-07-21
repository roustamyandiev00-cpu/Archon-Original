import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { provisionWorkspaceIfNeeded } from "@/lib/company";
import { ensureUserReferral } from "@/lib/referral";
import { seedOnboardingFromMetadata } from "@/lib/onboarding/seed";
import { isPlatformAdmin } from "@/lib/platform-admin";
import { pickPostLoginPath } from "@/lib/auth/post-login-redirect";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const requested = searchParams.get("redirect") ?? searchParams.get("next");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const user =
        data.user ??
        data.session?.user ??
        (await supabase.auth.getUser()).data.user;

      const admin = user
        ? await isPlatformAdmin(user.id, user.email)
        : false;
      const redirectPath = pickPostLoginPath({
        isPlatformAdmin: admin,
        requested,
      });

      // Tenant-onboarding niet blokkeren voor platform-admin landing.
      if (user && !admin) {
        await ensureUserReferral(supabase, {
          fullName: user.user_metadata?.full_name as string | undefined,
          referredBy: user.user_metadata?.referred_by as string | undefined,
        });
        const companyId = await provisionWorkspaceIfNeeded(supabase);
        if (companyId) {
          await seedOnboardingFromMetadata(
            supabase,
            companyId,
            user.user_metadata as Record<string, unknown>,
          );
        }
      }

      return NextResponse.redirect(`${origin}${redirectPath}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
