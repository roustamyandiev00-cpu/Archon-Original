"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/components/ui/utils";

export type ChartConfig = Record<
  string,
  {
    label?: string;
    color?: string;
  }
>;

export function ChartContainer({
  className,
  children,
}: {
  config: ChartConfig;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("w-full text-xs text-zinc-400", className)}>
      {children}
    </div>
  );
}

export function ChartTooltip({
  content,
}: {
  content: ReactNode;
  cursor?: boolean;
}) {
  return <>{content}</>;
}

export function ChartTooltipContent({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-lg border border-white/10 bg-zinc-950 px-2.5 py-1.5 text-xs text-zinc-200 shadow-md",
        className,
      )}
      {...props}
    />
  );
}
