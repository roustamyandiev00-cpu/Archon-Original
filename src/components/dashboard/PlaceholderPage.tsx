import type { ReactNode } from "react";
import ModuleWipBanner from "@/components/dashboard/ModuleWipBanner";

export default function PlaceholderPage({
  title,
  description,
  icon,
  features,
  moduleId,
}: {
  title: string;
  description: string;
  icon: ReactNode;
  features?: string[];
  /** Unieke sleutel voor het uitzetbare WIP-bericht. */
  moduleId: string;
}) {
  return (
    <div className="space-y-5">
      <ModuleWipBanner
        moduleId={moduleId}
        title={`${title} is nog in ontwikkeling`}
        description={`Je kan deze pagina al openen. De functionaliteit voor ${title.toLowerCase()} wordt verder afgewerkt. Verberg dit bericht als je wilt — het blijft beschikbaar via de navigatie.`}
      />

      <header className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-sky-500/10 text-sky-400">
          {icon}
        </span>
        <div>
          <h1 className="text-xl font-semibold text-zinc-50">{title}</h1>
          <p className="mt-0.5 text-sm text-zinc-500">{description}</p>
        </div>
      </header>

      <div className="grid place-items-center rounded-2xl border border-dashed border-white/10 bg-zinc-900/40 px-6 py-16 text-center">
        <div className="max-w-md space-y-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-amber-300">
            In opbouw
          </span>
          <h2 className="text-lg font-semibold text-zinc-100">
            Pagina is bereikbaar — functie volgt
          </h2>
          <p className="text-sm text-zinc-500">
            Navigatie werkt. Zodra{" "}
            <span className="text-zinc-300">{title.toLowerCase()}</span> klaar
            is, krijg je hier de volledige module.
          </p>

          {features && features.length > 0 && (
            <ul className="mt-4 space-y-1.5 text-left">
              {features.map((f) => (
                <li
                  key={f}
                  className="flex items-center gap-2 text-sm text-zinc-400"
                >
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400" />
                  {f}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
