import Link from "next/link";
import { Receipt, Plus, Send, CheckCircle2, Euro } from "lucide-react";
import { getCompanyContext } from "@/lib/company";
import { isActivePreviewMode } from "@/components/dashboard/context";
import { showDemoData } from "@/lib/demo-mode";
import { formatEuro, formatDate } from "@/lib/offertes";
import { factuurStatusMeta, documentTypeMeta } from "@/lib/facturen";
import { DEMO_FACTUREN } from "@/lib/demo";
import GlowCard from "@/components/dashboard/GlowCard";
import DocumentContactActions from "@/components/dashboard/DocumentContactActions";

export const metadata = { title: "Facturen — ArchonPro" };

export default async function FacturenPage() {
  const preview = await isActivePreviewMode();
  const { supabase, companyId } = await getCompanyContext();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10);

  type FactuurRow = {
    id: number;
    nummer: string | null;
    klant: string | null;
    totaal_bedrag: number | null;
    datum: string | null;
    vervaldatum: string | null;
    status: string | null;
    document_type: string | null;
    paid_at: string | null;
    email: string | null;
    phone: string | null;
  };

  let facturen: FactuurRow[] = [];

  if (companyId) {
    const { data } = await supabase
      .from("facturen")
      .select(
        "id, nummer, klant, totaal_bedrag, datum, vervaldatum, status, document_type, paid_at, customer_id",
      )
      .eq("bedrijf_id", companyId)
      .order("created_at", { ascending: false });

    const rows = data ?? [];

    // Klant-contactgegevens (e-mail/telefoon) ophalen voor de actie-iconen.
    const customerIds = [
      ...new Set(
        rows
          .map((r) => r.customer_id)
          .filter((id): id is number => typeof id === "number"),
      ),
    ];
    const contactMap = new Map<number, { email: string | null; phone: string | null }>();
    if (customerIds.length > 0) {
      const { data: klanten } = await supabase
        .from("customers")
        .select("id, email, phone")
        .in("id", customerIds);
      for (const k of klanten ?? []) {
        contactMap.set(k.id, { email: k.email, phone: k.phone });
      }
    }

    facturen = rows.map((r) => {
      const contact = r.customer_id ? contactMap.get(r.customer_id) : undefined;
      return {
        id: r.id,
        nummer: r.nummer,
        klant: r.klant,
        totaal_bedrag: r.totaal_bedrag,
        datum: r.datum,
        vervaldatum: r.vervaldatum,
        status: r.status,
        document_type: r.document_type,
        paid_at: r.paid_at,
        email: contact?.email ?? null,
        phone: contact?.phone ?? null,
      };
    });
  }

  const isDemo = showDemoData(preview, facturen.length === 0);
  if (isDemo) facturen = DEMO_FACTUREN;

  const maandOmzet = facturen
    .filter((f) => f.document_type === "factuur" && (f.datum ?? "") >= monthStart)
    .reduce((s, f) => s + Number(f.totaal_bedrag ?? 0), 0);
  const verzonden = facturen.filter((f) => f.status === "verzonden").length;
  const betaald = facturen.filter((f) => f.paid_at || f.status === "betaald")
    .length;
  const openstaand = facturen
    .filter(
      (f) =>
        f.document_type === "factuur" &&
        !f.paid_at &&
        f.status !== "betaald",
    )
    .reduce((s, f) => s + Number(f.totaal_bedrag ?? 0), 0);

  const stats = [
    { label: "Omzet deze maand", value: formatEuro(maandOmzet), icon: Euro },
    { label: "Verzonden", value: String(verzonden), icon: Send },
    { label: "Betaald", value: String(betaald), icon: CheckCircle2 },
    { label: "Openstaand", value: formatEuro(openstaand), icon: Receipt },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-sky-500/10 text-sky-400">
            <Receipt size={20} />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-zinc-50">Facturen</h1>
              {isDemo && (
                <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-300">
                  Demo
                </span>
              )}
            </div>
            <p className="mt-0.5 text-sm text-zinc-500">
              Maak facturen en proforma&apos;s en volg betalingen op.
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/facturen/nieuw"
          className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-4 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-sky-400"
        >
          <Plus size={16} /> Nieuwe factuur
        </Link>
      </header>

      {!companyId && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          Je account is nog niet aan een bedrijf gekoppeld.
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-white/10 bg-zinc-900/60 p-4 backdrop-blur"
          >
            <div className="flex items-center justify-between">
              <p className="text-[11px] uppercase tracking-wide text-zinc-500">
                {s.label}
              </p>
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-sky-500/10 text-sky-400">
                <s.icon size={15} />
              </span>
            </div>
            <p className="mt-2 font-mono text-2xl font-semibold text-zinc-50">
              {s.value}
            </p>
          </div>
        ))}
      </div>

      <GlowCard innerClassName="overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
            Alle facturen
          </h2>
          <span className="text-xs text-zinc-500">{facturen.length} totaal</span>
        </div>

        {facturen.length === 0 ? (
          <div className="grid place-items-center px-6 py-16 text-center">
            <div className="max-w-sm space-y-3">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-sky-500/10 text-sky-400">
                <Receipt size={22} />
              </span>
              <h3 className="text-base font-semibold text-zinc-100">
                Nog geen facturen
              </h3>
              <p className="text-sm text-zinc-500">
                Maak je eerste factuur of proforma aan in enkele minuten.
              </p>
              <Link
                href="/dashboard/facturen/nieuw"
                className="mx-auto mt-1 inline-flex items-center gap-2 rounded-full bg-sky-500 px-4 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-sky-400"
              >
                <Plus size={16} /> Nieuwe factuur
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-[11px] uppercase tracking-wider text-zinc-500">
                  <th className="px-5 py-3 font-semibold">Nummer</th>
                  <th className="px-5 py-3 font-semibold">Type</th>
                  <th className="px-5 py-3 font-semibold">Klant</th>
                  <th className="px-5 py-3 font-semibold">Datum</th>
                  <th className="px-5 py-3 font-semibold">Vervaldatum</th>
                  <th className="px-5 py-3 text-right font-semibold">Bedrag</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 text-right font-semibold">Versturen</th>
                </tr>
              </thead>
              <tbody>
                {facturen.map((f) => {
                  const meta = factuurStatusMeta(f.status);
                  const typeMeta = documentTypeMeta(f.document_type);
                  return (
                    <tr
                      key={f.id}
                      className="group border-b border-white/5 transition-colors last:border-0 hover:bg-white/[0.03]"
                    >
                      <td className="px-5 py-3">
                        {isDemo ? (
                          <span className="font-mono text-zinc-300">
                            {f.nummer ?? `#${f.id}`}
                          </span>
                        ) : (
                          <Link
                            href={`/dashboard/facturen/${f.id}`}
                            className="font-mono text-sky-400 hover:text-sky-300"
                          >
                            {f.nummer ?? `#${f.id}`}
                          </Link>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${typeMeta.tone}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${typeMeta.dot}`}
                          />
                          {typeMeta.label}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-zinc-200">{f.klant}</td>
                      <td className="px-5 py-3 text-zinc-400">
                        {formatDate(f.datum)}
                      </td>
                      <td className="px-5 py-3 text-zinc-400">
                        {formatDate(f.vervaldatum)}
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-zinc-100">
                        {formatEuro(f.totaal_bedrag)}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${meta.tone}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${meta.dot}`}
                          />
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end">
                          <DocumentContactActions
                            soort={
                              f.document_type === "proforma"
                                ? "proforma"
                                : "factuur"
                            }
                            nummer={f.nummer ?? `#${f.id}`}
                            klant={f.klant ?? "klant"}
                            bedrag={f.totaal_bedrag}
                            email={f.email}
                            phone={f.phone}
                            detailPath={
                              isDemo
                                ? undefined
                                : `/dashboard/facturen/${f.id}`
                            }
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </GlowCard>
    </div>
  );
}
