import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { PREVIEW_COOKIE } from "@/components/dashboard/trial";
import type { Database } from "@/types/database.types";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";

function applyAuthCookies(
  response: NextResponse,
  cookiesToSet: {
    name: string;
    value: string;
    options?: Record<string, unknown>;
  }[],
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

function copyResponseCookies(source: NextResponse, target: NextResponse) {
  source.cookies.getAll().forEach((cookie) => {
    target.cookies.set(cookie.name, cookie.value, cookie);
  });
  return target;
}

function isMissingAuthSession(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const authError = error as { code?: unknown; message?: unknown };
  return (
    authError.code === "session_not_found" ||
    authError.message === "Auth session missing!" ||
    authError.message === "Auth session missing"
  );
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    getSupabaseUrl(),
    getSupabaseAnonKey(),
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

  let user: Awaited<
    ReturnType<typeof supabase.auth.getUser>
  >["data"]["user"] = null;
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      if (!isMissingAuthSession(error)) {
        console.error("[auth] getUser error in middleware:", error.message);
      }
    } else {
      user = data.user;
    }
  } catch (error) {
    console.error("[auth] getUser failed in middleware:", error);
  }

  const isDashboard = request.nextUrl.pathname.startsWith("/dashboard");
  const isAdmin = request.nextUrl.pathname.startsWith("/admin");
  const isPreviewEntry = request.nextUrl.pathname === "/dashboard/voorbeeld";
  const isPreviewMode =
    request.cookies.get(PREVIEW_COOKIE)?.value === "1" || isPreviewEntry;
  if (!user && (isAdmin || (isDashboard && !isPreviewMode))) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set(
      "redirect",
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
    );
    return copyResponseCookies(supabaseResponse, NextResponse.redirect(url));
  }

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
