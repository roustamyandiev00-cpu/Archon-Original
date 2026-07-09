const partners = [
  { name: "Bouwgroep De Meyer", initials: "BD", color: "text-sky-400" },
  { name: "Dakwerken Janssens", initials: "DJ", color: "text-cyan-400" },
  { name: "Construct BVBA", initials: "CB", color: "text-indigo-400" },
  { name: "Renovatie Peeters", initials: "RP", color: "text-violet-400" },
];

export default function HeroTrustBar() {
  return (
    <div className="relative z-10 border-t border-white/[0.06] bg-zinc-950/50 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 px-6 py-5 sm:flex-row lg:px-8">
        <p className="shrink-0 text-center text-sm text-zinc-500 sm:text-left">
          Vertrouwd door bouwbedrijven in België
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 sm:justify-end lg:gap-x-8">
          {partners.map((partner) => (
            <span
              key={partner.name}
              className="flex items-center gap-2.5 text-sm font-medium text-zinc-400"
            >
              <span
                className={`grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-[10px] font-bold ${partner.color}`}
              >
                {partner.initials}
              </span>
              <span className="hidden sm:inline">{partner.name}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
