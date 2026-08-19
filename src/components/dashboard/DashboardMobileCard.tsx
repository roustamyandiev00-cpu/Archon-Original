import type { ReactNode } from "react";
import { cn } from "@/components/ui/utils";

export function DashboardMobileCard({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <article
      className={cn(
        "dashboard-mobile-card rounded-xl border border-white/10 bg-zinc-900/40 p-3",
        className,
      )}
    >
      {children}
    </article>
  );
}

export function DashboardMobileEmpty({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-12 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-xl bg-white/5 text-zinc-500">
        {icon}
      </span>
      <p className="mt-3 text-sm font-medium text-zinc-200">{title}</p>
      <p className="mt-1 max-w-xs text-xs text-zinc-500">{description}</p>
    </div>
  );
}
