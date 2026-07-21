/** Veilige interne redirect-paden na login/registratie. */

export const TENANT_HOME = "/dashboard";
export const ADMIN_HOME = "/admin";

/** Voorkomt open redirects (alleen relatieve app-paden). */
export function isSafeInternalRedirect(path: string): boolean {
  if (!path.startsWith("/")) return false;
  if (path.startsWith("//")) return false;
  if (path.includes("\\")) return false;
  if (path.includes("://")) return false;
  return true;
}

/**
 * Bepaalt de landingspagina na authenticatie.
 * - Platform-admin → /admin (of expliciete /admin/* deep-link)
 * - Overige gebruikers → tenant-dashboard (of veilige gevraagde redirect, nooit /admin)
 */
export function pickPostLoginPath(input: {
  isPlatformAdmin: boolean;
  requested?: string | null;
}): string {
  const raw = input.requested?.trim() || null;
  const safe = raw && isSafeInternalRedirect(raw) ? raw : null;

  if (input.isPlatformAdmin) {
    if (safe?.startsWith(ADMIN_HOME)) return safe;
    return ADMIN_HOME;
  }

  if (safe && !safe.startsWith(ADMIN_HOME)) return safe;
  return TENANT_HOME;
}
