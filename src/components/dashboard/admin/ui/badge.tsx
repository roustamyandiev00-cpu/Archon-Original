import type { HTMLAttributes } from "react";
import { cn } from "@/components/dashboard/admin/ui/utils";

const variants = {
  default: "border-white/10 bg-white/5 text-zinc-300",
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  danger: "border-rose-500/30 bg-rose-500/10 text-rose-400",
  info: "border-sky-500/30 bg-sky-500/10 text-sky-400",
  violet: "border-violet-500/30 bg-violet-500/10 text-violet-400",
} as const;

export type BadgeVariant = keyof typeof variants;

export function Badge({
  className,
  variant = "default",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
