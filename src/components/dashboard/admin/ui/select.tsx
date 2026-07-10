import type { SelectHTMLAttributes } from "react";
import { cn } from "@/components/dashboard/admin/ui/utils";

export function Select({
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-10 w-full rounded-xl border border-white/10 bg-zinc-950/70 px-3 text-sm text-zinc-100 outline-none transition-colors focus:border-sky-500/60 focus:bg-zinc-950 focus:ring-2 focus:ring-sky-500/10",
        className,
      )}
      {...props}
    />
  );
}
