import {
  Gift,
  Link2,
  Share2,
  Users,
  Sparkles,
  Percent,
} from "lucide-react";

/** Vaste beloningen — centraal zodat copy overal gelijk blijft. */
export const REFERRAL_REWARDS = {
  inviter: "20% korting op je volgende maand",
  invitee: "20% korting op je eerste maand",
  extra: "14 dagen gratis proefperiode",
} as const;

export default function ReferralProgram({ compact }: { compact?: boolean }) {
  const steps = [
    {
      icon: <Users size={16} />,
      title: "Start gratis",
      text: "Maak je account aan en ontvang meteen je persoonlijke code (initialen + cijfers).",
    },
    {
      icon: <Share2 size={16} />,
      title: "Deel met collega's",
      text: "Stuur je link naar vakmensen, onderaannemers of partners in je netwerk.",
    },
    {
      icon: <Gift size={16} />,
      title: "Jullie krijgen allebei korting",
      text: `Jij: ${REFERRAL_REWARDS.inviter}. Zij: ${REFERRAL_REWARDS.invitee}.`,
    },
  ];

  if (compact) {
    return (
      <div className="rounded-2xl border border-violet-500/25 bg-gradient-to-br from-violet-500/10 via-zinc-900/40 to-sky-500/10 p-5">
        <p className="flex items-center gap-2 text-sm font-semibold text-violet-200">
          <Sparkles size={15} className="text-violet-400" />
          Nodig collega&apos;s uit, verdien korting
        </p>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          Deel ArchonPro met vakmensen uit je netwerk.{" "}
          <span className="text-zinc-200">
            {REFERRAL_REWARDS.inviter}
          </span>{" "}
          per collega die start — zij krijgen{" "}
          <span className="text-zinc-200">{REFERRAL_REWARDS.invitee}</span>.
        </p>
      </div>
    );
  }

  return (
    <div className="panel-soft relative overflow-hidden p-6 sm:p-7 ring-1 ring-inset ring-violet-500/10">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-violet-500/20 blur-3xl"
      />

      <div className="relative">
        <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-violet-300">
          <Gift size={12} /> Referral-programma
        </div>

        <h3 className="mt-4 text-xl font-semibold tracking-tight text-zinc-50 sm:text-2xl">
          Nodig collega&apos;s uit.{" "}
          <span className="text-violet-300">Jullie krijgen allebei korting.</span>
        </h3>

        <p className="mt-3 text-sm leading-relaxed text-zinc-400">
          Ken je een elektricien, loodgieter of aannemer die nog met Excel en
          WhatsApp werkt? Deel je link — iedereen wint.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {steps.map((s) => (
            <div
              key={s.title}
              className="card-subtle p-4"
            >
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-violet-500/15 text-violet-300">
                {s.icon}
              </span>
              <p className="mt-3 text-sm font-medium text-zinc-100">{s.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                {s.text}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-medium text-emerald-300">
            <Percent size={13} />
            Jij: {REFERRAL_REWARDS.inviter}
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-sky-500/25 bg-sky-500/10 px-3.5 py-1.5 text-xs font-medium text-sky-300">
            <Percent size={13} />
            Collega: {REFERRAL_REWARDS.invitee}
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-violet-500/25 bg-violet-500/10 px-3.5 py-1.5 text-xs font-medium text-violet-300">
            <Link2 size={13} />
            Code direct na registratie
          </span>
        </div>
      </div>
    </div>
  );
}
