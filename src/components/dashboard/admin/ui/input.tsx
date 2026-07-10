import type { InputHTMLAttributes } from "react";
import { cn } from "@/components/dashboard/admin/ui/utils";

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-xl border border-white/10 bg-zinc-950/70 px-3 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-sky-500/60 focus:bg-zinc-950 focus:ring-2 focus:ring-sky-500/10",
        className,
      )}
      {...props}
    />
  );
}
