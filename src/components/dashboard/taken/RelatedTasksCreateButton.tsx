"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { createTask } from "@/app/dashboard/taken/actions";

export default function RelatedTasksCreateButton({
  presetTitle,
  links,
}: {
  presetTitle: string;
  links: {
    contactId?: number;
    dealId?: number;
    offerteId?: number;
    factuurId?: number;
    projectId?: number;
    afspraakId?: number;
  };
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      className="rounded-full border border-white/15 px-3 py-1 text-xs text-zinc-200 hover:bg-white/5 disabled:opacity-50"
      onClick={() =>
        startTransition(async () => {
          const result = await createTask({
            title: presetTitle,
            status: "todo",
            priority: "normal",
            contactId: links.contactId,
            dealId: links.dealId,
            offerteId: links.offerteId,
            factuurId: links.factuurId,
            projectId: links.projectId,
            afspraakId: links.afspraakId,
          });
          if (result.ok) {
            router.push(`/dashboard/taken/${result.id}`);
            router.refresh();
          }
        })
      }
    >
      + Taak
    </button>
  );
}
