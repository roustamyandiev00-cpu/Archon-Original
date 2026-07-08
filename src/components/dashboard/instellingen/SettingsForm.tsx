"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  Building2,
  FileText,
  Bot,
  Loader2,
  Check,
  Lightbulb,
  ShieldCheck,
  Send,
  Bell,
  Upload,
  FileUp,
  X,
  ExternalLink,
} from "lucide-react";
import GlowCard from "@/components/dashboard/GlowCard";
import {
  updateSettings,
  uploadTemplate,
} from "@/app/dashboard/instellingen/actions";
import {
  TEMPLATE_PRESETS,
  isUploadedTemplate,
  templateFileName,
  type SettingsInput,
  type AiToon,
  type AiToestemming,
} from "@/app/dashboard/instellingen/settings";
import {
  isArchonTemplate,
  archonTemplateMeta,
  archonTemplatePreviewHtml,
} from "@/components/dashboard/instellingen/templatePreview";

const inputClass =
  "w-full rounded-xl border border-white/10 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-500 focus:border-sky-500/60";
const labelClass = "mb-1.5 block text-sm font-medium text-zinc-200";
const hintClass = "mt-1 text-xs text-zinc-500";

type Tab = "bedrijf" | "documenten" | "ai";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      {children}
      {hint && <p className={hintClass}>{hint}</p>}
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-white/10 pb-4">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sky-500/10 text-sky-400">
        {icon}
      </span>
      <div>
        <h2 className="text-base font-semibold text-zinc-100">{title}</h2>
        <p className="mt-0.5 text-sm text-zinc-500">{description}</p>
      </div>
    </div>
  );
}

const A4_W = 794;
const A4_H = 1123;

/** Schaalt een A4-voorbeeld responsief in de beschikbare kolombreedte. */
function ArchonThumb({ html, title }: { html: string; title: string }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.4);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const update = () => setScale(el.clientWidth / A4_W);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={boxRef}
      className="relative w-full overflow-hidden bg-white"
      style={{ height: A4_H * scale }}
    >
      <iframe
        title={title}
        srcDoc={html}
        tabIndex={-1}
        scrolling="no"
        className="pointer-events-none absolute left-0 top-0 origin-top-left border-0"
        style={{ width: A4_W, height: A4_H, transform: `scale(${scale})` }}
      />
    </div>
  );
}

function TemplatePicker({
  label,
  soort,
  value,
  onChange,
}: {
  label: string;
  soort: "quote" | "invoice";
  value: string;
  onChange: (value: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const uploaded = isUploadedTemplate(value);
  const archon = isArchonTemplate(value);
  const archonMeta = archonTemplateMeta(value);
  const thumbHtml = archon ? archonTemplatePreviewHtml(value, soort) : null;

  function openFullPreview() {
    const html = archonTemplatePreviewHtml(value, "both");
    if (!html) return;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
    // Geef de browser tijd om te laden voordat we de URL vrijgeven.
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    const fd = new FormData();
    fd.append("soort", soort);
    fd.append("file", file);
    const res = await uploadTemplate(fd);
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
    if ("error" in res && res.error) {
      setError(res.error);
      return;
    }
    if ("value" in res && res.value) onChange(res.value);
  }

  return (
    <div>
      <label className={labelClass}>{label}</label>
      <select
        value={uploaded ? "__upload__" : value}
        onChange={(e) => {
          if (e.target.value !== "__upload__") onChange(e.target.value);
        }}
        className={inputClass}
      >
        {TEMPLATE_PRESETS.map((p) => (
          <option key={p.id} value={p.id}>
            {p.label}
          </option>
        ))}
        {uploaded && <option value="__upload__">Eigen sjabloon</option>}
      </select>

      {uploaded && (
        <div className="mt-2 flex items-center justify-between gap-2 rounded-lg border border-sky-500/25 bg-sky-500/[0.06] px-3 py-2 text-xs">
          <span className="flex min-w-0 items-center gap-1.5 text-sky-300">
            <FileText size={13} className="shrink-0" />
            <span className="truncate">{templateFileName(value)}</span>
          </span>
          <button
            type="button"
            onClick={() => onChange("modern")}
            title="Eigen sjabloon verwijderen"
            className="grid h-6 w-6 shrink-0 place-items-center rounded text-zinc-400 transition-colors hover:bg-white/10 hover:text-rose-400"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {archon && thumbHtml && (
        <div className="mt-2 overflow-hidden rounded-xl border border-white/10 bg-zinc-900/60">
          <ArchonThumb
            html={thumbHtml}
            title={`Voorbeeld ${archonMeta?.label ?? value}`}
          />
          <div className="flex items-center justify-between gap-2 border-t border-white/10 px-3 py-2">
            <span className="min-w-0 truncate text-xs text-zinc-400">
              {archonMeta?.description}
            </span>
            <button
              type="button"
              onClick={openFullPreview}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 px-2.5 py-1 text-[11px] font-medium text-sky-300 transition-colors hover:border-sky-500/40 hover:bg-sky-500/10"
            >
              <ExternalLink size={12} /> Op ware grootte
            </button>
          </div>
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept=".pdf,.doc,.docx,image/*"
        onChange={handleFile}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-zinc-200 transition-colors hover:border-white/20 hover:bg-white/5 disabled:opacity-60"
      >
        {uploading ? (
          <>
            <Loader2 size={13} className="animate-spin" /> Uploaden…
          </>
        ) : (
          <>
            <Upload size={13} /> Eigen sjabloon uploaden
          </>
        )}
      </button>

      {error && <p className="mt-1.5 text-xs text-rose-400">{error}</p>}
    </div>
  );
}

export default function SettingsForm({ initial }: { initial: SettingsInput }) {
  const [tab, setTab] = useState<Tab>("bedrijf");
  const [form, setForm] = useState<SettingsInput>(initial);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function set<K extends keyof SettingsInput>(key: K, value: SettingsInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }
  function setAi<K extends keyof SettingsInput["ai"]>(
    key: K,
    value: SettingsInput["ai"][K],
  ) {
    setForm((f) => ({ ...f, ai: { ...f.ai, [key]: value } }));
    setSaved(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const res = await updateSettings(form);
      if (res && "error" in res && res.error) {
        setError(res.error);
        return;
      }
      setSaved(true);
    });
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "bedrijf", label: "Bedrijfsgegevens", icon: <Building2 size={15} /> },
    {
      id: "documenten",
      label: "Offertes & facturen",
      icon: <FileText size={15} />,
    },
    { id: "ai", label: "AI-agent", icon: <Bot size={15} /> },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.id
                ? "bg-sky-500 text-zinc-950"
                : "border border-white/10 text-zinc-300 hover:bg-white/5"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      <GlowCard innerClassName="p-5 sm:p-7">
        {/* VAK 1 — BEDRIJFSGEGEVENS */}
        {tab === "bedrijf" && (
          <div className="space-y-6">
            <SectionHeader
              icon={<Building2 size={18} />}
              title="Bedrijfsgegevens"
              description="De basisgegevens van je bedrijf. Deze worden gebruikt op je documenten en door de AI-agent."
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field label="Bedrijfsnaam">
                  <input
                    value={form.naam}
                    onChange={(e) => set("naam", e.target.value)}
                    placeholder="bijv. Bouwbedrijf Janssen"
                    className={inputClass}
                  />
                </Field>
              </div>
              <Field label="E-mail">
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="info@bedrijf.be"
                  className={inputClass}
                />
              </Field>
              <Field label="Telefoon">
                <input
                  value={form.telefoon}
                  onChange={(e) => set("telefoon", e.target.value)}
                  placeholder="+32 ..."
                  className={inputClass}
                />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Adres">
                  <input
                    value={form.adres}
                    onChange={(e) => set("adres", e.target.value)}
                    placeholder="Straat en huisnummer"
                    className={inputClass}
                  />
                </Field>
              </div>
              <Field label="Postcode">
                <input
                  value={form.postcode}
                  onChange={(e) => set("postcode", e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Stad">
                <input
                  value={form.stad}
                  onChange={(e) => set("stad", e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="KvK / ondernemingsnummer">
                <input
                  value={form.kvk}
                  onChange={(e) => set("kvk", e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="BTW-nummer">
                <input
                  value={form.btw}
                  onChange={(e) => set("btw", e.target.value)}
                  placeholder="BE0123.456.789"
                  className={inputClass}
                />
              </Field>
              <Field label="IBAN" hint="Wordt getoond op facturen voor betaling.">
                <input
                  value={form.iban}
                  onChange={(e) => set("iban", e.target.value)}
                  placeholder="BE00 0000 0000 0000"
                  className={inputClass}
                />
              </Field>
              <Field label="Logo-URL" hint="Link naar je logo (optioneel).">
                <input
                  value={form.logo_url}
                  onChange={(e) => set("logo_url", e.target.value)}
                  placeholder="https://..."
                  className={inputClass}
                />
              </Field>
            </div>
          </div>
        )}

        {/* VAK 2 — OFFERTES & FACTUREN */}
        {tab === "documenten" && (
          <div className="space-y-6">
            <SectionHeader
              icon={<FileText size={18} />}
              title="Gegevens op offertes & facturen"
              description="Standaardwaarden die automatisch worden ingevuld bij nieuwe offertes en facturen."
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Betaaltermijn (dagen)"
                hint="Aantal dagen dat een factuur geldig is."
              >
                <input
                  type="number"
                  min={0}
                  value={form.betaalterm}
                  onChange={(e) => set("betaalterm", Number(e.target.value))}
                  className={inputClass}
                />
              </Field>
              <Field
                label="Standaard BTW-tarief (%)"
                hint="Voorgevuld tarief op nieuwe offertelijnen."
              >
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={form.standaardBtw}
                  onChange={(e) => set("standaardBtw", Number(e.target.value))}
                  className={inputClass}
                />
              </Field>
            </div>
            <Field
              label="Algemene voorwaarden"
              hint="Verschijnt onderaan je offertes en facturen."
            >
              <textarea
                value={form.algemene_voorwaarden}
                onChange={(e) => set("algemene_voorwaarden", e.target.value)}
                rows={6}
                placeholder="Bijv. betalingsvoorwaarden, garantie, leveringstermijnen…"
                className={`${inputClass} resize-none`}
              />
            </Field>
            <Field
              label="Footer-/afsluittekst"
              hint="Korte afsluitende tekst, bijv. een bedankje of contactgegevens."
            >
              <textarea
                value={form.footer_tekst}
                onChange={(e) => set("footer_tekst", e.target.value)}
                rows={3}
                placeholder="Bedankt voor uw vertrouwen. Vragen? Bel ons gerust."
                className={`${inputClass} resize-none`}
              />
            </Field>

            {/* Sjablonen */}
            <div className="space-y-4 border-t border-white/10 pt-6">
              <div>
                <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
                  <FileUp size={15} className="text-sky-400" />
                  Sjablonen
                </h3>
                <p className="mt-0.5 text-xs text-zinc-500">
                  Kies een kant-en-klaar ArchonPro-ontwerp (met voorbeeld) of
                  upload je eigen sjabloon (PDF, Word of afbeelding, max. 10 MB).
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <TemplatePicker
                  label="Offerte-sjabloon"
                  soort="quote"
                  value={form.quoteTemplate}
                  onChange={(v) => set("quoteTemplate", v)}
                />
                <TemplatePicker
                  label="Factuur-sjabloon"
                  soort="invoice"
                  value={form.invoiceTemplate}
                  onChange={(v) => set("invoiceTemplate", v)}
                />
              </div>
            </div>
          </div>
        )}

        {/* VAK 3 — AI-AGENT */}
        {tab === "ai" && (
          <div className="space-y-6">
            <SectionHeader
              icon={<Bot size={18} />}
              title="AI-agent instellingen"
              description="Bepaal hoe je AI-assistent werkt en wat die voor je mag doen."
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Naam van de agent">
                <input
                  value={form.ai.agentNaam}
                  onChange={(e) => setAi("agentNaam", e.target.value)}
                  placeholder="Nova"
                  className={inputClass}
                />
              </Field>
              <Field
                label="Jouw vakgebied"
                hint="Helpt de AI om vakspecifieke offertes en teksten te maken."
              >
                <input
                  value={form.ai.vakgebied}
                  onChange={(e) => setAi("vakgebied", e.target.value)}
                  placeholder="bijv. loodgieter, elektricien, schrijnwerker"
                  className={inputClass}
                />
              </Field>
            </div>

            <Field label="Schrijfstijl / toon">
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    ["formeel", "Formeel"],
                    ["neutraal", "Neutraal"],
                    ["informeel", "Informeel"],
                  ] as [AiToon, string][]
                ).map(([val, lbl]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAi("toon", val)}
                    className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${
                      form.ai.toon === val
                        ? "border-sky-500/60 bg-sky-500/10 text-sky-300"
                        : "border-white/10 text-zinc-300 hover:bg-white/5"
                    }`}
                  >
                    {lbl}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Wat mag de agent doen?">
              <div className="grid gap-2 sm:grid-cols-2">
                {(
                  [
                    [
                      "voorstellen",
                      "Alleen voorstellen",
                      "Maakt concepten die jij goedkeurt.",
                      <ShieldCheck key="s" size={16} />,
                    ],
                    [
                      "versturen",
                      "Zelf versturen",
                      "Mag offertes en mails automatisch versturen.",
                      <Send key="v" size={16} />,
                    ],
                  ] as [AiToestemming, string, string, React.ReactNode][]
                ).map(([val, lbl, desc, icon]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAi("toestemming", val)}
                    className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                      form.ai.toestemming === val
                        ? "border-sky-500/60 bg-sky-500/10"
                        : "border-white/10 hover:bg-white/5"
                    }`}
                  >
                    <span
                      className={
                        form.ai.toestemming === val
                          ? "text-sky-400"
                          : "text-zinc-400"
                      }
                    >
                      {icon}
                    </span>
                    <span>
                      <span className="block text-sm font-medium text-zinc-100">
                        {lbl}
                      </span>
                      <span className="mt-0.5 block text-xs text-zinc-500">
                        {desc}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </Field>

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 px-4 py-3 transition-colors hover:bg-white/5">
              <input
                type="checkbox"
                checked={form.ai.betalingsherinneringen}
                onChange={(e) =>
                  setAi("betalingsherinneringen", e.target.checked)
                }
                className="mt-0.5 h-4 w-4 accent-sky-500"
              />
              <span>
                <span className="flex items-center gap-2 text-sm font-medium text-zinc-100">
                  <Bell size={15} className="text-sky-400" />
                  Automatische betalingsherinneringen
                </span>
                <span className="mt-0.5 block text-xs text-zinc-500">
                  De agent stelt herinneringen voor bij openstaande facturen.
                </span>
              </span>
            </label>

            <Field
              label="Instructies voor de agent"
              hint="Vertel de agent hoe die moet werken, wat wel/niet mag, en wat belangrijk is voor jouw bedrijf."
            >
              <textarea
                value={form.ai.instructies}
                onChange={(e) => setAi("instructies", e.target.value)}
                rows={6}
                placeholder="Bijv.: Reken altijd 21% BTW. Wees beleefd maar direct. Vermeld altijd de garantietermijn. Vraag bij twijfel eerst om bevestiging."
                className={`${inputClass} resize-none`}
              />
            </Field>

            <div className="flex items-start gap-3 rounded-xl border border-sky-500/20 bg-sky-500/[0.06] px-4 py-3">
              <Lightbulb size={16} className="mt-0.5 shrink-0 text-sky-400" />
              <p className="text-xs text-zinc-400">
                <span className="font-medium text-zinc-300">Tip:</span> hoe meer
                context je hier geeft (vakgebied, standaardprijzen, veelgestelde
                vragen), hoe scherper de AI jouw offertes en berichten opstelt.
              </p>
            </div>
          </div>
        )}
      </GlowCard>

      {/* Actiebalk */}
      <div className="flex items-center justify-end gap-3">
        {error && (
          <p className="mr-auto rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-300">
            {error}
          </p>
        )}
        {saved && !error && (
          <p className="mr-auto inline-flex items-center gap-1.5 text-sm text-emerald-400">
            <Check size={15} /> Opgeslagen
          </p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-6 py-2.5 text-sm font-medium text-zinc-950 transition-colors hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Opslaan…
            </>
          ) : (
            "Instellingen opslaan"
          )}
        </button>
      </div>
    </form>
  );
}
