import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/components/ui/utils";

const variants = {
  default:
    "border-sky-500/40 bg-sky-500/15 text-sky-100 hover:bg-sky-500/20",
  primary:
    "border-[color:var(--color-primary)] bg-[color:var(--color-primary)] text-black hover:opacity-95",
  secondary:
    "border-white/10 bg-white/[0.06] text-zinc-100 hover:bg-white/[0.09]",
  ghost:
    "border-transparent bg-transparent text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-100",
  danger:
    "border-rose-500/40 bg-rose-500/10 text-rose-200 hover:bg-rose-500/15",
} as const;

const sizes = {
  sm: "h-9 px-3 text-sm",
  icon: "h-8 w-8 p-0",
} as const;

export function Button({
  className,
  variant = "secondary",
  size = "sm",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
}) {
  return (
    <button
      className={cn(
        "inline-flex shrink-0 items-center gap-2 rounded-lg border font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-45",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
