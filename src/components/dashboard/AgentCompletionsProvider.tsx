"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { CheckCircle2, MessageCircle, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import AgentAvatar from "@/components/dashboard/agents/AgentAvatar";
import { routeForActivityLog } from "@/components/dashboard/agents/agentVisual";
import { useAgentChat } from "@/components/dashboard/agent-chat/AgentChatProvider";

export type AgentCompletion = {
  id: number;
  title: string;
  detail: string;
  agent_name: string;
  created_at: string;
  href: string;
  kind: "completed";
};

type AgentCompletionsContextValue = {
  items: AgentCompletion[];
  unreadItems: AgentCompletion[];
  count: number;
  unreadCount: number;
  bannerItem: AgentCompletion | null;
  dismissBanner: () => void;
  markNotificationsRead: () => void;
  openChatForBanner: () => void;
};

const AgentCompletionsContext =
  createContext<AgentCompletionsContextValue | null>(null);

const SEEN_KEY = "archon-completion-seen-ids";
const POLL_MS = 20_000;

function readSeenIds(): Set<number> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = sessionStorage.getItem(SEEN_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as number[];
    return new Set(parsed.filter((n) => Number.isFinite(n)));
  } catch {
    return new Set();
  }
}

function writeSeenIds(ids: Set<number>) {
  try {
    sessionStorage.setItem(SEEN_KEY, JSON.stringify([...ids]));
  } catch {
    /* negeer */
  }
}

function maybeBrowserNotify(item: AgentCompletion) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  try {
    new Notification(`${item.agent_name} is klaar`, {
      body: item.title,
      tag: `archon-completion-${item.id}`,
    });
  } catch {
    /* negeer */
  }
}

function mapLogRow(row: {
  id: number;
  agent_name: string;
  action_type: string;
  message: string;
  created_at: string;
  output_json: Record<string, unknown> | null;
}): AgentCompletion {
  return {
    id: row.id,
    title: row.message,
    detail: `${row.agent_name} · taak afgerond`,
    agent_name: row.agent_name,
    created_at: row.created_at,
    href: routeForActivityLog({
      action_type: row.action_type,
      output_json: row.output_json,
    }),
    kind: "completed",
  };
}

export function AgentCompletionsProvider({
  children,
  companyId,
  enabled = true,
}: {
  children: ReactNode;
  companyId: number | null;
  enabled?: boolean;
}) {
  const { pushAgentAlert, open, sendMessage } = useAgentChat();
  const [items, setItems] = useState<AgentCompletion[]>([]);
  const [unreadItems, setUnreadItems] = useState<AgentCompletion[]>([]);
  const [bannerItem, setBannerItem] = useState<AgentCompletion | null>(null);
  const seenRef = useRef<Set<number>>(readSeenIds());
  const initialPollDone = useRef(false);

  const dismissBanner = useCallback(() => setBannerItem(null), []);

  const markNotificationsRead = useCallback(() => {
    setUnreadItems([]);
  }, []);

  const notifyForItems = useCallback(
    (newItems: AgentCompletion[]) => {
      if (newItems.length === 0) return;

      const latest = newItems[0];
      setBannerItem(latest);
      setUnreadItems((current) => {
        const ids = new Set(current.map((item) => item.id));
        const merged = [...current];
        for (const item of newItems) {
          if (!ids.has(item.id)) merged.unshift(item);
        }
        return merged.slice(0, 8);
      });

      pushAgentAlert({
        agentName: latest.agent_name,
        text: `✅ **Klaar:** ${latest.title}`,
        options: ["Bekijk resultaat", "Nieuwe taak geven"],
        openChat: false,
      });

      maybeBrowserNotify(latest);

      for (const item of newItems) {
        seenRef.current.add(item.id);
      }
      writeSeenIds(seenRef.current);
    },
    [pushAgentAlert],
  );

  const poll = useCallback(async () => {
    if (!enabled || !companyId) return;

    const supabase = createClient();
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data } = await supabase
      .from("agent_activity_logs")
      .select("id, agent_name, action_type, message, created_at, output_json")
      .eq("company_id", companyId)
      .is("error_message", null)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(20);

    const mapped = (data ?? []).map((row) =>
      mapLogRow({
        ...row,
        output_json:
          row.output_json && typeof row.output_json === "object"
            ? (row.output_json as Record<string, unknown>)
            : null,
      }),
    );

    setItems(mapped);

    const newItems = mapped.filter((item) => !seenRef.current.has(item.id));

    if (!initialPollDone.current) {
      initialPollDone.current = true;
      for (const item of mapped) seenRef.current.add(item.id);
      writeSeenIds(seenRef.current);
      return;
    }

    if (newItems.length > 0) {
      notifyForItems(newItems);
    }
  }, [companyId, enabled, notifyForItems]);

  useEffect(() => {
    if (!enabled || !companyId) return;

    const tick = () => void poll();
    const initialId = window.setTimeout(tick, 0);
    const intervalId = window.setInterval(tick, POLL_MS);
    return () => {
      window.clearTimeout(initialId);
      window.clearInterval(intervalId);
    };
  }, [poll, enabled, companyId]);

  const openChatForBanner = useCallback(() => {
    if (!bannerItem) return;
    open();
    sendMessage(`Vertel me meer over: ${bannerItem.title}`);
    setBannerItem(null);
  }, [bannerItem, open, sendMessage]);

  const value = useMemo(
    () => ({
      items,
      unreadItems,
      count: items.length,
      unreadCount: unreadItems.length,
      bannerItem,
      dismissBanner,
      markNotificationsRead,
      openChatForBanner,
    }),
    [
      items,
      unreadItems,
      bannerItem,
      dismissBanner,
      markNotificationsRead,
      openChatForBanner,
    ],
  );

  return (
    <AgentCompletionsContext.Provider value={value}>
      {children}
      {bannerItem && (
        <div
          role="status"
          className="fixed inset-x-0 top-14 z-[35] border-b border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 backdrop-blur-md lg:left-[220px]"
        >
          <div className="mx-auto flex max-w-[1800px] flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-start gap-2.5">
              <AgentAvatar agentName={bannerItem.agent_name} size="lg" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-emerald-100">
                  {bannerItem.agent_name} is klaar
                </p>
                <p className="mt-0.5 truncate text-xs text-emerald-200/85">
                  {bannerItem.title}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Link
                href={bannerItem.href}
                onClick={dismissBanner}
                className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-3.5 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-emerald-400"
              >
                <CheckCircle2 size={13} />
                Bekijk resultaat
              </Link>
              <button
                type="button"
                onClick={openChatForBanner}
                className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 px-3.5 py-1.5 text-xs font-medium text-emerald-100 hover:bg-emerald-500/15"
              >
                <MessageCircle size={13} />
                Vraag agent
              </button>
              <button
                type="button"
                onClick={dismissBanner}
                aria-label="Melding sluiten"
                className="grid h-8 w-8 place-items-center rounded-lg text-emerald-300/80 hover:bg-emerald-500/15 hover:text-emerald-100"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </AgentCompletionsContext.Provider>
  );
}

export function useAgentCompletions() {
  const ctx = useContext(AgentCompletionsContext);
  if (!ctx) {
    return {
      items: [] as AgentCompletion[],
      unreadItems: [] as AgentCompletion[],
      count: 0,
      unreadCount: 0,
      bannerItem: null,
      dismissBanner: () => {},
      markNotificationsRead: () => {},
      openChatForBanner: () => {},
    };
  }
  return ctx;
}
