"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { useAgentChat } from "@/components/dashboard/agent-chat/AgentChatProvider";
import { runProactiveAgentScan } from "@/app/dashboard/automatisaties/proactive-actions";

const SEEN_KEY = "archon-proactive-seen";
const SCAN_MS = 10 * 60_000;
const INITIAL_DELAY_MS = 45_000;

function readSeen(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = sessionStorage.getItem(SEEN_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function writeSeen(ids: Set<string>) {
  try {
    sessionStorage.setItem(SEEN_KEY, JSON.stringify([...ids].slice(-50)));
  } catch {
    /* negeer */
  }
}

type ProactiveAgentContextValue = {
  scanNow: () => Promise<void>;
};

const ProactiveAgentContext = createContext<ProactiveAgentContextValue | null>(
  null,
);

export function ProactiveAgentProvider({
  children,
  enabled = true,
}: {
  children: ReactNode;
  enabled?: boolean;
}) {
  const { pushAgentAlert } = useAgentChat();
  const seenRef = useRef<Set<string>>(readSeen());
  const scanningRef = useRef(false);

  const scanNow = useCallback(async () => {
    if (!enabled || scanningRef.current) return;
    if (typeof document !== "undefined" && document.visibilityState === "hidden") {
      return;
    }
    scanningRef.current = true;
    try {
      const result = await runProactiveAgentScan();
      if (result.error || result.alerts.length === 0) return;

      for (const alert of result.alerts) {
        if (seenRef.current.has(alert.id)) continue;
        seenRef.current.add(alert.id);
        writeSeen(seenRef.current);

        pushAgentAlert({
          agentName: alert.agentName,
          text: `**${alert.title}**\n\n${alert.message}`,
          options: alert.options ?? [
            "Bekijk goedkeuringen",
            "Later",
          ],
        });
        break;
      }
    } finally {
      scanningRef.current = false;
    }
  }, [enabled, pushAgentAlert]);

  useEffect(() => {
    if (!enabled) return;

    const initial = window.setTimeout(() => {
      void scanNow();
    }, INITIAL_DELAY_MS);

    const interval = window.setInterval(() => {
      void scanNow();
    }, SCAN_MS);

    return () => {
      window.clearTimeout(initial);
      window.clearInterval(interval);
    };
  }, [enabled, scanNow]);

  return (
    <ProactiveAgentContext.Provider value={{ scanNow }}>
      {children}
    </ProactiveAgentContext.Provider>
  );
}

export function useProactiveAgents() {
  const ctx = useContext(ProactiveAgentContext);
  return ctx ?? { scanNow: async () => {} };
}
