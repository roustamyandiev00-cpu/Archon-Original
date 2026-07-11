"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import type { DashboardViewId } from "@/components/dashboard/DashboardHub";
import DashboardHub from "@/components/dashboard/DashboardHub";
import type { DashboardHomeProps } from "@/components/dashboard/DashboardHome";
import { useAgentChat } from "@/components/dashboard/agent-chat/AgentChatProvider";
import type { CustomAgent } from "@/components/dashboard/agents/config";
import { CREW_AGENTS, crewAgentToChat } from "@/components/dashboard/views/crew-display";
import { customAgentToChatAgent } from "@/components/dashboard/agent-chat/agents";

type Props = DashboardHomeProps & {
  companyAgents: CustomAgent[];
};

function parseView(raw: string | null): DashboardViewId {
  if (raw === "crew" || raw === "opvolging" || raw === "financien" || raw === "projecten") {
    return raw;
  }
  return "command";
}

export default function CommandCenterHub(props: Props) {
  const searchParams = useSearchParams();
  const { openWith } = useAgentChat();

  const view = parseView(searchParams.get("view"));
  const panel = searchParams.get("panel");
  const agentId = searchParams.get("agent");

  useEffect(() => {
    if (view !== "crew" || !agentId) return;

    const companyAgent = props.companyAgents.find((a) => a.id === agentId);
    if (companyAgent) {
      openWith(customAgentToChatAgent(companyAgent));
      return;
    }

    const crewAgent = CREW_AGENTS.find((a) => a.id === agentId);
    if (crewAgent) {
      openWith(crewAgentToChat(crewAgent));
    }
  }, [view, agentId, props.companyAgents, openWith]);

  return (
    <DashboardHub
      {...props}
      defaultView={view}
      crewPanel={panel === "agents" || panel === "knowledge" ? panel : null}
      companyAgents={props.companyAgents}
    />
  );
}
