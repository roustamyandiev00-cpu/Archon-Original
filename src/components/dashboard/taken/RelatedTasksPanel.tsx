import Link from "next/link";
import { listTasks } from "@/app/dashboard/taken/actions";
import type { TaskRow } from "@/lib/tasks/types";

type RelatedFilter = {
  contactId?: number;
  offerteId?: number;
  factuurId?: number;
  projectId?: string;
  dealId?: number;
  afspraakId?: number;
};

export default async function RelatedTasksPanel({
  filter,
  createHref,
}: {
  filter: RelatedFilter;
  createHref?: string;
}) {
  const result = await listTasks({ ...filter, pageSize: 10 });
  const tasks: TaskRow[] =
    "tasks" in result && Array.isArray(result.tasks) ? result.tasks : [];
  const error = "error" in result ? result.error : null;

  return (
    <div className="rounded-xl border border-white/10 bg-zinc-900/40 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium text-zinc-200">Gekoppelde taken</h3>
        <Link
          href={createHref ?? "/dashboard/taken"}
          className="text-xs text-sky-400 hover:text-sky-300"
        >
          Nieuwe taak
        </Link>
      </div>
      {error ? (
        <p className="text-xs text-rose-300">{error}</p>
      ) : tasks.length === 0 ? (
        <p className="text-xs text-zinc-500">Nog geen taken gekoppeld.</p>
      ) : (
        <ul className="space-y-2">
          {tasks.map((task) => (
            <li key={task.id}>
              <Link
                href={`/dashboard/taken/${task.id}`}
                className="block rounded-lg border border-white/5 px-3 py-2 text-sm text-zinc-200 hover:border-sky-500/30"
              >
                <span className="font-medium">{task.title}</span>
                <span className="mt-0.5 block text-xs text-zinc-500">
                  {task.status} · {task.priority}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
