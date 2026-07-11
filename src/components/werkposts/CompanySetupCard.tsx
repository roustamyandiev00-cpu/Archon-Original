"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Loader2 } from "lucide-react";
import { provisionCompany } from "@/app/dashboard/werkposts/actions";

export default function CompanySetupCard() {
  const router = useRouter();
  const [naam, setNaam] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!naam.trim()) return;
    setError(null);
    setLoading(true);
    const res = await provisionCompany(naam);
    if ("error" in res && res.error) {
      setLoading(false);
      setError(res.error);
      return;
    }
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-zinc-900/50 p-6 text-center sm:p-8">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-sky-500/10 text-sky-400">
        <Building2 size={22} />
      </span>
      <h3 className="mt-4 text-lg font-semibold text-zinc-50">
        Rond je bedrijfsprofiel af
      </h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-zinc-400">
        Om een werkpost te plaatsen en met andere bedrijven te chatten, koppelen
        we je account eerst aan een bedrijf. Vul je bedrijfsnaam in — je kan de
        rest later aanvullen in de instellingen.
      </p>

      {mounted ? (
        <form
          onSubmit={handleSubmit}
          className="mx-auto mt-5 flex max-w-md flex-col gap-3 sm:flex-row"
        >
          <input
            value={naam}
            onChange={(e) => setNaam(e.target.value)}
            placeholder="Bedrijfsnaam"
            name="company"
            autoComplete="organization"
            className="flex-1 rounded-full border border-white/10 bg-zinc-900/70 px-4 py-2.5 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-500 focus:border-sky-500/60"
            required
          />
          <button
            type="submit"
            disabled={loading || !naam.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-sky-500 px-5 py-2.5 text-sm font-medium text-zinc-950 transition-colors hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Aanmaken…
              </>
            ) : (
              "Bedrijf aanmaken"
            )}
          </button>
        </form>
      ) : (
        <div
          aria-hidden
          className="mx-auto mt-5 flex max-w-md flex-col gap-3 sm:flex-row"
        >
          <div className="h-10 flex-1 rounded-full border border-white/10 bg-zinc-900/70" />
          <div className="h-10 w-36 rounded-full bg-sky-500/40" />
        </div>
      )}

      {error && <p className="mt-3 text-sm text-rose-400">{error}</p>}
    </div>
  );
}
