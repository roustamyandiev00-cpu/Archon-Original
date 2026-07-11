import AgentPortrait from "@/components/dashboard/agents/AgentPortrait";
import { resolveAgentVisual } from "@/components/dashboard/agents/agentVisual";

export default function AgentAvatar({
  agentName,
  avatarUrl,
  size = "md",
  className,
}: {
  agentName: string;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const visual = resolveAgentVisual(agentName);

  return (
    <AgentPortrait
      name={visual.name}
      gradient={visual.gradient}
      avatarUrl={avatarUrl ?? visual.avatarUrl}
      size={size}
      showNovaIcon={visual.id === "nova" && !avatarUrl && !visual.avatarUrl}
      className={className}
    />
  );
}
