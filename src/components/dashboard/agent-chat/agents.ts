import type { CustomAgent } from "@/components/dashboard/agents/config";
import type { ChatAgent } from "@/components/dashboard/agent-chat/AgentChatProvider";
import { DEFAULT_BUILTIN_AVATARS } from "@/lib/agents/avatar-options";

export function customAgentToChatAgent(agent: CustomAgent): ChatAgent {
  return {
    id: agent.id,
    name: agent.name,
    role: agent.role,
    gradient: agent.gradient,
    avatarUrl: agent.avatarUrl ?? null,
    instructies: agent.instructies,
  };
}

export function chatAgentFromId(
  agents: CustomAgent[],
  id: string,
  fallbackName?: string,
): ChatAgent | null {
  const found = agents.find((a) => a.id === id && a.enabled);
  if (found) return customAgentToChatAgent(found);
  if (id === "nova" && fallbackName) {
    return {
      id: "nova",
      name: fallbackName,
      role: "AI-metgezel",
      gradient: "from-sky-400 to-indigo-500",
      avatarUrl: DEFAULT_BUILTIN_AVATARS.nova,
    };
  }
  return null;
}
