import Image from "next/image";
import { Bot } from "lucide-react";
import { cn } from "@/components/ui/utils";

const sizeMap = {
  sm: {
    box: "h-7 w-7 rounded-md",
    text: "text-[10px]",
    icon: 12,
    image: 28,
  },
  md: {
    box: "h-10 w-10 rounded-xl",
    text: "text-sm",
    icon: 16,
    image: 40,
  },
  lg: {
    box: "h-14 w-14 rounded-2xl",
    text: "text-base",
    icon: 20,
    image: 56,
  },
} as const;

export default function AgentPortrait({
  name,
  gradient,
  avatarUrl,
  size = "md",
  showNovaIcon = false,
  className,
}: {
  name: string;
  gradient: string;
  avatarUrl?: string | null;
  size?: keyof typeof sizeMap;
  showNovaIcon?: boolean;
  className?: string;
}) {
  const dim = sizeMap[size];

  if (avatarUrl) {
    return (
      <span
        className={cn(
          "relative shrink-0 overflow-hidden bg-zinc-900/40 ring-1 ring-white/10",
          dim.box,
          className,
        )}
      >
        <Image
          src={avatarUrl}
          alt=""
          width={dim.image}
          height={dim.image}
          className="h-full w-full object-cover object-top"
        />
      </span>
    );
  }

  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center bg-gradient-to-br font-bold text-zinc-950",
        gradient,
        dim.box,
        dim.text,
        className,
      )}
      aria-hidden
    >
      {showNovaIcon ? (
        <Bot size={dim.icon} />
      ) : (
        name.charAt(0).toUpperCase() || "?"
      )}
    </span>
  );
}
