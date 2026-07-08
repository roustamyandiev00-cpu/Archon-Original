import Image from "next/image";

const columns = [
  {
    title: "Product",
    links: ["Offertes", "Facturen", "Klanten", "AI-agents"],
  },
  {
    title: "Bronnen",
    links: ["Demo", "Prijzen", "Support", "Handleiding"],
  },
  {
    title: "Bedrijf",
    links: ["Over ArchonPro", "Contact", "Vacatures", "Blog"],
  },
  {
    title: "Juridisch",
    links: ["Privacybeleid", "Algemene voorwaarden", "Cookiebeleid", "GDPR"],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/10 py-14">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-10 md:grid-cols-[1.5fr_repeat(4,1fr)]">
          <div>
            <div className="flex items-center gap-2">
              <Image
                src="/logo-tile.png"
                alt="ArchonPro logo"
                width={36}
                height={36}
                className="h-9 w-9 rounded-lg"
              />
              <span className="text-base font-semibold text-zinc-100">
                ArchonPro
              </span>
            </div>
            <p className="mt-4 max-w-xs text-sm text-zinc-400">
              De slimme CRM-werkruimte voor zelfstandige vakmensen in bouw,
              renovatie, installatie en onderhoud.
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold text-zinc-200">
                {col.title}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l}>
                    <a
                      href="#"
                      className="text-sm text-zinc-400 transition-colors hover:text-zinc-100"
                    >
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 sm:flex-row">
          <p className="text-xs text-zinc-500">
            © {new Date().getFullYear()} ArchonPro. Alle rechten voorbehouden.
          </p>
          <p className="text-xs text-zinc-500">Gebouwd in België 🇧🇪</p>
        </div>
      </div>
    </footer>
  );
}
