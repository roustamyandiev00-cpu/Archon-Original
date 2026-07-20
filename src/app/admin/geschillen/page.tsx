import type { Metadata } from "next";
import { Scale } from "lucide-react";
import { requirePlatformAdmin } from "@/lib/platform-admin";
import { untyped } from "@/lib/integraties";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { decideGeschil } from "@/app/dashboard/geschillen/actions";

export const metadata: Metadata = {
  title: "Geschillen — CEO Dashboard — ArchonPro",
};

export default async function AdminGeschillenPage() {
  const { serviceSupabase } = await requirePlatformAdmin();
  const { data } = await untyped(serviceSupabase)
    .from("geschillen")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  const rows = (data ?? []) as Array<Record<string, unknown>>;

  return (
    <div className="space-y-6">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
          CEO Dashboard / Moderatie
        </p>
        <h1 className="mt-1 flex items-center gap-2 text-2xl font-semibold text-zinc-50">
          <Scale size={22} /> Geschillen
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">
          AI-samenvatting is een voorstel. Jij beslist met motivatie; partijen
          kunnen bezwaar indienen.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Queue</CardTitle>
          <CardDescription>{rows.length} recente geschillen</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {rows.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-500">Leeg.</p>
          ) : (
            rows.map((g) => (
              <article
                key={String(g.id)}
                className="rounded-xl border border-white/10 bg-zinc-950/40 p-4 space-y-2"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="warning">{String(g.status)}</Badge>
                  <span className="text-sm font-medium text-zinc-100">
                    {String(g.titel)}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 whitespace-pre-wrap">
                  {String(g.beschrijving)}
                </p>
                {g.ai_samenvatting ? (
                  <p className="rounded-lg bg-zinc-900/80 p-2 text-xs text-zinc-300 whitespace-pre-wrap">
                    {String(g.ai_samenvatting)}
                  </p>
                ) : null}
                {g.melder_verklaring ? (
                  <p className="text-xs text-zinc-500">
                    Melder: {String(g.melder_verklaring)}
                  </p>
                ) : null}
                {g.tegenpartij_verklaring ? (
                  <p className="text-xs text-zinc-500">
                    Tegenpartij: {String(g.tegenpartij_verklaring)}
                  </p>
                ) : null}
                {g.motivatie ? (
                  <p className="text-xs text-emerald-300">
                    Motivatie: {String(g.motivatie)}
                  </p>
                ) : null}
                {g.bezwaar_reden ? (
                  <p className="text-xs text-amber-300">
                    Bezwaar: {String(g.bezwaar_reden)}
                  </p>
                ) : null}

                {(g.status === "samenvatting_klaar" ||
                  g.status === "verklaringen" ||
                  g.status === "in_bezwaar" ||
                  g.status === "ingediend") && (
                  <form
                    action={async (fd) => {
                      "use server";
                      const motivatie = String(fd.get("motivatie") ?? "");
                      await decideGeschil({
                        geschilId: String(g.id),
                        motivatie,
                      });
                    }}
                    className="flex flex-wrap gap-2 pt-2"
                  >
                    <input
                      name="motivatie"
                      required
                      minLength={10}
                      placeholder="Motivatie van de uitspraak…"
                      className="min-w-[220px] flex-1 rounded-lg border border-white/10 bg-zinc-900 px-2 py-1.5 text-xs"
                    />
                    <button
                      type="submit"
                      className="rounded-full bg-emerald-500/90 px-3 py-1.5 text-xs font-semibold text-white"
                    >
                      Beslissen
                    </button>
                  </form>
                )}
              </article>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
