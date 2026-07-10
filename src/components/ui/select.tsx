import type { SelectHTMLAttributes } from "react";
import { cn } from "@/components/ui/utils";

export function Select({
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-10 w-full rounded-xl border border-zinc-700/45 bg-zinc-800/70 px-3 text-sm text-zinc-100 outline-none transition-colors focus:border-sky-500/60 focus:bg-zinc-800 focus:ring-2 focus:ring-sky-500/15",
        className,
      )}
      {...props}
    />
  );
}
