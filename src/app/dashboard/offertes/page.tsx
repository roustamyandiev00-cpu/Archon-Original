import Link from "next/link";
import { FileText, Send, CheckCircle2, Euro } from "lucide-react";
import { getCompanyContext } from "@/lib/company";
import { isActivePreviewMode } from "@/components/dashboard/context";
import { showDemoData } from "@/lib/demo-mode";
import { statusMeta, formatEuro, formatDate } from "@/lib/offertes";
import { DEMO_OFFERTES } from "@/lib/demo";
import GlowCard from "@/components/dashboard/GlowCard";
import DocumentContactActions from "@/components/dashboard/DocumentContactActions";
import NieuweOfferteActions from "@/components/dashboard/offertes/NieuweOfferteActions";

export const metadata = { title: "Offertes — ArchonPro" };

export default async function OffertesPage() {
  const preview = await isActivePreviewMode();
  const { supabase, companyId } = await getCompanyContext();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10);

  type OfferteRow = {
    id: number;
    nummer: string | null;
    klant: string | null;
    bedrag: number | null;
    datum: string | null;
    geldig_tot: string | null;
    status_new: string | null;
    email: string | null;
    phone: string | null;
  };

  let offertes: OfferteRow[] = [];

  if (companyId) {
    const { data } = await supabase
      .from("offertes")
      .select(
        "id, nummer, klant, bedrag, datum, geldig_tot, status_new, customer_id",
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

    offertes = rows.map((r) => {
      const contact = r.customer_id ? contactMap.get(r.customer_id) : undefined;
      return {
        id: r.id,
        nummer: r.nummer,
        klant: r.klant,
        bedrag: r.bedrag,
        datum: r.datum,
        geldig_tot: r.geldig_tot,
        status_new: r.status_new,
        email: contact?.email ?? null,
        phone: contact?.phone ?? null,
      };
    });
  }

  const isDemo = showDemoData(preview, offertes.length === 0);
  if (isDemo) offertes = DEMO_OFFERTES;

  const totaalMaand = offertes.filter(
    (o) => (o.datum ?? "") >= monthStart,
  ).length;
  const verzonden = offertes.filter((o) =>
    ["verzonden", "bekeken"].includes(o.status_new ?? ""),
  ).length;
  const geaccepteerd = offertes.filter(
    (o) => o.status_new === "geaccepteerd",
  ).length;
  const pipeline = offertes
    .filter((o) =>
      ["concept", "verzonden", "bekeken"].includes(o.status_new ?? ""),
    )
    .reduce((s, o) => s + Number(o.bedrag ?? 0), 0);

  const stats = [
    { label: "Offertes deze maand", value: String(totaalMaand), icon: FileText },
    { label: "Verzonden", value: String(verzonden), icon: Send },
    { label: "Geaccepteerd", value: String(geaccepteerd), icon: CheckCircle2 },
    { label: "Open pipeline", value: formatEuro(pipeline), icon: Euro },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-sky-500/10 text-sky-400">
            <FileText size={20} />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-zinc-50">Offertes</h1>
              {isDemo && (
                <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-300">
                  Demo
                </span>
              )}
            </div>
            <p className="mt-0.5 text-sm text-zinc-500">
              Maak, verstuur en volg je offertes op.
            </p>
          </div>
        </div>
        <NieuweOfferteActions />
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
            Alle offertes
          </h2>
          <span className="text-xs text-zinc-500">{offertes.length} totaal</span>
        </div>

        {offertes.length === 0 ? (
          <div className="grid place-items-center px-6 py-16 text-center">
            <div className="max-w-sm space-y-3">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-sky-500/10 text-sky-400">
                <FileText size={22} />
              </span>
              <h3 className="text-base font-semibold text-zinc-100">
                Nog geen offertes
              </h3>
              <p className="text-sm text-zinc-500">
                Maak je eerste offerte aan en verstuur ze in enkele minuten.
              </p>
              <NieuweOfferteActions className="justify-center" />
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-[11px] uppercase tracking-wider text-zinc-500">
                  <th className="px-5 py-3 font-semibold">Nummer</th>
                  <th className="px-5 py-3 font-semibold">Klant</th>
                  <th className="px-5 py-3 font-semibold">Datum</th>
                  <th className="px-5 py-3 font-semibold">Geldig tot</th>
                  <th className="px-5 py-3 text-right font-semibold">Bedrag</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 text-right font-semibold">Versturen</th>
                </tr>
              </thead>
              <tbody>
                {offertes.map((o) => {
                  const meta = statusMeta(o.status_new);
                  return (
                    <tr
                      key={o.id}
                      className="group border-b border-white/5 transition-colors last:border-0 hover:bg-white/[0.03]"
                    >
                      <td className="px-5 py-3">
                        {isDemo ? (
                          <span className="font-mono text-zinc-300">
                            {o.nummer ?? `#${o.id}`}
                          </span>
                        ) : (
                          <Link
                            href={`/dashboard/offertes/${o.id}`}
                            className="font-mono text-sky-400 hover:text-sky-300"
                          >
                            {o.nummer ?? `#${o.id}`}
                          </Link>
                        )}
                      </td>
                      <td className="px-5 py-3 text-zinc-200">{o.klant}</td>
                      <td className="px-5 py-3 text-zinc-400">
                        {formatDate(o.datum)}
                      </td>
                      <td className="px-5 py-3 text-zinc-400">
                        {formatDate(o.geldig_tot)}
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-zinc-100">
                        {formatEuro(o.bedrag)}
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
                            soort="offerte"
                            nummer={o.nummer ?? `#${o.id}`}
                            klant={o.klant ?? "klant"}
                            bedrag={o.bedrag}
                            email={o.email}
                            phone={o.phone}
                            detailPath={
                              isDemo
                                ? undefined
                                : `/dashboard/offertes/${o.id}`
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
