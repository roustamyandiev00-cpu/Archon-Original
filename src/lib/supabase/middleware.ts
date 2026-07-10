import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { PREVIEW_COOKIE } from "@/components/dashboard/trial";
import type { Database } from "@/types/database.types";

function hasSupabaseAuthCookie(request: NextRequest) {
  return request.cookies
    .getAll()
    .some((cookie) => cookie.name.startsWith("sb-") && cookie.name.includes("auth-token"));
}

function applyAuthCookies(
  response: NextResponse,
  cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[],
) {
  cookiesToSet.forEach(({ name, value, options }) =>
    response.cookies.set(name, value, {
      ...(options ?? {}),
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    }),
  );
}

export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      "[auth] Supabase env ontbreekt (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)",
    );
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
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
          applyAuthCookies(supabaseResponse, cookiesToSet);
        },
      },
    },
  );

  // IMPORTANT: refresh the auth token. Do not run code between createServerClient
  // and getUser() — it can cause hard-to-debug logout issues.
  let user: Awaited<ReturnType<typeof supabase.auth.getUser>>["data"]["user"] = null;
  let authCheckFailed = false;

  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      const msg = error.message ?? "";
      const sessionMissing =
        msg.includes("Auth session missing") ||
        error.name === "AuthSessionMissingError";
      if (!sessionMissing) {
        authCheckFailed = true;
        console.error("[auth] getUser error in middleware:", msg);
      }
    } else {
      user = data.user;
    }
  } catch (error) {
    authCheckFailed = true;
    console.error("[auth] getUser failed in middleware:", error);
  }

  // Protect the dashboard, maar laat anonieme voorbeeldmodus toe.
  const isDashboard = request.nextUrl.pathname.startsWith("/dashboard");
  const isPreviewEntry = request.nextUrl.pathname === "/dashboard/voorbeeld";
  const isPreviewMode =
    request.cookies.get(PREVIEW_COOKIE)?.value === "1" || isPreviewEntry;

  const hasAuthCookie = hasSupabaseAuthCookie(request);

  if (
    !user &&
    isDashboard &&
    !isPreviewMode &&
    !(authCheckFailed && hasAuthCookie)
  ) {
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
      secure: process.env.NODE_ENV === "production",
    });
  }

  return supabaseResponse;
}
