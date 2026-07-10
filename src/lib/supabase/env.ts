/** Gedeelde Supabase env — ondersteunt zowel publishable als legacy anon key. */
export function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!url) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL ontbreekt. Vul .env.local in en herstart npm run dev.",
    );
  }
  return url;
}

export function getSupabaseAnonKey(): string {
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (of NEXT_PUBLIC_SUPABASE_ANON_KEY) ontbreekt. Vul .env.local in en herstart npm run dev.",
    );
  }

  return key;
}
