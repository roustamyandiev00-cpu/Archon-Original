"use client";

import { useRouter, useSearchParams } from "next/navigation";
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
  KeyRound,
  ImageIcon,
  Database,
  Plug,
} from "lucide-react";
import GlowCard from "@/components/dashboard/GlowCard";
import ApiKeysManager from "@/components/dashboard/instellingen/ApiKeysManager";
import ImportManager from "@/components/dashboard/instellingen/ImportManager";
import AppIntegrationsPanel from "@/components/dashboard/instellingen/AppIntegrationsPanel";
import SmtpSettingsPanel from "@/components/dashboard/instellingen/SmtpSettingsPanel";
import ReferralInvitePanel from "@/components/dashboard/instellingen/ReferralInvitePanel";
import type { SmtpSettingsView } from "@/app/dashboard/instellingen/smtp-actions";
import type { ApiKeyInfo } from "@/lib/apiResources";
import {
  updateSettings,
  uploadTemplate,
  uploadLogo,
  clearLogo,
} from "@/app/dashboard/instellingen/actions";
import { createAiTokenCheckoutSession } from "@/app/dashboard/instellingen/ai-credits-actions";
import { AI_TOKEN_PACKAGES } from "@/lib/ai/token-packages";
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
import { resolveTemplateId } from "@/components/dashboard/documenten/documentTemplate";
import { INTEGRATIES_SETTINGS_TAB } from "@/lib/integraties";
import {
  LANGUAGES,
  FONTS,
  type AppLanguage,
  type AppFont,
  readLanguage,
  readFont,
  persistLanguage,
  persistFont,
} from "@/lib/appearance/config";
import { useDashboardTheme } from "@/components/dashboard/DashboardThemeProvider";
import { Globe, Type, Moon, Sun } from "lucide-react";

const inputClass =
  "w-full rounded-xl border border-white/10 bg-zinc-900/70 px-3 py-1.5 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-500 focus:border-sky-500/60";
const labelClass = "mb-1 block text-sm font-medium text-zinc-200";
const hintClass = "mt-1 text-[11px] text-zinc-500";

type Section = "bedrijf" | "documenten" | "ai" | "import" | "api" | "integraties" | "weergave";

const sections: { id: Section; label: string; icon: React.ReactNode }[] = [
  { id: "bedrijf", label: "Bedrijfsgegevens", icon: <Building2 size={15} /> },
  {
    id: "documenten",
    label: "Offertes & facturen",
    icon: <FileText size={15} />,
  },
  { id: "integraties", label: "Integraties", icon: <Plug size={15} /> },
  { id: "import", label: "Data importeren", icon: <Database size={15} /> },
  { id: "ai", label: "AI-agent", icon: <Bot size={15} /> },
  { id: "api", label: "API", icon: <KeyRound size={15} /> },
  { id: "weergave", label: "Weergave", icon: <Globe size={15} /> },
];

function isSection(value: string | null): value is Section {
  return sections.some((section) => section.id === value);
}

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
    <div className="flex items-start gap-2 border-b border-white/10 pb-2">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-sky-500/10 text-sky-400">
        {icon}
      </span>
      <div>
        <h2 className="text-sm font-semibold text-zinc-100">{title}</h2>
        <p className="mt-0.5 text-xs text-zinc-500">{description}</p>
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
  // Bepaal welk ontwerp er écht gerenderd wordt (basis-presets vallen terug op
  // een ArchonPro-stijl) zodat de preview altijd klopt met de echte output.
  const renderId = resolveTemplateId(value);
  const renderMeta = archonTemplateMeta(renderId);
  const thumbHtml = uploaded ? null : archonTemplatePreviewHtml(renderId, soort);
  const mappedFromLegacy = !uploaded && !isArchonTemplate(value);

  function openFullPreview() {
    const html = archonTemplatePreviewHtml(renderId, "both");
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

      {thumbHtml && (
        <div className="mt-2 overflow-hidden rounded-xl border border-white/10 bg-zinc-900/60">
          <ArchonThumb
            html={thumbHtml}
            title={`Voorbeeld ${renderMeta?.label ?? value}`}
          />
          <div className="flex items-center justify-between gap-2 border-t border-white/10 px-3 py-2">
            <span className="min-w-0 truncate text-xs text-zinc-400">
              {mappedFromLegacy
                ? `Wordt weergegeven als “${renderMeta?.label}”`
                : renderMeta?.description}
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

function LogoField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewFailed, setPreviewFailed] = useState(false);

  // Afgeleide state: reset de previewfout zodra de waarde wijzigt, tijdens
  // render in plaats van in een effect (voorkomt cascading renders).
  const [prevValue, setPrevValue] = useState(value);
  if (prevValue !== value) {
    setPrevValue(value);
    setPreviewFailed(false);
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await uploadLogo(fd);
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
    if ("error" in res && res.error) {
      setError(res.error);
      return;
    }
    if ("url" in res && res.url) onChange(res.url);
  }

  async function handleRemove() {
    setError(null);
    setUploading(true);
    const res = await clearLogo();
    setUploading(false);
    if ("error" in res && res.error) {
      setError(res.error);
      return;
    }
    onChange("");
  }

  const showPreview = Boolean(value) && !previewFailed;

  return (
    <div className="w-full">
      <label className={labelClass}>Bedrijfslogo</label>
      <div className="flex items-start gap-3 mt-1.5">
        <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-zinc-900/70">
          {showPreview ? (
            // eslint-disable-next-line @next/next/no-img-element -- storage/externe URL zonder image-optimizer
            <img
              src={value}
              alt="Bedrijfslogo"
              className="h-full w-full max-h-full max-w-full object-contain p-1"
              onError={() => setPreviewFailed(true)}
            />
          ) : (
            <ImageIcon size={20} className="text-zinc-600" />
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
            onChange={handleFile}
            className="hidden"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-1 rounded-full border border-white/10 px-2.5 py-1 text-[11px] font-medium text-zinc-200 transition-colors hover:border-white/20 hover:bg-white/5 disabled:opacity-60"
            >
              {uploading ? (
                <>
                  <Loader2 size={11} className="animate-spin" /> Uploaden…
                </>
              ) : (
                <>
                  <Upload size={11} /> Logo uploaden
                </>
              )}
            </button>
            {value && (
              <button
                type="button"
                onClick={handleRemove}
                disabled={uploading}
                className="inline-flex items-center gap-1 rounded-full border border-white/10 px-2.5 py-1 text-[11px] font-medium text-zinc-400 transition-colors hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-300 disabled:opacity-60"
              >
                <X size={11} /> Verwijderen
              </button>
            )}
          </div>

          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Of plak logo-URL..."
            className="w-full rounded-lg border border-white/10 bg-zinc-900/70 px-2 py-1 text-xs text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-sky-500/60"
          />

          {previewFailed && value ? (
            <p className="mt-1 text-[10px] text-amber-300">
              Logo-URL laadt niet. Controleer de link of upload opnieuw.
            </p>
          ) : null}
          {error && <p className="mt-1 text-[10px] text-rose-400">{error}</p>}
        </div>
      </div>
    </div>
  );
}

export default function SettingsForm({
  initial,
  smtpInitial,
  apiKeys,
  referralCode,
  integrationConnections = {},
  slackPlatformReady = true,
  slackSetupIncomplete = false,
  verificatiestatus = "onbevestigd",
  betrouwbaarheidsscore = null,
}: {
  initial: SettingsInput;
  smtpInitial: SmtpSettingsView;
  apiKeys: ApiKeyInfo[];
  referralCode?: string | null;
  integrationConnections?: Record<
    string,
    { status: string; config: Record<string, unknown> }
  >;
  slackPlatformReady?: boolean;
  slackSetupIncomplete?: boolean;
  /** Read-only badge (§8.1) — geen bewerkingslogica in Fase 1. */
  verificatiestatus?: string;
  /** Alleen resultaat (§4.12) — formule blijft server-side. */
  betrouwbaarheidsscore?: number | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Section>("bedrijf");
  const [form, setForm] = useState<SettingsInput>(initial);
  const [pending, startTransition] = useTransition();
  const { theme, toggleTheme } = useDashboardTheme();

  // Weergave (taal + lettertype) — geladen uit localStorage
  const [selectedLanguage, setSelectedLanguageState] = useState<AppLanguage>(() => readLanguage());
  const [selectedFont, setSelectedFontState] = useState<AppFont>(() => readFont());
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Token packages — Stripe Checkout via createAiTokenCheckoutSession
  const TOKEN_PACKAGES = AI_TOKEN_PACKAGES;
  const [selectedPackage, setSelectedPackage] = useState<
    (typeof TOKEN_PACKAGES)[0] | null
  >(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutPending, setCheckoutPending] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const connectedParam = searchParams.get("connected");
  const integrationError = searchParams.get("error");

  // Afgeleide state uit de URL: het actieve tabblad volgt de queryparameters.
  // Tijdens render i.p.v. in een effect, zodat het juiste tabblad meteen bij de
  // eerste paint staat en er geen zichtbare sprong is.
  const requestedTab = searchParams.get("tab");
  const tabSourceKey = `${requestedTab}|${connectedParam}|${integrationError}`;
  const [prevTabSourceKey, setPrevTabSourceKey] = useState(tabSourceKey);
  if (prevTabSourceKey !== tabSourceKey) {
    setPrevTabSourceKey(tabSourceKey);
    if (isSection(requestedTab)) {
      setTab(requestedTab);
    } else if (connectedParam || integrationError) {
      setTab(INTEGRATIES_SETTINGS_TAB);
    }
  }

  function handleLanguageChange(lang: AppLanguage) {
    persistLanguage(lang);
    setSelectedLanguageState(lang);
  }

  function handleFontChange(font: AppFont) {
    // Dynamically load Google Font if needed
    if (typeof window !== "undefined") {
      const existing = document.querySelector(`link[data-archon-font]`);
      if (existing) existing.remove();
      const familyMap: Record<AppFont, string> = {
        inter: "Inter, var(--font-inter), sans-serif",
        geist: "Geist, sans-serif",
        manrope: "Manrope, sans-serif",
        "plus-jakarta": "'Plus Jakarta Sans', sans-serif",
        "dm-sans": "'DM Sans', sans-serif",
        "space-grotesk": "'Space Grotesk', sans-serif",
        outfit: "Outfit, sans-serif",
      };
      const googleFamilies: Partial<Record<AppFont, string>> = {
        geist: "Geist",
        manrope: "Manrope",
        "plus-jakarta": "Plus+Jakarta+Sans",
        "dm-sans": "DM+Sans",
        "space-grotesk": "Space+Grotesk",
        outfit: "Outfit",
      };
      const googleFamily = googleFamilies[font];
      if (googleFamily) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = `https://fonts.googleapis.com/css2?family=${googleFamily}:wght@300;400;500;600;700;800&display=swap`;
        link.setAttribute("data-archon-font", font);
        document.head.appendChild(link);
      }
      document.documentElement.style.setProperty("--font-app", familyMap[font] ?? "Inter, sans-serif");
    }
    persistFont(font);
    setSelectedFontState(font);
  }

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
  function setIncasso<K extends keyof SettingsInput["incasso"]>(
    key: K,
    value: SettingsInput["incasso"][K],
  ) {
    setForm((f) => ({ ...f, incasso: { ...f.incasso, [key]: value } }));
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
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {referralCode && <ReferralInvitePanel referralCode={referralCode} />}

      <p className="text-sm text-zinc-500">
        Kies een categorie — alle instellingen staan in de tabs hieronder.
      </p>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        {sections.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
              tab === t.id
                ? "bg-sky-500 text-zinc-950 shadow-sm"
                : "border border-white/10 text-zinc-300 hover:bg-white/5"
            }`}
          >
            {t.icon}
            <span className="truncate">{t.label}</span>
          </button>
        ))}
      </div>

      <GlowCard subtle innerClassName="p-3 sm:p-4">
        {tab === "bedrijf" && (
          <div className="space-y-4">
            <SectionHeader
              icon={<Building2 size={18} />}
              title="Bedrijfsgegevens"
              description="De basisgegevens van je bedrijf. Deze worden gebruikt op je documenten en door de AI-agent."
            />
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-zinc-900/40 px-3 py-1.5">
              <span className="text-xs font-medium text-zinc-500">
                Verificatiestatus
              </span>
              <span className="inline-flex items-center rounded-full bg-sky-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-sky-300">
                {verificatiestatus === "geverifieerd"
                  ? "Geverifieerd"
                  : verificatiestatus === "in_behandeling"
                    ? "In behandeling"
                    : verificatiestatus === "verlopen"
                      ? "Verlopen"
                      : "Onbevestigd"}
              </span>
              {typeof betrouwbaarheidsscore === "number" && (
                <>
                  <span className="text-zinc-700">·</span>
                  <span className="text-xs font-medium text-zinc-500">
                    Betrouwbaarheid
                  </span>
                  <span className="inline-flex items-center rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-amber-300">
                    {betrouwbaarheidsscore}/100
                  </span>
                </>
              )}
              <span className="text-[11px] text-zinc-600">
                Alleen ter informatie — nog geen actie vereist.
              </span>
            </div>
            <div className="grid gap-x-4 gap-y-3 grid-cols-1 md:grid-cols-3">
              <Field label="Bedrijfsnaam">
                <input
                  value={form.naam}
                  onChange={(e) => set("naam", e.target.value)}
                  placeholder="bijv. Bouwbedrijf Janssen"
                  className={inputClass}
                />
              </Field>
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
              <div className="md:col-span-2 sm:col-span-2">
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
              <Field label="IBAN" hint="Getoond op facturen voor betaling.">
                <input
                  value={form.iban}
                  onChange={(e) => set("iban", e.target.value)}
                  placeholder="BE00 0000 0000 0000"
                  className={inputClass}
                />
              </Field>
              <Field
                label="Peppol-identificatie"
                hint="KBO-nummer of BTW (9925:BE0xxx)."
              >
                <input
                  value={form.peppol_participant_id}
                  onChange={(e) => set("peppol_participant_id", e.target.value)}
                  placeholder="0208:0123456789"
                  className={inputClass}
                />
              </Field>
              <div className="md:col-span-1 sm:col-span-2">
                <LogoField
                  value={form.logo_url}
                  onChange={(v) => set("logo_url", v)}
                />
              </div>
            </div>
          </div>
        )}

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

        {tab === "ai" && (
          <div className="space-y-6">
            <SectionHeader
              icon={<Bot size={18} />}
              title="AI-agent instellingen"
              description="Bepaal hoe je AI-assistent werkt en wat die voor je mag doen."
            />

            {/* AI Token Saldo & Packages */}
            <div className="rounded-2xl border border-white/5 bg-zinc-950/40 p-5 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                    <Bot className="text-sky-400" size={16} />
                    AI Token Saldo
                  </h3>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    Tokens worden verbruikt wanneer de AI-agent offertes opstelt, facturen matcht of herinneringen stuurt.
                  </p>
                </div>
                <div className="bg-zinc-900 border border-white/5 px-4 py-2.5 rounded-xl text-right">
                  <span className="block text-2xl font-black text-zinc-50 tracking-tight">
                    {(form.ai.tokens ?? 15000).toLocaleString("nl-NL")}
                  </span>
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block mt-0.5">
                    Beschikbare tokens
                  </span>
                </div>
              </div>

              {/* Progress / Status Meter */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-zinc-400">
                  <span>Verbruiksstatus</span>
                  <span className={(form.ai.tokens ?? 15000) < 5000 ? "text-amber-400 font-semibold" : "text-sky-400 font-semibold"}>
                    {(form.ai.tokens ?? 15000) < 5000 ? "Saldo is laag — koop bij om onderbrekingen te voorkomen" : "Actief & Voldoende saldo"}
                  </span>
                </div>
                <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden border border-white/5">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      (form.ai.tokens ?? 15000) < 5000 ? "bg-amber-500" : "bg-sky-500"
                    }`}
                    style={{ width: `${Math.min(100, ((form.ai.tokens ?? 15000) / 100000) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Packages Grid */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Tokens bijladen
                </h4>
                <div className="grid gap-4 sm:grid-cols-3">
                  {TOKEN_PACKAGES.map((pkg) => (
                    <div 
                      key={pkg.id} 
                      className={`relative flex flex-col justify-between rounded-2xl p-4 border transition-all duration-300 ${
                        pkg.popular 
                          ? "border-sky-500/30 bg-sky-500/[0.03] shadow-lg shadow-sky-500/5" 
                          : "border-white/5 bg-zinc-900/40 hover:border-white/10"
                      }`}
                    >
                      {pkg.popular && (
                        <span className="absolute -top-2.5 left-4 bg-sky-500 text-zinc-950 font-extrabold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full shadow-md">
                          Aanbevolen
                        </span>
                      )}
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-zinc-400 block">{pkg.name}</span>
                        <span className="text-xl font-extrabold text-zinc-50 tracking-tight block">
                          {pkg.tokens.toLocaleString("nl-NL")} <span className="text-xs text-zinc-500 font-normal">tokens</span>
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-white/5">
                        <span className="text-sm font-black text-zinc-300">€ {pkg.price.toFixed(2)}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPackage(pkg);
                            setCheckoutError(null);
                            setCheckoutOpen(true);
                          }}
                          className={`rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
                            pkg.popular 
                              ? "bg-sky-500 text-zinc-950 hover:bg-sky-400 shadow-md" 
                              : "bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
                          }`}
                        >
                          Kopen
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Jouw agentnaam"
                hint="Persoonlijk per gebruiker — standaard Ela. Bedrijfsinstructies en AI-regels blijven gedeeld voor het hele team."
              >
                <input
                  value={form.ai.agentNaam}
                  onChange={(e) => setAi("agentNaam", e.target.value)}
                  placeholder="Ela"
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
              label="E-mailadres deurwaarder"
              hint="Voor de laatste incassostap: het volledige dossier wordt per e-mail doorgestuurd naar dit adres."
            >
              <input
                type="email"
                value={form.incasso.deurwaarderEmail}
                onChange={(e) => setIncasso("deurwaarderEmail", e.target.value)}
                placeholder="deurwaarder@kantoor.be"
                className={inputClass}
              />
            </Field>

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

        {tab === "integraties" && (
          <div className="space-y-6">
            {connectedParam && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                Koppeling met <b>{connectedParam}</b> is geautoriseerd en actief.
              </div>
            )}
            {integrationError && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                {integrationError}
              </div>
            )}
            {slackSetupIncomplete && (
              <div className="rounded-xl border border-sky-500/30 bg-sky-500/10 px-4 py-3 text-sm text-sky-200">
                <b>Slack-setup onvolledig.</b> Elke klant koppelt een eigen
                workspace en kanaal — rond de stappen bij Slack af om meldingen te
                ontvangen.
              </div>
            )}
            <SmtpSettingsPanel
              initial={smtpInitial}
              companyEmail={form.email}
              companyName={form.naam}
            />
            <AppIntegrationsPanel
              connections={integrationConnections}
              slackPlatformReady={slackPlatformReady}
            />
          </div>
        )}

        {tab === "api" && <ApiKeysManager initialKeys={apiKeys} />}

        {tab === "import" && (
          <div className="space-y-6">
            <SectionHeader
              icon={<Database size={18} />}
              title="Data importeren"
              description="Zet klanten, offertes, facturen en leads uit een andere CRM over naar ArchonPro."
            />
            <ImportManager />
          </div>
        )}

        {tab === "weergave" && (
          <div className="space-y-8">
            <SectionHeader
              icon={<Globe size={18} />}
              title="Weergave"
              description="Kies je voorkeurstaal, lettertype en thema. Instellingen worden lokaal opgeslagen."
            />

            {/* Thema */}
            <div className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
                {theme === "dark" ? <Moon size={15} className="text-sky-400" /> : <Sun size={15} className="text-amber-400" />}
                Thema
              </h3>
              <div className="grid grid-cols-2 gap-3 sm:max-w-xs">
                {(["dark", "light"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => theme !== t && toggleTheme()}
                    className={`flex flex-col items-center gap-2 rounded-2xl border p-4 transition-all ${
                      theme === t
                        ? "border-sky-500/50 bg-sky-500/10 text-sky-300"
                        : "border-white/10 text-zinc-400 hover:border-white/20 hover:bg-white/5"
                    }`}
                  >
                    {t === "dark" ? <Moon size={20} /> : <Sun size={20} />}
                    <span className="text-xs font-medium capitalize">
                      {t === "dark" ? "Donker" : "Licht"}
                    </span>
                    {theme === t && (
                      <span className="grid h-4 w-4 place-items-center rounded-full bg-sky-500 text-[9px] text-zinc-950 font-bold">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Taal */}
            <div className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
                <Globe size={15} className="text-sky-400" />
                Interfacetaal
              </h3>
              <p className="text-xs text-zinc-500">
                Kies in welke taal je ArchonPro wil gebruiken.
              </p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.id}
                    type="button"
                    onClick={() => handleLanguageChange(lang.id)}
                    className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                      selectedLanguage === lang.id
                        ? "border-sky-500/50 bg-sky-500/10 text-sky-200"
                        : "border-white/10 bg-white/[0.03] text-zinc-300 hover:border-white/20 hover:bg-white/[0.06]"
                    }`}
                  >
                    <span className="text-xl leading-none">{lang.flag}</span>
                    <span className="flex-1">
                      <span className="block font-medium">{lang.nativeName}</span>
                      <span className="block text-[11px] text-zinc-500">{lang.label}</span>
                    </span>
                    {selectedLanguage === lang.id && (
                      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-sky-500 text-zinc-950 text-[10px] font-bold">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Lettertype */}
            <div className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
                <Type size={15} className="text-sky-400" />
                Lettertype
              </h3>
              <p className="text-xs text-zinc-500">
                Pas het lettertype van de dashboard-interface aan.
              </p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {FONTS.map((font) => (
                  <button
                    key={font.id}
                    type="button"
                    onClick={() => handleFontChange(font.id)}
                    className={`flex flex-col items-start gap-1.5 rounded-2xl border p-4 text-left transition-all ${
                      selectedFont === font.id
                        ? "border-sky-500/50 bg-sky-500/[0.07] text-sky-200"
                        : "border-white/10 bg-white/[0.02] text-zinc-300 hover:border-white/20 hover:bg-white/[0.05]"
                    }`}
                    style={{ fontFamily: font.id === "inter" ? "Inter, sans-serif" : undefined }}
                  >
                    <div className="flex w-full items-center justify-between gap-2">
                      <span className="text-base font-semibold leading-none">{font.label}</span>
                      {selectedFont === font.id && (
                        <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-sky-500 text-zinc-950 text-[10px] font-bold">✓</span>
                      )}
                    </div>
                    <span className="text-xs text-zinc-500">{font.description}</span>
                    <span className="mt-1 text-[11px] text-zinc-600 font-mono">Aa Bb Cc 1 2 3</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </GlowCard>

      {tab !== "api" && tab !== "import" && tab !== "integraties" && tab !== "weergave" && (
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
      )}
      {/* Token package checkout — Stripe wanneer geconfigureerd */}
      {checkoutOpen && selectedPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-zinc-900 p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setCheckoutOpen(false)}
              className="absolute right-5 top-5 text-zinc-500 hover:text-zinc-300 transition-colors focus:outline-none"
            >
              <X size={18} />
            </button>

            <h3 className="text-lg font-bold text-zinc-50">
              {selectedPackage.name}
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              {selectedPackage.tokens.toLocaleString("nl-NL")} tokens voor €{" "}
              {selectedPackage.price.toFixed(2)}.
            </p>

            <div className="mt-5 space-y-4">
              <p className="text-xs text-zinc-400 leading-relaxed">
                Je wordt doorgestuurd naar Stripe Checkout. Tokens worden pas
                bijgeschreven na een geslaagde betaling.
              </p>
              {checkoutError && (
                <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-3 text-xs text-rose-200">
                  {checkoutError}
                </div>
              )}
              <button
                type="button"
                disabled={checkoutPending}
                onClick={async () => {
                  setCheckoutPending(true);
                  setCheckoutError(null);
                  const res = await createAiTokenCheckoutSession(
                    selectedPackage.id,
                  );
                  setCheckoutPending(false);
                  if ("error" in res) {
                    setCheckoutError(res.error);
                    return;
                  }
                  window.location.href = res.url;
                }}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-sky-500 py-2.5 text-xs font-bold text-zinc-950 hover:bg-sky-400 transition-colors disabled:opacity-60"
              >
                {checkoutPending ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Doorsturen…
                  </>
                ) : (
                  "Betaal met Stripe"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
