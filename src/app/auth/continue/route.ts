import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isPlatformAdmin } from "@/lib/platform-admin";
import { pickPostLoginPath } from "@/lib/auth/post-login-redirect";

/**
 * Post-login landingsroute. Wordt aangeroepen via volledige navigatie
 * nadat de browser de auth-cookies heeft gezet (betrouwbaarder dan een
 * server action direct na client-side signIn).
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const requested = searchParams.get("redirect") ?? searchParams.get("next");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const login = new URL("/login", origin);
    if (requested) login.searchParams.set("redirect", requested);
    return NextResponse.redirect(login);
  }

  const admin = await isPlatformAdmin(user.id, user.email);
  const path = pickPostLoginPath({
    isPlatformAdmin: admin,
    requested,
  });

  return NextResponse.redirect(new URL(path, origin));
}
