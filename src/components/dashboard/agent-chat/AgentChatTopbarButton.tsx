"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, ChevronDown } from "lucide-react";
import { useAgentChat } from "@/components/dashboard/agent-chat/AgentChatProvider";

export default function AgentChatTopbarButton() {
  const {
    view,
    toggle,
    openWith,
    hasUnread,
    activeAgent,
    availableAgents,
  } = useAgentChat();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const agentLabel = activeAgent.name;

  const isOpen = view === "open";
  const isMinimized = view === "minimized";
  const showLive = isMinimized || isOpen;
  const hasMultipleAgents = availableAgents.length > 1;

  useEffect(() => {
    if (!menuOpen) return;
    function onPointerDown(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [menuOpen]);

  function handleMainClick() {
    setMenuOpen(false);
    toggle();
  }

  function selectAgent(agent: (typeof availableAgents)[number]) {
    setMenuOpen(false);
    openWith(agent);
  }

  return (
    <div className="relative" ref={menuRef}>
      <div
        className={`inline-flex items-center rounded-lg border transition-colors ${
          isOpen
            ? "border-sky-400/50 bg-sky-500/20 text-sky-100 ring-1 ring-sky-400/30"
            : isMinimized
              ? "border-sky-500/30 bg-sky-500/10 text-sky-200 hover:bg-sky-500/15"
              : "border-white/10 bg-white/5 text-zinc-400 hover:bg-white/8 hover:text-zinc-100"
        }`}
      >
        <button
          type="button"
          data-tour="dash-nova"
          onClick={handleMainClick}
          aria-label={
            isOpen
              ? `Minimaliseer ${agentLabel} chat`
              : isMinimized
                ? `Open ${agentLabel} chat`
                : `Start ${agentLabel} chat`
          }
          aria-pressed={isOpen}
          className="relative inline-flex items-center gap-2 px-2.5 py-1.5 text-xs"
        >
          <span
            className={`relative grid h-6 w-6 place-items-center rounded-md bg-gradient-to-br ${activeAgent.gradient} text-zinc-950`}
          >
            {activeAgent.id === "nova" ? (
              <Bot size={13} />
            ) : (
              <span className="text-[11px] font-bold">
                {activeAgent.name.charAt(0).toUpperCase()}
              </span>
            )}
            {hasUnread && !isOpen && (
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-sky-400 ring-2 ring-zinc-900" />
            )}
          </span>
          <span className="hidden font-medium sm:inline">
            {showLive ? agentLabel : `${agentLabel} AI`}
          </span>
          {showLive && (
            <span className="hidden rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400 md:inline">
              {isOpen ? "Open" : "Live"}
            </span>
          )}
        </button>

        {hasMultipleAgents && (
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="Kies een andere AI-agent"
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            className="border-l border-white/10 px-1.5 py-1.5 text-zinc-400 transition-colors hover:text-zinc-100"
          >
            <ChevronDown
              size={12}
              className={`transition-transform ${menuOpen ? "rotate-180" : ""}`}
            />
          </button>
        )}
      </div>

      {menuOpen && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+0.35rem)] z-50 w-56 rounded-xl border border-white/10 bg-zinc-950 py-1 shadow-2xl"
        >
          <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
            AI-agents
          </p>
          {availableAgents.map((agent) => {
            const selected = agent.id === activeAgent.id;
            return (
              <button
                key={agent.id}
                type="button"
                role="menuitem"
                onClick={() => selectAgent(agent)}
                className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors hover:bg-white/5 ${
                  selected ? "text-sky-300" : "text-zinc-200"
                }`}
              >
                <span
                  className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-gradient-to-br ${agent.gradient} text-[11px] font-bold text-zinc-950`}
                >
                  {agent.id === "nova" ? (
                    <Bot size={13} />
                  ) : (
                    agent.name.charAt(0).toUpperCase()
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{agent.name}</span>
                  <span className="block truncate text-[11px] text-zinc-500">
                    {agent.role}
                  </span>
                </span>
                {selected && (
                  <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-400">
                    Live
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
