import Link from "next/link";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Circle,
  Clock,
  MessageCircle,
  Sparkles,
} from "lucide-react";
import type { AgentFleetMember } from "@/components/dashboard/mission-data";
import AgentChatOpenButton from "@/components/dashboard/agent-chat/AgentChatOpenButton";

function chatAgentFor(agent: AgentFleetMember) {
  return {
    id: agent.id,
    name: agent.name,
    role: agent.role,
    gradient: agent.gradient,
  };
}

const statusDot = {
  actief: "bg-emerald-400/80",
  wacht: "bg-sky-400/80",
  idle: "bg-zinc-500",
} as const;

export function AgentFleetBar({ agents }: { agents: AgentFleetMember[] }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {agents.map((agent) => (
        <AgentChatOpenButton
          key={agent.id}
          agent={chatAgentFor(agent)}
          className="flex items-center gap-2 rounded-full border border-white/10 bg-zinc-950/60 px-3.5 py-2 text-xs font-medium text-zinc-300 transition-colors hover:border-white/20 hover:bg-zinc-900"
        >
          <span
            className={`h-2 w-2 rounded-full ${statusDot[agent.status]}`}
          />
          <span>{agent.name}</span>
          {agent.pending > 0 && (
            <span className="rounded-full bg-sky-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-sky-300">
              {agent.pending}
            </span>
          )}
        </AgentChatOpenButton>
      ))}
    </div>
  );
}

export function AgentFleetGrid({ agents }: { agents: AgentFleetMember[] }) {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-4">
      {agents.map((agent) => (
        <div
          key={agent.id}
          className="group relative flex min-h-[240px] flex-col overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/70 p-6 transition-all hover:-translate-y-0.5 hover:border-white/20 hover:shadow-[0_20px_60px_-24px_rgba(14,165,233,0.35)] sm:min-h-[260px] sm:p-7"
        >
          <div
            className={`pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br ${agent.gradient} opacity-10 blur-2xl transition-opacity group-hover:opacity-20`}
          />

          <div className="relative flex items-start justify-between gap-3">
            <AgentChatOpenButton
              agent={chatAgentFor(agent)}
              className="flex items-center gap-3.5 text-left"
            >
              <span
                className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${agent.gradient} text-zinc-950 shadow-lg`}
              >
                {agent.id === "nova" ? (
                  <Bot size={26} />
                ) : (
                  <span className="text-base font-bold">
                    {agent.name.charAt(0)}
                  </span>
                )}
              </span>
              <div>
                <p className="text-lg font-semibold text-zinc-50">
                  {agent.name}
                </p>
                <p className="text-sm text-zinc-400">{agent.role}</p>
              </div>
            </AgentChatOpenButton>
            <span className="mt-1 flex items-center gap-1.5">
              <span
                className={`h-2.5 w-2.5 shrink-0 rounded-full ${statusDot[agent.status]}`}
              />
              <span className="text-[11px] font-medium text-zinc-500">
                {agent.statusLabel}
              </span>
            </span>
          </div>

          <p className="relative mt-4 text-[15px] leading-relaxed text-zinc-300">
            {agent.proactive}
          </p>

          {agent.todoItems.length > 0 && (
            <div className="relative mt-3.5 space-y-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                Nog te doen
              </p>
              {agent.todoItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="flex items-center gap-2 rounded-lg px-1.5 py-1 text-xs text-zinc-300 transition-colors hover:bg-white/5 hover:text-zinc-100"
                >
                  <Circle size={9} className="shrink-0 text-amber-400/80" />
                  <span className="truncate">{item.text}</span>
                </Link>
              ))}
            </div>
          )}

          {agent.doneItems.length > 0 && (
            <div className="relative mt-3 space-y-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                Gedaan
              </p>
              {agent.doneItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="flex items-center gap-2 rounded-lg px-1.5 py-1 text-xs text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-200"
                >
                  <CheckCircle2
                    size={11}
                    className="shrink-0 text-emerald-400/80"
                  />
                  <span className="truncate">{item.text}</span>
                  {item.time && (
                    <span className="ml-auto shrink-0 font-mono text-[10px] text-zinc-600">
                      {item.time}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          )}

          <div className="relative mt-4 flex flex-1 items-end">
            <div className="flex w-full items-center justify-between gap-3 border-t border-white/8 pt-3.5">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-xs text-zinc-500">
                <Clock size={13} className="text-amber-400/80" />
                <span className="font-semibold text-zinc-200">
                  {agent.pending}
                </span>{" "}
                open
              </span>
              <span className="flex items-center gap-1.5 text-xs text-zinc-500">
                <CheckCircle2 size={13} className="text-emerald-400/80" />
                <span className="font-semibold text-zinc-200">
                  {agent.doneRecent}
                </span>{" "}
                recent
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <AgentChatOpenButton
                agent={chatAgentFor(agent)}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-200 transition-colors hover:border-white/20 hover:bg-white/10"
              >
                <MessageCircle size={12} />
                Chat
              </AgentChatOpenButton>
              <Link
                href={agent.suggestion.href}
                className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/15 px-3 py-1.5 text-xs font-medium text-sky-300 transition-colors hover:bg-sky-500/25"
              >
                <Sparkles size={12} />
                {agent.suggestion.label}
                <ArrowRight size={12} />
              </Link>
            </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
