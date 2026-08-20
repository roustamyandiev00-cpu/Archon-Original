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
import { usePathname } from "next/navigation";
import { AlertTriangle, MessageCircle, X } from "lucide-react";
import AgentAvatar from "@/components/dashboard/agents/AgentAvatar";
import { createClient } from "@/lib/supabase/client";
import { useAgentChat } from "@/components/dashboard/agent-chat/AgentChatProvider";

export type PendingApproval = {
  id: number;
  title: string;
  reason: string | null;
  agent_name: string;
  created_at: string;
  href: string;
};

type PendingApprovalsContextValue = {
  items: PendingApproval[];
  count: number;
  bannerItem: PendingApproval | null;
  dismissBanner: () => void;
  openChatForBanner: () => void;
};

const PendingApprovalsContext =
  createContext<PendingApprovalsContextValue | null>(null);

const SEEN_KEY = "archon-approval-seen-ids";
const POLL_MS = 30_000;

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

function maybeBrowserNotify(item: PendingApproval, total: number) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  const body =
    total > 1
      ? `${item.title} (+${total - 1} andere)`
      : item.reason ?? item.title;
  try {
    new Notification(`${item.agent_name} wacht op je`, {
      body,
      tag: `archon-approval-${item.id}`,
    });
  } catch {
    /* negeer */
  }
}

export function PendingApprovalsProvider({
  children,
  companyId,
  enabled = true,
}: {
  children: ReactNode;
  companyId: number | null;
  enabled?: boolean;
}) {
  const pathname = usePathname();
  const { pushAgentAlert, open, sendMessage } = useAgentChat();
  const [items, setItems] = useState<PendingApproval[]>([]);
  const [bannerItem, setBannerItem] = useState<PendingApproval | null>(null);
  const seenRef = useRef<Set<number>>(readSeenIds());
  const initialPollDone = useRef(false);

  const dismissBanner = useCallback(() => setBannerItem(null), []);

  const notifyForItems = useCallback(
    (newItems: PendingApproval[], allItems: PendingApproval[]) => {
      if (newItems.length === 0) return;

      const latest = newItems[0];
      setBannerItem(latest);

      const count = allItems.length;
      const others =
        count > 1 ? ` Er staan nog ${count - 1} andere voorstel${count > 2 ? "len" : ""} klaar.` : "";

      pushAgentAlert({
        agentName: latest.agent_name,
        text: `**${latest.title}** wacht op je goedkeuring.${latest.reason ? `\n\n${latest.reason}` : ""}${others}\n\nWil je goedkeuren, afwijzen of mij een andere instructie geven?`,
        options: [
          "Bekijk goedkeuringen",
          "Goedkeuren",
          "Andere instructie geven",
        ],
      });

      maybeBrowserNotify(latest, count);

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
    const { data } = await supabase
      .from("agent_actions")
      .select("id, title, reason, agent_name, created_at")
      .eq("company_id", companyId)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(12);

    const mapped: PendingApproval[] = (data ?? []).map((row) => ({
      id: row.id,
      title: row.title,
      reason: row.reason,
      agent_name: row.agent_name,
      created_at: row.created_at,
      href: "/dashboard/automatisaties",
    }));

    setItems(mapped);

    const newItems = mapped.filter((item) => !seenRef.current.has(item.id));

    if (!initialPollDone.current) {
      initialPollDone.current = true;
      if (mapped.length > 0 && !pathname.startsWith("/dashboard/automatisaties")) {
        notifyForItems(mapped.slice(0, 1), mapped);
        for (const item of mapped) seenRef.current.add(item.id);
        writeSeenIds(seenRef.current);
      } else {
        for (const item of mapped) seenRef.current.add(item.id);
        writeSeenIds(seenRef.current);
      }
      return;
    }

    if (newItems.length > 0) {
      notifyForItems(newItems, mapped);
    }
  }, [companyId, enabled, notifyForItems, pathname]);

  useEffect(() => {
    if (!enabled || !companyId) return;

    const supabase = createClient();
    let cancelled = false;

    const tick = () => {
      if (!cancelled) {
        void poll().catch((error: unknown) => {
          console.warn(
            "[pending-approvals] Achtergrondcontrole tijdelijk overgeslagen.",
            error,
          );
        });
      }
    };

    const channel = supabase
      .channel(`agent-actions-${companyId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "agent_actions",
          filter: `company_id=eq.${companyId}`,
        },
        () => {
          tick();
        },
      )
      .subscribe();

    const initialId = window.setTimeout(tick, 0);
    const fallbackId = window.setInterval(tick, POLL_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(initialId);
      window.clearInterval(fallbackId);
      void supabase.removeChannel(channel);
    };
  }, [poll, enabled, companyId]);

  useEffect(() => {
    if (typeof window === "undefined" || !enabled) return;
    if (!("Notification" in window)) return;
    if (Notification.permission !== "default") return;

    const ask = () => {
      void Notification.requestPermission();
      window.removeEventListener("click", ask);
    };
    window.addEventListener("click", ask, { once: true });
    return () => window.removeEventListener("click", ask);
  }, [enabled]);

  const openChatForBanner = useCallback(() => {
    if (!bannerItem) return;
    open();
    sendMessage("Ik wil reageren op het wachtende voorstel");
    setBannerItem(null);
  }, [bannerItem, open, sendMessage]);

  const value = useMemo(
    () => ({
      items,
      count: items.length,
      bannerItem,
      dismissBanner,
      openChatForBanner,
    }),
    [items, bannerItem, dismissBanner, openChatForBanner],
  );

  return (
    <PendingApprovalsContext.Provider value={value}>
      {children}
      {bannerItem && !pathname.startsWith("/dashboard/automatisaties") && (
        <div
          role="status"
          className="fixed inset-x-0 top-14 z-[35] border-b border-amber-500/30 bg-amber-500/10 px-4 py-2.5 backdrop-blur-md lg:left-[220px]"
        >
          <div className="mx-auto flex max-w-[1800px] flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-start gap-2.5">
              <AgentAvatar agentName={bannerItem.agent_name} size="lg" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-amber-100">
                  {bannerItem.agent_name} wacht op je —{" "}
                  <span className="text-amber-50">{bannerItem.title}</span>
                </p>
                <p className="mt-0.5 truncate text-xs text-amber-200/80">
                  {bannerItem.reason ??
                    "Keur goed, wijs af of geef een nieuwe instructie via de chat."}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Link
                href="/dashboard/automatisaties"
                onClick={dismissBanner}
                className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-3.5 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-amber-400"
              >
                <AlertTriangle size={13} />
                Bekijk ({items.length})
              </Link>
              <button
                type="button"
                onClick={openChatForBanner}
                className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 px-3.5 py-1.5 text-xs font-medium text-amber-100 hover:bg-amber-500/15"
              >
                <MessageCircle size={13} />
                Antwoorden
              </button>
              <button
                type="button"
                onClick={dismissBanner}
                aria-label="Melding sluiten"
                className="grid h-8 w-8 place-items-center rounded-lg text-amber-300/80 hover:bg-amber-500/15 hover:text-amber-100"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </PendingApprovalsContext.Provider>
  );
}

export function usePendingApprovals() {
  const ctx = useContext(PendingApprovalsContext);
  if (!ctx) {
    return {
      items: [] as PendingApproval[],
      count: 0,
      bannerItem: null,
      dismissBanner: () => {},
      openChatForBanner: () => {},
    };
  }
  return ctx;
}
