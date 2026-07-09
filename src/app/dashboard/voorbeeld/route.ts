import { NextResponse, type NextRequest } from "next/server";
import { PREVIEW_COOKIE } from "@/components/dashboard/trial";

/** Start anonieme dashboard-voorbeeldmodus (demogegevens, alleen bekijken). */
export async function GET(request: NextRequest) {
  const url = new URL("/dashboard", request.url);
  const response = NextResponse.redirect(url);
  response.cookies.set(PREVIEW_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
  return response;
}
