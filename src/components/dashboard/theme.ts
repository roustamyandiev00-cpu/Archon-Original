export const DASHBOARD_THEME_KEY = "archon-dashboard-theme";

export type DashboardTheme = "light" | "dark";

export function isDashboardTheme(value: string | null): value is DashboardTheme {
  return value === "light" || value === "dark";
}
