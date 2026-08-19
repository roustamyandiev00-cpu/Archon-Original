const INTERNAL_ORIGIN = "https://archonpro.local";

export function safeDashboardDestination(requested: string): string | null {
  if (!requested.startsWith("/") || requested.startsWith("//")) return null;

  const destination = new URL(requested, INTERNAL_ORIGIN);
  const isDashboard =
    destination.pathname === "/dashboard" ||
    destination.pathname.startsWith("/dashboard/");

  if (destination.origin !== INTERNAL_ORIGIN || !isDashboard) return null;

  return `${destination.pathname}${destination.search}${destination.hash}`;
}
