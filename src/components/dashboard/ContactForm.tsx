"use client";

import { useEffect, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CalendarClock,
  CheckCircle2,
  Clock,
  Copy,
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
  bron: string;
  bericht: string;
  createdAt: string;
};

const STORAGE_KEY = "archon.contacten";

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
  const [type, setType] = useState<ContactType>("bedrijf");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selected, setSelected] = useState<Contact | null>(null);
  const isBedrijf = type === "bedrijf";

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setContacts(JSON.parse(raw) as Contact[]);
      } else {
        // Demovoorbeeld zolang er nog niets is toegevoegd (niet opgeslagen).
        setContacts(DEMO_CONTACTS);
      }
    } catch {
      setContacts(DEMO_CONTACTS);
    }
  }, []);

  function persist(next: Contact[]) {
    setContacts(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // opslag niet beschikbaar
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
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
      bedrijfsnaam: get("bedrijfsnaam"),
      bedrijfsgrootte: get("bedrijfsgrootte"),
      bron: get("bron"),
      bericht: get("bericht"),
      createdAt: new Date().toISOString(),
    };

    persist([contact, ...contacts]);
    setSent(true);
  }

  function removeContact(id: string) {
    persist(contacts.filter((c) => c.id !== id));
  }

  return (
    <div className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-x-10 -bottom-16 top-10 -z-10 blur-3xl"
      >
        <div className="mx-auto h-full max-w-4xl bg-[radial-gradient(60%_60%_at_50%_100%,rgba(14,165,233,0.35),transparent),radial-gradient(50%_50%_at_20%_20%,rgba(6,182,212,0.25),transparent),radial-gradient(50%_50%_at_80%_30%,rgba(144,137,252,0.25),transparent)]" />
      </div>

      <div className="overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/70 shadow-[0_30px_80px_-40px_rgba(14,165,233,0.5)] backdrop-blur">
        <div className="grid gap-8 p-6 sm:p-10 lg:grid-cols-2 lg:gap-14">
          <div className="flex flex-col">
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">
              Ontdek de perfecte fit met{" "}
              <span className="bg-gradient-to-r from-sky-400 to-cyan-400 bg-clip-text text-transparent">
                ArchonPro
              </span>
            </h1>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-zinc-400">
              Vertel ons kort iets over je onderneming en we nemen snel contact
              met je op.
            </p>

            <ul className="mt-8 space-y-4">
              {perks.map((p) => (
                <li key={p.title} className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-sky-500/10 text-sky-400">
                    <p.icon size={16} />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-zinc-100">
                      {p.title}
                    </p>
                    <p className="text-sm text-zinc-500">{p.text}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-auto pt-10">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
                Of bereik ons direct
              </p>
              <div className="mt-3 space-y-2.5">
                <a
                  href="mailto:hallo@archonpro.be"
                  className="flex items-center gap-3 text-sm text-zinc-300 transition-colors hover:text-sky-300"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/5 text-sky-400">
                    <Mail size={15} />
                  </span>
                  hallo@archonpro.be
                </a>
                <a
                  href="tel:+3231234567"
                  className="flex items-center gap-3 text-sm text-zinc-300 transition-colors hover:text-sky-300"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/5 text-sky-400">
                    <Phone size={15} />
                  </span>
                  +32 3 123 45 67
                </a>
                <div className="flex items-center gap-3 text-sm text-zinc-400">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/5 text-sky-400">
                    <Clock size={15} />
                  </span>
                  Gemiddelde reactietijd: binnen 4 uur
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-5 sm:p-7">
            {sent ? (
              <div className="flex h-full min-h-[420px] flex-col items-center justify-center text-center">
                <span className="grid h-14 w-14 place-items-center rounded-full bg-emerald-500/12 text-emerald-400">
                  <CheckCircle2 size={26} />
                </span>
                <h2 className="mt-4 text-lg font-semibold text-zinc-50">
                  Bericht verstuurd
                </h2>
                <p className="mt-1.5 max-w-xs text-sm text-zinc-400">
                  Bedankt! We hebben je bericht ontvangen en nemen snel contact
                  met je op.
                </p>
                <button
                  onClick={() => setSent(false)}
                  className="mt-6 rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-200 transition-colors hover:bg-white/5"
                >
                  Nog een bericht versturen
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <span className="mb-1.5 block text-xs font-medium text-zinc-400">
                    Ik ben een <span className="text-sky-400">*</span>
                  </span>
                  <div className="grid grid-cols-2 gap-1.5 rounded-xl border border-white/10 bg-zinc-950/60 p-1">
                    <SegmentButton
                      active={type === "particulier"}
                      onClick={() => setType("particulier")}
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
                      placeholder="Sarah"
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Achternaam" required>
                    <input
                      required
                      name="achternaam"
                      type="text"
                      placeholder="Thompson"
                      className={inputCls}
                    />
                  </Field>
                </div>

                {isBedrijf && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Bedrijfsnaam" required>
                      <input
                        required
                        name="bedrijfsnaam"
                        type="text"
                        placeholder="Bedrijf NV"
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
                          Selecteer
                        </option>
                        {companySizes.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>
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
                      placeholder={isBedrijf ? "jij@bedrijf.be" : "jij@email.be"}
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Telefoon">
                    <input
                      name="telefoon"
                      type="tel"
                      placeholder="+32 ..."
                      className={inputCls}
                    />
                  </Field>
                </div>

                <Field label="Hoe heb je ons gevonden?">
                  <input
                    name="bron"
                    type="text"
                    placeholder="Bijv. via een aanbeveling of Google"
                    className={inputCls}
                  />
                </Field>

                <Field label="Waarmee kunnen we je helpen?" required>
                  <textarea
                    required
                    name="bericht"
                    rows={4}
                    placeholder="Vertel ons kort waar je mee zit of wat je zoekt."
                    className={`${inputCls} resize-none`}
                  />
                </Field>

                <button
                  type="submit"
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 px-5 py-3 text-sm font-semibold text-zinc-950 transition-all hover:shadow-[0_8px_30px_-8px_rgba(14,165,233,0.6)]"
                >
                  Verstuur bericht
                  <ArrowRight
                    size={16}
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </button>
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
    <section className="mt-8 rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-5">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
          Toegevoegde contacten
        </h2>
        <span className="rounded-full bg-sky-500/12 px-2 py-0.5 text-[11px] font-semibold text-sky-400">
          {contacts.length}
        </span>
      </div>

      {contacts.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/5 text-zinc-500">
            <Users size={18} />
          </span>
          <p className="mt-3 text-sm text-zinc-400">Nog geen contacten</p>
          <p className="mt-0.5 text-xs text-zinc-600">
            Verstuur het formulier hierboven om je eerste contact toe te voegen.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-white/5">
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
            return (
              <li
                key={c.id}
                className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white/[0.03] sm:px-5"
              >
                <button
                  type="button"
                  onClick={() => onSelect(c)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-sky-500/12 text-xs font-semibold uppercase text-sky-300">
                    {initialen}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-zinc-100">
                        {naam}
                      </p>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                          c.type === "bedrijf"
                            ? "bg-indigo-500/15 text-indigo-300"
                            : "bg-emerald-500/15 text-emerald-300"
                        }`}
                      >
                        {c.type === "bedrijf" ? (
                          <Building2 size={10} />
                        ) : (
                          <User size={10} />
                        )}
                        {c.type === "bedrijf" ? "Bedrijf" : "Particulier"}
                      </span>
                    </div>
                    <p className="truncate text-xs text-zinc-500">
                      {[c.email, c.telefoon, c.bedrijfsnaam]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                </button>
                <div className="flex shrink-0 items-center gap-0.5">
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
                    tone="text-indigo-400 hover:bg-indigo-500/15 hover:text-indigo-300"
                  />
                  <button
                    type="button"
                    onClick={() => onRemove(c.id)}
                    aria-label={`Verwijder ${naam}`}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-zinc-500 transition-colors hover:bg-rose-500/10 hover:text-rose-400"
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
        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-zinc-700"
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
  else if (n.startsWith("0")) n = "32" + n.slice(1); // Belgisch nummer
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
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full overflow-y-auto rounded-t-3xl border border-white/10 bg-zinc-950 shadow-2xl sm:max-w-lg sm:rounded-2xl"
      >
        <div className="flex items-start gap-3 border-b border-white/10 p-5">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-sky-500/12 text-sm font-semibold uppercase text-sky-300">
            {initialen}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-zinc-50">{naam}</h2>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                  c.type === "bedrijf"
                    ? "bg-indigo-500/15 text-indigo-300"
                    : "bg-emerald-500/15 text-emerald-300"
                }`}
              >
                {c.type === "bedrijf" ? (
                  <Building2 size={10} />
                ) : (
                  <User size={10} />
                )}
                {c.type === "bedrijf" ? "Bedrijf" : "Particulier"}
              </span>
            </div>
            {c.bedrijfsnaam && (
              <p className="mt-0.5 text-sm text-zinc-400">{c.bedrijfsnaam}</p>
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
            <DetailRow
              icon={<Building2 size={15} />}
              label="Bedrijfsgrootte"
              value={c.bedrijfsgrootte}
            />
          )}
          <DetailRow
            icon={<MapPin size={15} />}
            label="Bron"
            value={c.bron}
          />
          <DetailRow
            icon={<CalendarClock size={15} />}
            label="Toegevoegd"
            value={datum}
          />
          {c.bericht && (
            <div className="rounded-xl border border-white/10 bg-zinc-900/60 p-3">
              <p className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                <MessageSquare size={13} /> Bericht
              </p>
              <p className="whitespace-pre-wrap text-sm text-zinc-300">
                {c.bericht}
              </p>
            </div>
          )}
        </div>

        <div className="border-t border-white/10 p-5">
          <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
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
              tone="text-indigo-300"
            />
            <SendAction
              href={smsLink}
              icon={<MessageSquare size={16} />}
              label="Sms"
              tone="text-amber-300"
            />
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={copyAll}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-zinc-200 transition-colors hover:bg-white/10"
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
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/5 text-sky-400">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-zinc-500">
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
        className={`${base} cursor-not-allowed border-white/5 bg-white/[0.02] text-zinc-600`}
        title="Geen gegeven beschikbaar"
      >
        <span className="opacity-50">{icon}</span>
        {label}
      </div>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${base} border-white/10 bg-white/5 ${tone} hover:bg-white/10`}
    >
      {icon}
      {label}
    </a>
  );
}

const inputCls =
  "w-full rounded-lg border border-white/10 bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition-colors focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/20";

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
      className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? "bg-sky-500/15 text-sky-300 ring-1 ring-inset ring-sky-500/40"
          : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
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
