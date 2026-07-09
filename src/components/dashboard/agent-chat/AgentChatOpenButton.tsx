"use client";

import type { ReactNode } from "react";
import {
  useAgentChat,
  type ChatAgent,
} from "@/components/dashboard/agent-chat/AgentChatProvider";

export default function AgentChatOpenButton({
  agent,
  className,
  children,
}: {
  agent: ChatAgent;
  className?: string;
  children: ReactNode;
}) {
  const { openWith } = useAgentChat();

  return (
    <button
      type="button"
      onClick={() => openWith(agent)}
      aria-label={`Chat met ${agent.name}`}
      className={className}
    >
      {children}
    </button>
  );
}
