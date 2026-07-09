import { cache } from "react";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database.types";

async function createClientImpl() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, {
                ...options,
                secure: process.env.NODE_ENV === "production",
              }),
            );
          } catch {
            // Called from a Server Component — safe to ignore when middleware
            // is responsible for refreshing the session.
          }
        },
      },
    },
  );
}

/** Eén Supabase-client per request (layout + pagina delen dezelfde instantie). */
export const createClient = cache(createClientImpl);
