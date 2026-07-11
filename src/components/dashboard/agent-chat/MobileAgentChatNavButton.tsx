"use client";

import { Bot } from "lucide-react";
import { useAgentChat } from "@/components/dashboard/agent-chat/AgentChatProvider";

type Props = {
  mounted: boolean;
};

export default function MobileAgentChatNavButton({ mounted }: Props) {
  const { view, toggle, hasUnread, activeAgent } = useAgentChat();
  const isOpen = view === "open";
  const isLive = view === "open" || view === "minimized";

  return (
    <button
      type="button"
      data-mobile-nav-active={mounted && isOpen ? "true" : undefined}
      data-no-swipe
      onClick={toggle}
      aria-label={
        isOpen
          ? `Minimaliseer ${activeAgent.name} chat`
          : `Open chat met ${activeAgent.name}`
      }
      aria-pressed={isOpen}
      className={`relative z-[1] flex min-w-[4.25rem] shrink-0 snap-center flex-col items-center gap-1 rounded-2xl px-1.5 py-2 text-[10px] font-medium transition-colors ${
        mounted && isOpen
          ? "text-sky-400"
          : isLive
            ? "text-sky-300/90"
            : "text-zinc-500 hover:text-zinc-300"
      }`}
    >
      <span className="relative">
        <span
          className={`grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br ${activeAgent.gradient} text-zinc-950 shadow-sm transition-transform ${
            mounted && isOpen ? "ring-2 ring-sky-400/40" : ""
          }`}
        >
          {activeAgent.id === "nova" ? (
            <Bot size={16} strokeWidth={2} />
          ) : (
            <span className="text-xs font-bold">
              {activeAgent.name.charAt(0).toUpperCase()}
            </span>
          )}
        </span>
        {hasUnread && !isOpen ? (
          <span
            aria-hidden
            className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-sky-400 ring-2 ring-zinc-950"
          />
        ) : isLive && !isOpen ? (
          <span
            aria-hidden
            className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-zinc-950"
          />
        ) : null}
      </span>
      <span className="max-w-[4.25rem] truncate">{activeAgent.name}</span>
    </button>
  );
}
