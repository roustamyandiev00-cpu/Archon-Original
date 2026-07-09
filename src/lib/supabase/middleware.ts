import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { PREVIEW_COOKIE } from "@/components/dashboard/trial";
import type { Database } from "@/types/database.types";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, {
              ...options,
              secure: process.env.NODE_ENV === "production",
            }),
          );
        },
      },
    },
  );

  // IMPORTANT: refresh the auth token. Do not run code between createServerClient
  // and getUser() — it can cause hard-to-debug logout issues.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protect the dashboard, maar laat anonieme voorbeeldmodus toe.
  const isDashboard = request.nextUrl.pathname.startsWith("/dashboard");
  const isPreviewEntry = request.nextUrl.pathname === "/dashboard/voorbeeld";
  const isPreviewMode =
    request.cookies.get(PREVIEW_COOKIE)?.value === "1" || isPreviewEntry;

  if (!user && isDashboard && !isPreviewMode) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Verwijder voorbeeldcookie zodra iemand inlogt — voorkomt geblokkeerde acties.
  if (user && request.cookies.get(PREVIEW_COOKIE)?.value === "1") {
    supabaseResponse.cookies.set(PREVIEW_COOKIE, "", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
  }

  return supabaseResponse;
}
