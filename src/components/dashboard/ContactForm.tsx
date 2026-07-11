"use client";

import { useCallback, useSyncExternalStore, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CalendarClock,
  CheckCircle2,
  Clock,
  Copy,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  MessageSquare,
  Phone,
  Trash2,
  User,
  Users,
  X,
} from "lucide-react";
import { DEMO_CONTACTS } from "@/lib/demo";
import { BtwLookupField } from "@/components/dashboard/contacten/BtwLookupField";
import type { CompanyLookupResult } from "@/components/dashboard/contacten/companyLookup";

type ContactType = "particulier" | "bedrijf";

type Contact = {
  id: string;
  type: ContactType;
  voornaam: string;
  achternaam: string;
  email: string;
  telefoon: string;
  bedrijfsnaam: string;
  bedrijfsgrootte: string;
  btw?: string;
  ondernemingsnummer?: string;
  adres?: string;
  bron: string;
  bericht: string;
  createdAt: string;
};

const STORAGE_KEY = "archon.contacten";
const CONTACTS_EVENT = "archon.contacten-updated";

function readContacts(): Contact[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Contact[];
  } catch {
    // ongeldige opslag
  }
  return DEMO_CONTACTS;
}

function subscribeContacts(onStoreChange: () => void) {
  window.addEventListener(CONTACTS_EVENT, onStoreChange);
  return () => window.removeEventListener(CONTACTS_EVENT, onStoreChange);
}

const perks = [
  {
    icon: BadgeCheck,
    title: "Persoonlijk advies",
    text: "Praat rechtstreeks met onze specialisten.",
  },
  {
    icon: MessageSquare,
    title: "Oplossing op maat",
    text: "Een aanpak die bij jouw onderneming past.",
  },
  {
    icon: Clock,
    title: "Snel antwoord",
    text: "We komen dezelfde werkdag bij je terug.",
  },
];

const companySizes = ["1–5", "6–20", "21–50", "51–200", "200+"];

export default function ContactForm() {
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [type, setType] = useState<ContactType>("bedrijf");
  const contacts = useSyncExternalStore(
    subscribeContacts,
    readContacts,
    () => DEMO_CONTACTS,
  );
  const [selected, setSelected] = useState<Contact | null>(null);
  const [btw, setBtw] = useState("");
  const [bedrijfsnaam, setBedrijfsnaam] = useState("");
  const [ondernemingsnummer, setOndernemingsnummer] = useState("");
  const [adres, setAdres] = useState("");
  const isBedrijf = type === "bedrijf";

  const applyCompanyLookup = useCallback((data: CompanyLookupResult) => {
    setBtw(data.btw);
    setBedrijfsnaam(data.name);
    setOndernemingsnummer(data.ondernemingsnummer);
    const line = [data.street, data.postcode, data.city].filter(Boolean).join(", ");
    setAdres(line || data.address);
  }, []);

  function persist(next: Contact[]) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(new Event(CONTACTS_EVENT));
    } catch {
      // opslag niet beschikbaar
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);

    const fd = new FormData(e.currentTarget);
    const get = (k: string) => (fd.get(k) as string | null)?.trim() ?? "";

    const contact: Contact = {
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : String(Date.now()),
      type,
      voornaam: get("voornaam"),
      achternaam: get("achternaam"),
      email: get("email"),
      telefoon: get("telefoon"),
      bedrijfsnaam: isBedrijf ? bedrijfsnaam || get("bedrijfsnaam") : "",
      bedrijfsgrootte: get("bedrijfsgrootte"),
      btw: isBedrijf ? btw || get("btw") : "",
      ondernemingsnummer: isBedrijf ? ondernemingsnummer : "",
      adres: isBedrijf ? adres : "",
      bron: get("bron"),
      bericht: get("bericht"),
      createdAt: new Date().toISOString(),
    };

    await new Promise((r) => setTimeout(r, 600));
    persist([contact, ...contacts]);
    setSubmitting(false);
    setSent(true);
    setBtw("");
    setBedrijfsnaam("");
    setOndernemingsnummer("");
    setAdres("");
    e.currentTarget.reset();
  }

  function removeContact(id: string) {
    persist(contacts.filter((c) => c.id !== id));
  }

  return (
    <div className="relative space-y-8">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-x-6 -top-8 bottom-0 -z-10"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(56,189,248,0.14),transparent)]" />
        <div className="absolute right-0 top-1/4 h-64 w-64 rounded-full bg-sky-500/[0.05] blur-3xl" />
        <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full bg-cyan-500/[0.05] blur-3xl" />
      </div>

      <div className="overflow-hidden rounded-3xl border border-white/[0.08] bg-zinc-950/80 shadow-[0_40px_100px_-50px_rgba(0,0,0,0.8)] backdrop-blur-sm">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
          <div className="flex flex-col border-b border-white/[0.06] p-6 sm:p-8 lg:border-b-0 lg:border-r lg:p-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-400/90">
              Contact
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-50 sm:text-[2.35rem] sm:leading-tight">
              Ontdek de perfecte fit met{" "}
              <span className="bg-gradient-to-r from-cyan-400 to-sky-400 bg-clip-text text-transparent">
                ArchonPro
              </span>
            </h1>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-zinc-400">
              Vertel ons kort iets over je onderneming en we nemen snel contact
              met je op.
            </p>

            <ul className="mt-8 space-y-5">
              {perks.map((p) => (
                <li key={p.title} className="flex items-start gap-3.5">
                  <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-sky-500/20 bg-sky-500/10 text-sky-400">
                    <p.icon size={16} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-zinc-100">
                      {p.title}
                    </p>
                    <p className="mt-0.5 text-sm leading-relaxed text-zinc-500">
                      {p.text}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-auto pt-10">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-600">
                Of bereik ons direct
              </p>
              <div className="mt-4 space-y-3">
                <a
                  href="mailto:hallo@archonpro.be"
                  className="group flex items-center gap-3 rounded-xl border border-transparent px-1 py-1 text-sm text-zinc-300 transition-colors hover:text-sky-200"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/[0.06] bg-zinc-900/80 text-sky-400 transition-colors group-hover:border-sky-500/20 group-hover:bg-sky-500/10">
                    <Mail size={15} />
                  </span>
                  hallo@archonpro.be
                </a>
                <a
                  href="tel:+3231234567"
                  className="group flex items-center gap-3 rounded-xl border border-transparent px-1 py-1 text-sm text-zinc-300 transition-colors hover:text-sky-200"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/[0.06] bg-zinc-900/80 text-sky-400 transition-colors group-hover:border-sky-500/20 group-hover:bg-sky-500/10">
                    <Phone size={15} />
                  </span>
                  +32 3 123 45 67
                </a>
                <div className="flex items-center gap-3 px-1 py-1 text-sm text-zinc-500">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/[0.06] bg-zinc-900/80 text-sky-400/80">
                    <Clock size={15} />
                  </span>
                  Gemiddelde reactietijd: binnen 4 uur
                </div>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900/40 p-6 sm:p-8 lg:p-10">
            {sent ? (
              <SuccessState onReset={() => setSent(false)} />
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <span className="mb-2 block text-xs font-medium text-zinc-400">
                    Ik ben een <span className="text-sky-400">*</span>
                  </span>
                  <div className="grid grid-cols-2 gap-1 rounded-xl border border-white/[0.08] bg-zinc-950/60 p-1">
                    <SegmentButton
                      active={type === "particulier"}
                      onClick={() => {
                        setType("particulier");
                        setBtw("");
                        setBedrijfsnaam("");
                        setOndernemingsnummer("");
                        setAdres("");
                      }}
                      icon={<User size={15} />}
                      label="Particulier"
                    />
                    <SegmentButton
                      active={isBedrijf}
                      onClick={() => setType("bedrijf")}
                      icon={<Building2 size={15} />}
                      label="Bedrijf"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Voornaam" required>
                    <input
                      required
                      name="voornaam"
                      type="text"
                      autoComplete="given-name"
                      placeholder="Sarah"
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Achternaam" required>
                    <input
                      required
                      name="achternaam"
                      type="text"
                      autoComplete="family-name"
                      placeholder="Thompson"
                      className={inputCls}
                    />
                  </Field>
                </div>

                {isBedrijf && (
                  <>
                    <BtwLookupField
                      value={btw}
                      onChange={setBtw}
                      onResolved={applyCompanyLookup}
                    />
                    <input
                      type="hidden"
                      name="ondernemingsnummer"
                      value={ondernemingsnummer}
                    />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Bedrijfsnaam" required>
                        <input
                          required
                          name="bedrijfsnaam"
                          type="text"
                          autoComplete="organization"
                          placeholder="Bouwbedrijf Peeters BV"
                          value={bedrijfsnaam}
                          onChange={(e) => setBedrijfsnaam(e.target.value)}
                          className={inputCls}
                        />
                      </Field>
                      <Field label="Bedrijfsgrootte" required>
                        <select
                          required
                          name="bedrijfsgrootte"
                          defaultValue=""
                          className={inputCls}
                        >
                          <option value="" disabled>
                            Aantal medewerkers
                          </option>
                          {companySizes.map((s) => (
                            <option key={s} value={s}>
                              {s} medewerkers
                            </option>
                          ))}
                        </select>
                      </Field>
                    </div>
                    {adres && (
                      <Field label="Adres (automatisch ingevuld)">
                        <input
                          name="adres"
                          type="text"
                          readOnly
                          value={adres}
                          className={`${inputCls} text-zinc-400`}
                        />
                      </Field>
                    )}
                  </>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label={isBedrijf ? "Zakelijk e-mailadres" : "E-mailadres"}
                    required
                  >
                    <input
                      required
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder={isBedrijf ? "jij@bedrijf.be" : "jan@email.be"}
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Telefoon">
                    <input
                      name="telefoon"
                      type="tel"
                      autoComplete="tel"
                      placeholder="+32 470 12 34 56"
                      className={inputCls}
                    />
                  </Field>
                </div>

                <Field label="Hoe heb je ons gevonden?">
                  <input
                    name="bron"
                    type="text"
                    placeholder="Bijv. aanbeveling, Google of vakbeurs"
                    className={inputCls}
                  />
                </Field>

                <Field label="Waarmee kunnen we je helpen?" required>
                  <textarea
                    required
                    name="bericht"
                    rows={4}
                    placeholder="Beschrijf kort je situatie, teamgrootte of wat je wilt verbeteren in je administratie."
                    className={`${inputCls} min-h-[108px] resize-y`}
                  />
                </Field>

                <button
                  type="submit"
                  disabled={submitting}
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 px-5 py-3.5 text-sm font-semibold text-zinc-950 transition-all hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Versturen…
                    </>
                  ) : (
                    <>
                      Verstuur bericht
                      <ArrowRight
                        size={16}
                        className="transition-transform group-hover:translate-x-0.5"
                      />
                    </>
                  )}
                </button>

                <p className="text-center text-[11px] leading-relaxed text-zinc-600">
                  Door te versturen ga je akkoord met ons privacybeleid. We
                  gebruiken je gegevens enkel om contact op te nemen.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>

      <ContactList
        contacts={contacts}
        onRemove={removeContact}
        onSelect={setSelected}
      />

      {selected && (
        <ContactDetail
          contact={selected}
          onClose={() => setSelected(null)}
          onRemove={(id) => {
            removeContact(id);
            setSelected(null);
          }}
        />
      )}
    </div>
  );
}

function SuccessState({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex min-h-[480px] flex-col items-center justify-center px-4 py-12 text-center">
      <span className="grid h-16 w-16 place-items-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
        <CheckCircle2 size={30} />
      </span>
      <h2 className="mt-5 text-xl font-semibold text-zinc-50">
        Bericht verstuurd
      </h2>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-zinc-400">
        Bedankt voor je vertrouwen. Een van onze specialisten neemt dezelfde
        werkdag contact met je op.
      </p>
      <div className="mt-6 rounded-xl border border-white/[0.06] bg-zinc-950/50 px-4 py-3 text-left">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
          Wat gebeurt er nu?
        </p>
        <ul className="mt-2 space-y-1.5 text-xs text-zinc-500">
          <li>1. We bekijken je aanvraag</li>
          <li>2. We plannen een kort kennismakingsgesprek</li>
          <li>3. Je ontvangt een voorstel op maat</li>
        </ul>
      </div>
      <button
        type="button"
        onClick={onReset}
        className="mt-8 rounded-full border border-white/[0.1] px-5 py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:border-white/20 hover:bg-white/[0.04]"
      >
        Nog een bericht versturen
      </button>
    </div>
  );
}

function ContactList({
  contacts,
  onRemove,
  onSelect,
}: {
  contacts: Contact[];
  onRemove: (id: string) => void;
  onSelect: (c: Contact) => void;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-zinc-900/60">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-100">
            Ontvangen aanvragen
          </h2>
          <p className="mt-0.5 text-xs text-zinc-500">
            Contacten via dit formulier
          </p>
        </div>
        <span className="rounded-full border border-sky-500/20 bg-sky-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-sky-300">
          {contacts.length}
        </span>
      </div>

      {contacts.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-2xl border border-white/[0.06] bg-zinc-950/60 text-zinc-500">
            <Users size={20} />
          </span>
          <p className="mt-4 text-sm font-medium text-zinc-300">
            Nog geen aanvragen
          </p>
          <p className="mt-1 max-w-xs text-xs leading-relaxed text-zinc-600">
            Zodra iemand het formulier invult, verschijnt de aanvraag hier.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-white/[0.04]">
          {contacts.map((c) => {
            const naam = `${c.voornaam} ${c.achternaam}`.trim() || "Onbekend";
            const initialen =
              (c.voornaam[0] ?? "") + (c.achternaam[0] ?? "") || "?";
            const waLink = c.telefoon
              ? `https://wa.me/${waNumber(c.telefoon)}`
              : null;
            const mailLink = c.email ? `mailto:${c.email}` : null;
            const telLink = c.telefoon
              ? `tel:${c.telefoon.replace(/\s/g, "")}`
              : null;
            const datum = new Date(c.createdAt).toLocaleDateString("nl-BE", {
              day: "numeric",
              month: "short",
            });

            return (
              <li
                key={c.id}
                className="group flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-white/[0.02] sm:px-5"
              >
                <button
                  type="button"
                  onClick={() => onSelect(c)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-sky-500/15 bg-sky-500/10 text-xs font-semibold uppercase text-sky-300">
                    {initialen}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-medium text-zinc-100">
                        {naam}
                      </p>
                      <TypeBadge type={c.type} />
                      <span className="text-[10px] text-zinc-600">{datum}</span>
                    </div>
                    <p className="truncate text-xs text-zinc-500">
                      {[c.bedrijfsnaam, c.email, c.bericht]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                </button>
                <div className="flex shrink-0 items-center gap-0.5 opacity-80 transition-opacity group-hover:opacity-100">
                  <RowIcon
                    href={waLink}
                    label={`WhatsApp ${naam}`}
                    icon={<MessageCircle size={15} />}
                    tone="text-emerald-400 hover:bg-emerald-500/15 hover:text-emerald-300"
                  />
                  <RowIcon
                    href={mailLink}
                    label={`Mail ${naam}`}
                    icon={<Mail size={15} />}
                    tone="text-sky-400 hover:bg-sky-500/15 hover:text-sky-300"
                  />
                  <RowIcon
                    href={telLink}
                    label={`Bel ${naam}`}
                    icon={<Phone size={15} />}
                    tone="text-sky-400 hover:bg-sky-500/15 hover:text-sky-300"
                  />
                  <button
                    type="button"
                    onClick={() => onRemove(c.id)}
                    aria-label={`Verwijder ${naam}`}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-zinc-600 transition-colors hover:bg-rose-500/10 hover:text-rose-400"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function TypeBadge({ type }: { type: ContactType }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
        type === "bedrijf"
          ? "bg-violet-500/15 text-violet-300"
          : "bg-emerald-500/15 text-emerald-300"
      }`}
    >
      {type === "bedrijf" ? (
        <Building2 size={10} />
      ) : (
        <User size={10} />
      )}
      {type === "bedrijf" ? "Bedrijf" : "Particulier"}
    </span>
  );
}

function RowIcon({
  href,
  label,
  icon,
  tone,
}: {
  href: string | null;
  label: string;
  icon: React.ReactNode;
  tone: string;
}) {
  if (!href) {
    return (
      <span
        aria-hidden
        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-zinc-800"
      >
        {icon}
      </span>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      onClick={(e) => e.stopPropagation()}
      className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg transition-colors ${tone}`}
    >
      {icon}
    </a>
  );
}

function waNumber(raw: string) {
  let n = raw.replace(/[^\d+]/g, "");
  if (n.startsWith("+")) n = n.slice(1);
  else if (n.startsWith("00")) n = n.slice(2);
  else if (n.startsWith("0")) n = "32" + n.slice(1);
  return n;
}

function ContactDetail({
  contact: c,
  onClose,
  onRemove,
}: {
  contact: Contact;
  onClose: () => void;
  onRemove: (id: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const naam = `${c.voornaam} ${c.achternaam}`.trim() || "Onbekend";
  const initialen = (c.voornaam[0] ?? "") + (c.achternaam[0] ?? "") || "?";
  const datum = new Date(c.createdAt).toLocaleString("nl-BE", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const groet = `Hallo ${c.voornaam || ""}`.trim();
  const waLink = c.telefoon
    ? `https://wa.me/${waNumber(c.telefoon)}?text=${encodeURIComponent(groet + ",")}`
    : null;
  const mailLink = c.email
    ? `mailto:${c.email}?subject=${encodeURIComponent("Contact via ArchonPro")}&body=${encodeURIComponent(groet + ",\n\n")}`
    : null;
  const telLink = c.telefoon ? `tel:${c.telefoon.replace(/\s/g, "")}` : null;
  const smsLink = c.telefoon ? `sms:${c.telefoon.replace(/\s/g, "")}` : null;

  async function copyAll() {
    const text = [
      naam,
      c.type === "bedrijf" ? "Bedrijf" : "Particulier",
      c.bedrijfsnaam && `Bedrijf: ${c.bedrijfsnaam}`,
      c.btw && `BTW: ${c.btw}`,
      c.adres && `Adres: ${c.adres}`,
      c.email && `E-mail: ${c.email}`,
      c.telefoon && `Telefoon: ${c.telefoon}`,
      c.bericht && `Bericht: ${c.bericht}`,
    ]
      .filter(Boolean)
      .join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // klembord niet beschikbaar
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full overflow-y-auto rounded-t-3xl border border-white/[0.08] bg-zinc-950 shadow-2xl sm:max-w-lg sm:rounded-2xl"
      >
        <div className="flex items-start gap-3 border-b border-white/[0.06] p-5">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-sky-500/15 bg-sky-500/10 text-sm font-semibold uppercase text-sky-300">
            {initialen}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-zinc-50">{naam}</h2>
              <TypeBadge type={c.type} />
            </div>
            {c.bedrijfsnaam && (
              <p className="mt-0.5 text-sm text-zinc-400">{c.bedrijfsnaam}</p>
            )}
            {c.btw && (
              <p className="mt-0.5 text-xs text-zinc-500">BTW: {c.btw}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Sluiten"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-200"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-3 p-5">
          <DetailRow icon={<Mail size={15} />} label="E-mail" value={c.email} />
          <DetailRow
            icon={<Phone size={15} />}
            label="Telefoon"
            value={c.telefoon}
          />
          {c.type === "bedrijf" && (
            <>
              <DetailRow
                icon={<Building2 size={15} />}
                label="BTW-nummer"
                value={c.btw ?? ""}
              />
              <DetailRow
                icon={<Building2 size={15} />}
                label="KBO-nummer"
                value={c.ondernemingsnummer ?? ""}
              />
              <DetailRow
                icon={<MapPin size={15} />}
                label="Adres"
                value={c.adres ?? ""}
              />
              <DetailRow
                icon={<Building2 size={15} />}
                label="Bedrijfsgrootte"
                value={c.bedrijfsgrootte}
              />
            </>
          )}
          <DetailRow icon={<MapPin size={15} />} label="Bron" value={c.bron} />
          <DetailRow
            icon={<CalendarClock size={15} />}
            label="Toegevoegd"
            value={datum}
          />
          {c.bericht && (
            <div className="rounded-xl border border-white/[0.06] bg-zinc-900/60 p-4">
              <p className="mb-1.5 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
                <MessageSquare size={13} /> Bericht
              </p>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">
                {c.bericht}
              </p>
            </div>
          )}
        </div>

        <div className="border-t border-white/[0.06] p-5">
          <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
            Versturen via
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <SendAction
              href={waLink}
              icon={<MessageCircle size={16} />}
              label="WhatsApp"
              tone="text-emerald-300"
            />
            <SendAction
              href={mailLink}
              icon={<Mail size={16} />}
              label="E-mail"
              tone="text-sky-300"
            />
            <SendAction
              href={telLink}
              icon={<Phone size={16} />}
              label="Bellen"
              tone="text-sky-300"
            />
            <SendAction
              href={smsLink}
              icon={<MessageSquare size={16} />}
              label="Sms"
              tone="text-amber-300"
            />
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={copyAll}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-sm text-zinc-200 transition-colors hover:bg-white/[0.06]"
            >
              {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
              {copied ? "Gekopieerd" : "Kopieer gegevens"}
            </button>
            <button
              type="button"
              onClick={() => onRemove(c.id)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-300 transition-colors hover:bg-rose-500/20"
            >
              <Trash2 size={16} /> Verwijderen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-white/[0.06] bg-zinc-900/80 text-sky-400">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-zinc-600">
          {label}
        </p>
        <p className="truncate text-sm text-zinc-200">{value || "—"}</p>
      </div>
    </div>
  );
}

function SendAction({
  href,
  icon,
  label,
  tone,
}: {
  href: string | null;
  icon: React.ReactNode;
  label: string;
  tone: string;
}) {
  const base =
    "flex flex-col items-center justify-center gap-1.5 rounded-xl border px-2 py-3 text-xs font-medium transition-colors";
  if (!href) {
    return (
      <div
        className={`${base} cursor-not-allowed border-white/[0.04] bg-white/[0.02] text-zinc-700`}
        title="Geen gegeven beschikbaar"
      >
        <span className="opacity-40">{icon}</span>
        {label}
      </div>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${base} border-white/[0.08] bg-white/[0.03] ${tone} hover:bg-white/[0.06]`}
    >
      {icon}
      {label}
    </a>
  );
}

const inputCls =
  "w-full rounded-xl border border-white/[0.08] bg-zinc-950/70 px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition-[border-color,box-shadow] focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/15";

function SegmentButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
        active
          ? "bg-sky-500/15 text-sky-200 shadow-sm ring-1 ring-inset ring-sky-500/30"
          : "text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-300"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-zinc-400">
        {label}
        {required && <span className="text-sky-400"> *</span>}
      </span>
      {children}
    </label>
  );
}
