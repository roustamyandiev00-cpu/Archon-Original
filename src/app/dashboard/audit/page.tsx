import type { Metadata } from "next";
import { getDashboardContext } from "@/components/dashboard/context";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Audit Log — ArchonPro" };

const PAGE_SIZE = 25;

type AuditRow = {
  id: string;
  created_at: string;
  actor_id: string | null;
  event_type: string;
  event_category: string;
  severity: string;
  target_type: string | null;
  target_id: string | null;
  metadata: Record<string, unknown> | null;
};

function sanitizeMetadata(
  metadata: Record<string, unknown> | null,
): Record<string, unknown> | null {
  if (!metadata) return null;
  const blocked = new Set([
    "password",
    "token",
    "secret",
    "apiKey",
    "api_key",
    "access_token",
    "refresh_token",
    "authorization",
  ]);
  const safe: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (blocked.has(key.toLowerCase())) continue;
    if (typeof value === "string" && value.length > 200) {
      safe[key] = `${value.slice(0, 200)}…`;
      continue;
    }
    if (value !== null && typeof value === "object") continue;
    safe[key] = value;
  }
  return safe;
}

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; action?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const actionFilter = params.action?.trim() || "";

  const ctx = await getDashboardContext();
  if (!ctx.user || !ctx.companyId) {
    return (
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
        Geen actief bedrijf gevonden. Log in om auditlogs te bekijken.
      </div>
    );
  }

  const supabase = await createClient();
  const { data: isAdmin } = await supabase.rpc("is_company_admin", {
    p_company_id: ctx.companyId,
  });

  if (!isAdmin && !ctx.impersonating) {
    return (
      <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-100">
        Alleen beheerders kunnen de auditlog bekijken.
      </div>
    );
  }

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("audit_logs")
    .select(
      "id, created_at, actor_id, event_type, event_category, severity, target_type, target_id, metadata",
      { count: "exact" },
    )
    .eq("company_id", ctx.companyId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (actionFilter) {
    query = query.ilike("event_type", `%${actionFilter}%`);
  }

  const { data, error, count } = await query;
  const rows = (data ?? []) as AuditRow[];
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-zinc-100">Audit Log</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Wijzigingen en beveiligingsgebeurtenissen voor dit bedrijf.
        </p>
      </div>

      <form className="flex flex-wrap gap-2">
        <input
          name="action"
          defaultValue={actionFilter}
          placeholder="Filter op actie…"
          className="rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
        />
        <button
          type="submit"
          className="rounded-lg bg-sky-500 px-3 py-2 text-sm font-medium text-zinc-950"
        >
          Filter
        </button>
      </form>

      {error ? (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-100">
          Auditlogs konden niet worden geladen.
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-zinc-900/40 p-4 text-sm text-zinc-400">
          Geen auditgebeurtenissen gevonden.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-zinc-900/80 text-zinc-400">
              <tr>
                <th className="px-3 py-2 font-medium">Tijd</th>
                <th className="px-3 py-2 font-medium">Actie</th>
                <th className="px-3 py-2 font-medium">Actor</th>
                <th className="px-3 py-2 font-medium">Doel</th>
                <th className="px-3 py-2 font-medium">Details</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const meta = sanitizeMetadata(row.metadata);
                return (
                  <tr key={row.id} className="border-t border-white/5">
                    <td className="whitespace-nowrap px-3 py-2 text-zinc-300">
                      {new Date(row.created_at).toLocaleString("nl-BE")}
                    </td>
                    <td className="px-3 py-2 text-zinc-100">{row.event_type}</td>
                    <td className="px-3 py-2 font-mono text-xs text-zinc-400">
                      {row.actor_id ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-zinc-400">
                      {row.target_type
                        ? `${row.target_type}${row.target_id ? ` #${row.target_id}` : ""}`
                        : "—"}
                    </td>
                    <td className="px-3 py-2 text-xs text-zinc-500">
                      {meta ? JSON.stringify(meta) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-zinc-400">
        <span>
          Pagina {page} / {totalPages} ({total} events)
        </span>
        <div className="flex gap-2">
          {page > 1 ? (
            <a
              className="rounded-lg border border-white/10 px-3 py-1.5 hover:bg-white/5"
              href={`/dashboard/audit?page=${page - 1}${actionFilter ? `&action=${encodeURIComponent(actionFilter)}` : ""}`}
            >
              Vorige
            </a>
          ) : null}
          {page < totalPages ? (
            <a
              className="rounded-lg border border-white/10 px-3 py-1.5 hover:bg-white/5"
              href={`/dashboard/audit?page=${page + 1}${actionFilter ? `&action=${encodeURIComponent(actionFilter)}` : ""}`}
            >
              Volgende
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
