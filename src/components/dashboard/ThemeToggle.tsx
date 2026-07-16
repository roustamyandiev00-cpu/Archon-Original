"use client";

import { Moon, Sun } from "lucide-react";
import { useDashboardTheme } from "@/components/dashboard/DashboardThemeProvider";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useDashboardTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Schakel naar licht thema" : "Schakel naar donker thema"}
      title={isDark ? "Licht thema" : "Donker thema"}
      className="dashboard-topbar-icon-btn dashboard-theme-toggle relative hidden h-8 w-8 place-items-center rounded-lg text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-100 sm:grid"
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
