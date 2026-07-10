"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, Mail, Send } from "lucide-react";
import GlowCard from "@/components/dashboard/GlowCard";
import {
  saveSmtpSettings,
  testSmtpSettings,
  type SmtpSettingsInput,
  type SmtpSettingsView,
} from "@/app/dashboard/instellingen/smtp-actions";
import { GMAIL_SMTP } from "@/components/dashboard/email/smtp-constants";

const inputClass =
  "w-full rounded-xl border border-white/10 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-500 focus:border-sky-500/60";
const labelClass = "mb-1.5 block text-sm font-medium text-zinc-200";
const hintClass = "mt-1 text-xs text-zinc-500";

type Props = {
  initial: SmtpSettingsView;
  companyEmail: string;
  companyName: string;
};

export default function SmtpSettingsPanel({
  initial,
  companyEmail,
  companyName,
}: Props) {
  const [form, setForm] = useState<SmtpSettingsInput>({
    preset: initial.preset,
    smtp_host: initial.smtp_host,
    smtp_port: initial.smtp_port,
    smtp_user: initial.smtp_user,
    smtp_pass: "",
    from_email: initial.from_email || companyEmail,
    from_name: initial.from_name || companyName,
  });
  const [pending, startTransition] = useTransition();
  const [testing, startTest] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [testOk, setTestOk] = useState(false);

  function set<K extends keyof SmtpSettingsInput>(
    key: K,
    value: SmtpSettingsInput[K],
  ) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
    setTestOk(false);
  }

  function applyGmailPreset() {
    setForm((f) => ({
      ...f,
      preset: "gmail",
      smtp_host: GMAIL_SMTP.smtp_host,
      smtp_port: GMAIL_SMTP.smtp_port,
      smtp_user: f.smtp_user || f.from_email || companyEmail,
    }));
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await saveSmtpSettings(form);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setSaved(true);
      setForm((f) => ({ ...f, smtp_pass: "" }));
    });
  }

  function handleTest() {
    setError(null);
    setTestOk(false);
    startTest(async () => {
      const result = await testSmtpSettings(form, companyEmail || form.from_email);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setTestOk(true);
    });
  }

  return (
    <GlowCard className="p-5 sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sky-500/10 text-sky-400">
          <Mail size={18} />
        </span>
        <div>
          <h2 className="text-base font-semibold text-zinc-50">
            E-mail (SMTP / Gmail)
          </h2>
          <p className="mt-0.5 text-sm text-zinc-500">
            Automatisch versturen van incasso-mails en documenten via je eigen
            mailbox. Geen Resend nodig.
          </p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={applyGmailPreset}
          className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
            form.preset === "gmail"
              ? "bg-sky-500 text-zinc-950"
              : "border border-white/10 text-zinc-300 hover:bg-white/5"
          }`}
        >
          Gmail
        </button>
        <button
          type="button"
          onClick={() => set("preset", "custom")}
          className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
            form.preset === "custom"
              ? "bg-sky-500 text-zinc-950"
              : "border border-white/10 text-zinc-300 hover:bg-white/5"
          }`}
        >
          Eigen SMTP
        </button>
      </div>

      {form.preset === "gmail" && (
        <div className="mb-4 rounded-xl border border-sky-500/20 bg-sky-500/[0.06] px-4 py-3 text-xs text-zinc-400">
          Gebruik een{" "}
          <span className="font-medium text-zinc-200">Google app-wachtwoord</span>{" "}
          (niet je normale wachtwoord). Activeer 2FA in Google en maak een
          app-wachtwoord aan onder Beveiliging → App-wachtwoorden.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Afzender naam</label>
          <input
            type="text"
            value={form.from_name}
            onChange={(e) => set("from_name", e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Afzender e-mail</label>
          <input
            type="email"
            value={form.from_email}
            onChange={(e) => set("from_email", e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>
            {form.preset === "gmail" ? "Gmail-adres" : "SMTP-gebruiker"}
          </label>
          <input
            type="email"
            value={form.smtp_user}
            onChange={(e) => set("smtp_user", e.target.value)}
            placeholder="jij@gmail.com"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>
            {form.preset === "gmail" ? "App-wachtwoord" : "SMTP-wachtwoord"}
          </label>
          <input
            type="password"
            value={form.smtp_pass}
            onChange={(e) => set("smtp_pass", e.target.value)}
            placeholder={
              initial.hasPassword && !form.smtp_pass
                ? "•••••••• (opgeslagen)"
                : form.preset === "gmail"
                  ? "16 tekens app-wachtwoord"
                  : "Wachtwoord"
            }
            className={inputClass}
          />
          {initial.hasPassword && !form.smtp_pass && (
            <p className={hintClass}>Laat leeg om het opgeslagen wachtwoord te behouden.</p>
          )}
        </div>

        {form.preset === "custom" && (
          <>
            <div>
              <label className={labelClass}>SMTP-host</label>
              <input
                type="text"
                value={form.smtp_host}
                onChange={(e) => set("smtp_host", e.target.value)}
                placeholder="mail.jouwdomein.be"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>SMTP-poort</label>
              <input
                type="number"
                value={form.smtp_port}
                onChange={(e) => set("smtp_port", Number(e.target.value) || 587)}
                className={inputClass}
              />
              <p className={hintClass}>Meestal 587 (STARTTLS) of 465 (SSL).</p>
            </div>
          </>
        )}
      </div>

      {error && (
        <p className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-300">
          {error}
        </p>
      )}
      {saved && !error && (
        <p className="mt-4 inline-flex items-center gap-1.5 text-sm text-emerald-400">
          <Check size={15} /> SMTP-instellingen opgeslagen
        </p>
      )}
      {testOk && !error && (
        <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-emerald-400">
          <Check size={15} /> Testmail verstuurd naar {companyEmail || form.from_email}
        </p>
      )}

      <div className="mt-5 flex flex-wrap justify-end gap-3">
        <button
          type="button"
          onClick={handleTest}
          disabled={pending || testing}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-2.5 text-sm font-semibold text-zinc-200 transition-colors hover:bg-white/5 disabled:opacity-60"
        >
          {testing ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Send size={15} />
          )}
          Testmail versturen
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={pending || testing}
          className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-sky-400 disabled:opacity-60"
        >
          {pending && <Loader2 size={15} className="animate-spin" />}
          Opslaan
        </button>
      </div>
    </GlowCard>
  );
}
