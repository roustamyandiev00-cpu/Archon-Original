import Link from "next/link";
import { BrandFull } from "@/components/BrandLogo";

const columns = [
  {
    title: "Product",
    links: [
      { label: "Offertes", href: "/functies/schatting" },
      { label: "Facturen", href: "/functies/facturen" },
      { label: "Klanten", href: "/functies" },
      { label: "AI-agents", href: "/functies/ai-metgezel" },
    ],
  },
  {
    title: "Bronnen",
    links: [
      { label: "Demo", href: "/dashboard/voorbeeld" },
      { label: "Community", href: "/gemeenschap" },
      { label: "Prijzen", href: "/prijzen" },
      { label: "Support", href: "mailto:support@archonpro.be" },
      { label: "Handleiding", href: "/blog" },
      { label: "API", href: "/ontwikkelaars" },
    ],
  },
  {
    title: "Bedrijf",
    links: [
      { label: "Over ArchonPro", href: "/over" },
      { label: "Contact", href: "/contact" },
      { label: "Vacatures", href: "/vacatures" },
      { label: "Blog", href: "/blog" },
    ],
  },
  {
    title: "Juridisch",
    links: [
      { label: "Privacybeleid", href: "/juridisch#privacy" },
      { label: "Algemene voorwaarden", href: "/juridisch#voorwaarden" },
      { label: "Cookiebeleid", href: "/juridisch#cookies" },
      { label: "GDPR", href: "/juridisch#gdpr" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/10 py-14">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-10 md:grid-cols-[1.5fr_repeat(4,1fr)]">
          <div>
            <Link href="/" className="inline-flex transition-opacity hover:opacity-95">
              <BrandFull width={168} priority />
            </Link>
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
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-sm text-zinc-400 transition-colors hover:text-zinc-100"
                    >
                      {l.label}
                    </Link>
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
          <div className="flex items-center gap-4">
            <a
              href="mailto:support@archonpro.be"
              className="text-xs text-zinc-500 transition-colors hover:text-zinc-300"
            >
              support@archonpro.be
            </a>
            <p className="text-xs text-zinc-500">Gebouwd in België 🇧🇪</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
