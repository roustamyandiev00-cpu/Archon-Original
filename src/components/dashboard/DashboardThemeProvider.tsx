"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  DASHBOARD_THEME_KEY,
  isDashboardTheme,
  type DashboardTheme,
} from "@/components/dashboard/theme";
import "./dashboard-theme.css";

type ThemeContextValue = {
  theme: DashboardTheme;
  setTheme: (theme: DashboardTheme) => void;
  toggleTheme: () => void;
  ready: boolean;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const listeners = new Set<() => void>();

function emitThemeChange() {
  for (const listener of listeners) listener();
}

function readTheme(): DashboardTheme {
  if (typeof window === "undefined") return "dark";
  try {
    const stored = localStorage.getItem(DASHBOARD_THEME_KEY);
    return isDashboardTheme(stored) ? stored : "dark";
  } catch {
    return "dark";
  }
}

function subscribeTheme(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function persistTheme(theme: DashboardTheme) {
  try {
    localStorage.setItem(DASHBOARD_THEME_KEY, theme);
  } catch {
    /* negeer */
  }
  emitThemeChange();
}

export function useDashboardTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useDashboardTheme moet binnen DashboardThemeProvider gebruikt worden.");
  }
  return ctx;
}

export default function DashboardThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(subscribeTheme, readTheme, (): DashboardTheme => "dark");
  const ready = useSyncExternalStore(
    subscribeTheme,
    () => typeof window !== "undefined",
    () => false,
  );

  const setTheme = useCallback((next: DashboardTheme) => {
    persistTheme(next);
  }, []);

  const toggleTheme = useCallback(() => {
    persistTheme(theme === "dark" ? "light" : "dark");
  }, [theme]);

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme, ready }),
    [theme, setTheme, toggleTheme, ready],
  );

  return (
    <ThemeContext.Provider value={value}>
      <div
        className="dashboard-root min-h-screen bg-zinc-950 text-zinc-100"
        data-theme={theme}
        data-theme-ready={ready ? "true" : "false"}
        suppressHydrationWarning
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
}
