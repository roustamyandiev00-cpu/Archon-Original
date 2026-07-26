"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/components/ui/utils";

interface OverviewKpiCardProps {
  title: string;
  value: string;
  change: string;
  positive?: boolean;
  icon: ReactNode;
  tone: "sky" | "emerald" | "violet" | "amber" | "rose" | "cyan";
  href: string;
  subtitle?: string;
}

const toneStyles = {
  sky: "bg-sky-500/10 text-sky-400 border-sky-500/10",
  emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/10",
  violet: "bg-violet-500/10 text-violet-400 border-violet-500/10",
  amber: "bg-amber-500/10 text-amber-400 border-amber-500/10",
  rose: "bg-rose-500/10 text-rose-400 border-rose-500/10",
  cyan: "bg-cyan-500/10 text-cyan-400 border-cyan-500/10",
};

export default function OverviewKpiCard({
  title,
  value,
  change,
  positive = true,
  icon,
  tone,
  href,
  subtitle,
}: OverviewKpiCardProps) {
  return (
    <Link href={href} className="block group">
      <Card className="overflow-hidden bg-[#252329] border-white/5 transition-all duration-300 group-hover:border-[#21B7E8]/20 group-hover:shadow-[0_4px_20px_rgba(33,183,232,0.05)]">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 group-hover:text-zinc-400 transition-colors">
                {title}
              </p>
              <p className="mt-2 font-mono text-2xl font-semibold tracking-tight text-zinc-50 group-hover:text-[#21B7E8] transition-colors sm:text-[1.65rem]">
                {value}
              </p>
              <div className="mt-2 flex flex-col gap-0.5">
                <div className="flex items-center gap-1 text-xs">
                  <span
                    className={cn(
                      "inline-flex items-center gap-0.5 font-medium",
                      positive ? "text-[#20D58A]" : "text-[#F05268]"
                    )}
                  >
                    {positive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                    {change}
                  </span>
                </div>
                {subtitle && (
                  <span className="text-[10px] text-zinc-500 font-medium">
                    {subtitle}
                  </span>
                )}
              </div>
            </div>
            <span
              className={cn(
                "grid h-10 w-10 shrink-0 place-items-center rounded-xl border transition-all duration-300 group-hover:scale-105",
                toneStyles[tone]
              )}
            >
              {icon}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
