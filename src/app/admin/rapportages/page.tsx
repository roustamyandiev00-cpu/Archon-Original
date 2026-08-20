import type { Metadata } from "next";
import { Flag } from "lucide-react";
import { requirePlatformAdmin } from "@/lib/platform-admin";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { resolveContentRapportage } from "@/app/dashboard/bouwnetwerk/rapportage-actions";

export const metadata: Metadata = {
  title: "Rapportages — CEO Dashboard — ArchonPro",
};

type RapportageRow = {
  id: string;
  reporter_user_id: string;
  reporter_company_id: number;
  target_type: string;
  target_id: string;
  reden: string;
  status: string;
  created_at: string;
  resolved_at: string | null;
};

const statusVariant = {
  open: "warning",
  behandeld: "success",
  afgewezen: "danger",
} as const;

const targetLabel: Record<string, string> = {
  chat_bericht: "Chatbericht",
  werkpost: "Werkpost",
  review: "Review",
};

export default async function AdminRapportagesPage() {
  const { serviceSupabase } = await requirePlatformAdmin();

  const { data } = await serviceSupabase
    .from("content_rapportages")
    .select(
      "id, reporter_user_id, reporter_company_id, target_type, target_id, reden, status, created_at, resolved_at",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  const rows = (data ?? []) as RapportageRow[];
  const openCount = rows.filter((r) => r.status === "open").length;

  return (
    <div className="space-y-6">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
          CEO Dashboard / Moderatie
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-50 sm:text-3xl">
          Content-rapportages
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">
          Handmatige queue van meldingen door gebruikers. Geen automatische
          sancties in Fase 1 — markeer als behandeld of afgewezen.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Open</CardDescription>
            <CardTitle className="text-2xl">{openCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Totaal (max. 100)</CardDescription>
            <CardTitle className="text-2xl">{rows.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Bronnen</CardDescription>
            <CardTitle className="text-base font-medium text-zinc-300">
              Chat · Werkposts · Reviews
            </CardTitle>
          </CardHeader>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Flag size={16} /> Meldingen
          </CardTitle>
          <CardDescription>
            Nieuwste eerst. Service-role leest alle rijen.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {rows.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-500">
              Nog geen rapportages.
            </p>
          ) : (
            rows.map((row) => (
              <article
                key={row.id}
                className="rounded-xl border border-white/10 bg-zinc-950/40 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant={
                          statusVariant[
                            row.status as keyof typeof statusVariant
                          ] ?? "default"
                        }
                      >
                        {row.status}
                      </Badge>
                      <span className="text-xs font-medium text-zinc-300">
                        {targetLabel[row.target_type] ?? row.target_type}
                      </span>
                      <span className="font-mono text-[11px] text-zinc-500">
                        #{row.target_id.slice(0, 12)}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-200 whitespace-pre-wrap">
                      {row.reden}
                    </p>
                    <p className="text-[11px] text-zinc-500">
                      Bedrijf {row.reporter_company_id} ·{" "}
                      {new Date(row.created_at).toLocaleString("nl-BE")}
                      {row.resolved_at
                        ? ` · afgehandeld ${new Date(row.resolved_at).toLocaleString("nl-BE")}`
                        : ""}
                    </p>
                  </div>

                  {row.status === "open" && (
                    <div className="flex flex-wrap gap-2">
                      <form
                        action={async () => {
                          "use server";
                          await resolveContentRapportage({
                            id: row.id,
                            status: "behandeld",
                          });
                        }}
                      >
                        <button
                          type="submit"
                          className="rounded-full bg-emerald-500/90 px-3 py-1.5 text-xs font-semibold text-white"
                        >
                          Behandeld
                        </button>
                      </form>
                      <form
                        action={async () => {
                          "use server";
                          await resolveContentRapportage({
                            id: row.id,
                            status: "afgewezen",
                          });
                        }}
                      >
                        <button
                          type="submit"
                          className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-white/5"
                        >
                          Afwijzen
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              </article>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
