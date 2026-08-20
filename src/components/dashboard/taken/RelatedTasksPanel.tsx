import Link from "next/link";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import RelatedTasksCreateButton from "@/components/dashboard/taken/RelatedTasksCreateButton";
import { queryCompanyTasks } from "@/lib/tasks/query";

type LinkTarget = {
  contactId?: number;
  dealId?: number;
  offerteId?: number;
  factuurId?: number;
  projectId?: number;
  afspraakId?: number;
};

export default async function RelatedTasksPanel({
  supabase,
  companyId,
  canWrite,
  title = "Gekoppelde taken",
  presetTitle,
  links,
}: {
  supabase: SupabaseClient<Database>;
  companyId: number;
  canWrite: boolean;
  title?: string;
  presetTitle?: string;
  links: LinkTarget;
}) {
  const { data, error } = await queryCompanyTasks(supabase, companyId, {
    ...links,
    pageSize: 10,
  });

  return (
    <section className="rounded-xl border border-white/10 bg-zinc-900/40 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-zinc-100">{title}</h2>
        {canWrite ? (
          <RelatedTasksCreateButton
            presetTitle={presetTitle ?? "Nieuwe opvolgtaak"}
            links={links}
          />
        ) : null}
      </div>

      {error ? (
        <p className="text-sm text-rose-300">Taken konden niet worden geladen.</p>
      ) : (data ?? []).length === 0 ? (
        <p className="text-sm text-zinc-500">Nog geen gekoppelde taken.</p>
      ) : (
        <ul className="space-y-2">
          {(data ?? []).map((task) => (
            <li
              key={task.id}
              className="flex items-center justify-between gap-2 text-sm"
            >
              <Link
                href={`/dashboard/taken/${task.id}`}
                className="text-zinc-200 hover:text-sky-300"
              >
                {task.title}
              </Link>
              <span className="text-xs text-zinc-500">{task.status}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
