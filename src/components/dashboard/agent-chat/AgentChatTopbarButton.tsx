"use client";

import { Bot } from "lucide-react";
import { useAgentChat } from "@/components/dashboard/agent-chat/AgentChatProvider";

export default function AgentChatTopbarButton() {
  const { view, toggle, hasUnread } = useAgentChat();

  const isOpen = view === "open";
  const isMinimized = view === "minimized";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={
        isOpen
          ? "Minimaliseer Nova chat"
          : isMinimized
            ? "Open Nova chat"
            : "Start Nova chat"
      }
      aria-pressed={isOpen}
      className={`relative inline-flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs transition-colors ${
        isOpen
          ? "border-sky-400/50 bg-sky-500/20 text-sky-100 ring-1 ring-sky-400/30"
          : isMinimized
            ? "border-sky-500/30 bg-sky-500/10 text-sky-200 hover:bg-sky-500/15"
            : "border-white/10 bg-white/5 text-zinc-400 hover:bg-white/8 hover:text-zinc-100"
      }`}
    >
      <span className="relative grid h-6 w-6 place-items-center rounded-md bg-gradient-to-br from-sky-400 to-indigo-500 text-zinc-950">
        <Bot size={13} />
        {hasUnread && !isOpen && (
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-sky-400 ring-2 ring-zinc-900" />
        )}
      </span>
      <span className="hidden font-medium sm:inline">
        {isMinimized || isOpen ? "Nova" : "Nova AI"}
      </span>
      {(isMinimized || isOpen) && (
        <span className="hidden rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400 md:inline">
          {isOpen ? "Open" : "Live"}
        </span>
      )}
    </button>
  );
}
