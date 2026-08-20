"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { updateProjectStatus } from "@/app/dashboard/offertes/projecten/actions";
import {
  PROJECT_STATUS_META,
  toUiProjectStatus,
  type ProjectStatus,
} from "@/components/dashboard/projecten/projecten";

export default function ProjectStatusSelect({
  projectId,
  status,
  readOnly,
}: {
  projectId: string;
  status: string;
  readOnly?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const uiStatus = toUiProjectStatus(status);

  if (readOnly) {
    const meta = PROJECT_STATUS_META[uiStatus];
    return (
      <span className="text-sm text-zinc-400">
        {meta?.label ?? status}
      </span>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="relative inline-flex items-center gap-2">
        {pending && <Loader2 size={14} className="animate-spin text-zinc-500" />}
        <select
          aria-label="Projectstatus"
          className="rounded-xl border border-white/10 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-sky-500/60"
          value={uiStatus}
          disabled={pending}
          onChange={(e) => {
            const next = e.target.value as ProjectStatus;
            setError(null);
            startTransition(async () => {
              const result = await updateProjectStatus(projectId, next);
              if ("error" in result) {
                setError("De projectstatus kon niet worden bijgewerkt.");
                return;
              }
              router.refresh();
            });
          }}
        >
          {Object.entries(PROJECT_STATUS_META).map(([key, meta]) => (
            <option key={key} value={key}>
              {meta.label}
            </option>
          ))}
        </select>
      </div>
      {error && (
        <p role="alert" className="text-xs text-rose-400">
          {error}
        </p>
      )}
    </div>
  );
}
