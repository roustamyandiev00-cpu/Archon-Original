import { Bot } from "lucide-react";
import { cn } from "@/components/ui/utils";
import { resolveAgentVisual } from "@/components/dashboard/agents/agentVisual";

export default function AgentAvatar({
  agentName,
  size = "md",
  className,
}: {
  agentName: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const visual = resolveAgentVisual(agentName);
  const sizeClass =
    size === "sm"
      ? "h-7 w-7 rounded-md text-[10px]"
      : size === "lg"
        ? "h-10 w-10 rounded-lg text-sm"
        : "h-8 w-8 rounded-md text-[11px]";

  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center bg-gradient-to-br font-bold text-zinc-950",
        visual.gradient,
        sizeClass,
        className,
      )}
      aria-hidden
    >
      {visual.id === "nova" ? (
        <Bot size={size === "sm" ? 12 : size === "lg" ? 16 : 14} />
      ) : (
        visual.name.charAt(0).toUpperCase()
      )}
    </span>
  );
}
