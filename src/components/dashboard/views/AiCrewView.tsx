"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Bot,
  BrainCircuit,
  ChevronDown,
  MessageCircle,
  Plus,
  Users,
} from "lucide-react";
import AgentChatOpenButton from "@/components/dashboard/agent-chat/AgentChatOpenButton";
import { AgentFleetGrid } from "@/components/dashboard/AgentFleet";
import MissionOverview from "@/components/dashboard/MissionOverview";
import AgentsManager, {
  type AgentsManagerHandle,
} from "@/components/dashboard/nova-agents/AgentsManager";
import AgentKnowledgeForm from "@/components/dashboard/nova-agents/AgentKnowledgeForm";
import type { DashboardHomeProps } from "@/components/dashboard/DashboardHome";
import type { CustomAgent } from "@/components/dashboard/agents/config";
import { DashboardPanel } from "@/components/dashboard/views/shared";

type CrewPanel = "agents" | "knowledge" | null;

export default function AiCrewView({
  mission,
  agentName,
  companyAgents,
  initialPanel = null,
}: Pick<DashboardHomeProps, "mission" | "agentName"> & {
  companyAgents: CustomAgent[];
  initialPanel?: CrewPanel;
}) {
  const agentsRef = useRef<AgentsManagerHandle>(null);
  const [crewMode, setCrewMode] = useState(false);
  const [openPanel, setOpenPanel] = useState<CrewPanel>(initialPanel);
  const [knowledgeAgentId, setKnowledgeAgentId] = useState<string | undefined>();
  const novaAgent =
    mission.agents.find((a) => a.id === "nova") ?? mission.agents[0];
  const activeCount = companyAgents.filter((a) => a.enabled).length;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (initialPanel) setOpenPanel(initialPanel);
  }, [initialPanel]);

  function toggleKnowledge() {
    setOpenPanel((current) => (current === "knowledge" ? null : "knowledge"));
  }

  function openDocumentForAgent(agentId: string) {
    setKnowledgeAgentId(agentId);
    setOpenPanel("knowledge");
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 overflow-hidden lg:gap-3">
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold text-zinc-100">AI Crew</h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-zinc-500">
            Maak agents aan, voeg kennisdocumenten toe en start direct een
            gesprek. Alles wat je hier instelt onthouden je agents in het
            geheugen.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            {activeCount} agents online
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
          <button
            type="button"
            onClick={() => agentsRef.current?.openNew()}
            className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/40 bg-orange-500/15 px-3 py-1.5 text-xs font-medium text-orange-300 transition-colors hover:bg-orange-500/20"
          >
            <Plus size={12} />
            Agent toevoegen
            <ChevronDown size={12} />
          </button>
          <button
            type="button"
            onClick={() => {
              setKnowledgeAgentId(undefined);
              toggleKnowledge();
            }}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              openPanel === "knowledge"
                ? "border-violet-500/40 bg-violet-500/15 text-violet-300"
                : "border-white/[0.08] text-zinc-300 hover:border-white/15 hover:bg-white/[0.03]"
            }`}
          >
            <BrainCircuit size={12} />
            Kennis toevoegen
            <ChevronDown
              size={12}
              className={`transition-transform ${openPanel === "knowledge" ? "rotate-180" : ""}`}
            />
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain pb-2 lg:space-y-5">
        {crewMode && novaAgent ? (
          <DashboardPanel title="Crew Mode — gezamenlijke briefing" icon={Bot}>
            <p className="text-sm text-zinc-400">
              Je agents staan klaar. Stuur één vraag en Ela coördineert de crew.
            </p>
            <AgentChatOpenButton
              agent={{
                id: novaAgent.id,
                name: novaAgent.name,
                role: novaAgent.role,
                gradient: novaAgent.gradient,
              }}
              className="mt-3 inline-flex items-center gap-2 rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:bg-orange-400"
            >
              <MessageCircle size={14} />
              Vraag aan de hele crew
              <ArrowRight size={14} />
            </AgentChatOpenButton>
          </DashboardPanel>
        ) : null}

        {openPanel === "knowledge" && (
          <DashboardPanel title="Kennis & geheugen" icon={BrainCircuit}>
            <AgentKnowledgeForm
              companyAgents={companyAgents}
              defaultAgentId={knowledgeAgentId}
            />
            <p className="mt-4 text-xs text-zinc-500">
              Bekijk alles in{" "}
              <Link
                href="/dashboard/geheugen"
                className="text-violet-400 hover:underline"
              >
                geheugen
              </Link>
              .
            </p>
          </DashboardPanel>
        )}

        <section className="space-y-3">
          <div>
            <h3 className="text-base font-semibold text-zinc-100">AI-agents</h3>
            <p className="mt-0.5 text-sm text-zinc-500">
              {mission.agents.length} agents in je crew
              {activeCount > 0
                ? ` — ${activeCount} actief`
                : " — schakel agents in om te starten"}
              .
            </p>
          </div>
          <AgentFleetGrid agents={mission.agents} />
        </section>

        <MissionOverview
          actionItems={mission.actionItems}
          tasks={mission.tasks}
          important={mission.important}
          activity={mission.activity}
          nova={mission.nova}
          agentName={agentName}
          isDemo={mission.isDemo}
        />

        <DashboardPanel title="Agents beheren" icon={Bot}>
          <AgentsManager
            ref={agentsRef}
            initialAgents={companyAgents}
            embedded
            onAddDocument={openDocumentForAgent}
          />
        </DashboardPanel>
      </div>
    </div>
  );
}
