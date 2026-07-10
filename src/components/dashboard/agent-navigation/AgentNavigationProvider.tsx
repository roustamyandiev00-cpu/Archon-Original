"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAgentChat } from "@/components/dashboard/agent-chat/AgentChatProvider";

type NavOptions = {
  minimizeChat?: boolean;
  closeChat?: boolean;
};

type AgentNavigationContextValue = {
  navigateTo: (route: string, options?: NavOptions) => void;
  markActionNavigated: (actionId: number) => void;
};

const AgentNavigationContext =
  createContext<AgentNavigationContextValue | null>(null);

const NAVIGATED_KEY = "archon-navigated-actions";

function readNavigated(): Set<number> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = sessionStorage.getItem(NAVIGATED_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as number[];
    return new Set(parsed.filter((n) => Number.isFinite(n)));
  } catch {
    return new Set();
  }
}

function writeNavigated(ids: Set<number>) {
  try {
    const trimmed = [...ids].slice(-40);
    sessionStorage.setItem(NAVIGATED_KEY, JSON.stringify(trimmed));
  } catch {
    /* negeer */
  }
}

export function dispatchAgentNavigate(
  route: string,
  options?: NavOptions,
) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("archon:agent-navigate", {
      detail: { route, ...options },
    }),
  );
}

export function AgentNavigationProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { minimize, close } = useAgentChat();
  const navigatedRef = useRef<Set<number>>(readNavigated());

  const navigateTo = useCallback(
    (route: string, options?: NavOptions) => {
      if (!route) return;
      if (options?.closeChat) close();
      else if (options?.minimizeChat !== false) minimize();
      if (route !== pathname) {
        router.push(route);
      }
    },
    [router, pathname, minimize, close],
  );

  const markActionNavigated = useCallback((actionId: number) => {
    navigatedRef.current.add(actionId);
    writeNavigated(navigatedRef.current);
  }, []);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (
        event as CustomEvent<{ route: string; minimizeChat?: boolean; closeChat?: boolean }>
      ).detail;
      if (!detail?.route) return;
      navigateTo(detail.route, detail);
    };
    window.addEventListener("archon:agent-navigate", handler);
    return () => window.removeEventListener("archon:agent-navigate", handler);
  }, [navigateTo]);

  const value: AgentNavigationContextValue = {
    navigateTo,
    markActionNavigated,
  };

  return (
    <AgentNavigationContext.Provider value={value}>
      {children}
    </AgentNavigationContext.Provider>
  );
}

export function useAgentNavigation() {
  const ctx = useContext(AgentNavigationContext);
  if (!ctx) {
    return {
      navigateTo: (route: string) => {
        if (typeof window !== "undefined") {
          window.location.assign(route);
        }
      },
      markActionNavigated: () => {},
    };
  }
  return ctx;
}
