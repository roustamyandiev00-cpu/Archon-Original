"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  Bot,
  MessageCircle,
  Plus,
  Users,
} from "lucide-react";
import AgentChatOpenButton from "@/components/dashboard/agent-chat/AgentChatOpenButton";
import type { DashboardHomeProps } from "@/components/dashboard/DashboardHome";
import {
  CREW_AGENTS,
  crewAgentToChat,
  type CrewAgentDef,
} from "@/components/dashboard/views/crew-display";
import { DashboardPanel } from "@/components/dashboard/views/shared";

function CrewAgentCard({ agent }: { agent: CrewAgentDef }) {
  return (
    <div className="flex flex-col rounded-2xl border border-white/[0.08] bg-zinc-900/80">
      <div className="border-b border-white/[0.06] p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${agent.gradient} text-zinc-950`}
            >
              <span className="text-sm font-bold">{agent.name.charAt(0)}</span>
            </span>
            <div>
              <p className="text-sm font-semibold text-zinc-100">
                {agent.name}
              </p>
              <p className="text-xs text-zinc-500">{agent.role}</p>
            </div>
          </div>
          <span className="rounded-full border border-white/[0.08] bg-zinc-950/60 px-2 py-0.5 text-[10px] font-medium text-zinc-400">
            {agent.model}
          </span>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-zinc-400">
          {agent.description}
        </p>

        <p className="mt-3 text-[11px] text-zinc-600">
          Vraag bijvoorbeeld:{" "}
          <span className="text-zinc-500">&ldquo;{agent.examplePrompt}&rdquo;</span>
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {agent.actions.map((action) => (
            <Link
              key={action.href + action.label}
              href={action.href}
              className="rounded-full border border-white/[0.08] px-3 py-1 text-[11px] font-medium text-zinc-300 transition-colors hover:border-orange-500/25 hover:bg-orange-500/[0.04] hover:text-orange-200"
            >
              {action.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="p-4">
        <AgentChatOpenButton
          agent={crewAgentToChat(agent)}
          className="flex w-full items-center gap-2 rounded-xl border border-white/[0.08] bg-zinc-950/50 px-3 py-2.5 text-sm text-zinc-500 transition-colors hover:border-orange-500/25 hover:text-zinc-300"
        >
          <MessageCircle size={14} className="shrink-0 text-orange-400/80" />
          <span>Stel vraag…</span>
        </AgentChatOpenButton>
      </div>
    </div>
  );
}

export default function AiCrewView({
  mission,
}: Pick<DashboardHomeProps, "mission">) {
  const [crewMode, setCrewMode] = useState(false);
  const novaAgent =
    mission.agents.find((a) => a.id === "nova") ?? mission.agents[0];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <h2 className="text-xl font-semibold text-zinc-100">AI Crew</h2>
          <p className="mt-1 text-sm leading-relaxed text-zinc-500">
            Jouw team van gespecialiseerde AI-assistenten – elk expert in zijn
            domein. Kies een agent en vraag bijvoorbeeld om een brief,
            document, offerte, factuur of planning.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            {CREW_AGENTS.length} agents online
          </span>
          <button
            type="button"
            onClick={() => setCrewMode((v) => !v)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              crewMode
                ? "border-orange-500/40 bg-orange-500/15 text-orange-300"
                : "border-white/[0.08] text-zinc-400 hover:border-white/15 hover:bg-white/[0.03]"
            }`}
          >
            <Users size={12} className="mr-1.5 inline" />
            Crew Mode
          </button>
          <Link
            href="/dashboard/nova-agents"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:border-white/15 hover:bg-white/[0.03]"
          >
            <Plus size={12} />
            Agent toevoegen
          </Link>
        </div>
      </div>

      {crewMode && novaAgent ? (
        <DashboardPanel title="Crew Mode — gezamenlijke briefing" icon={Bot}>
          <p className="text-sm text-zinc-400">
            {CREW_AGENTS.length} agents staan klaar. Stuur één vraag en Nova
            coördineert de crew.
          </p>
          <AgentChatOpenButton
            agent={{
              id: novaAgent.id,
              name: novaAgent.name,
              role: novaAgent.role,
              gradient: novaAgent.gradient,
            }}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-orange-500 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-orange-400"
          >
            <MessageCircle size={14} />
            Vraag aan de hele crew
            <ArrowRight size={14} />
          </AgentChatOpenButton>
        </DashboardPanel>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {CREW_AGENTS.map((agent) => (
          <CrewAgentCard key={agent.id} agent={agent} />
        ))}
      </div>
    </div>
  );
}
