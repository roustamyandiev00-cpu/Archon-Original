"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { redirectAfterAuth } from "@/lib/auth/redirect-after-auth";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Eye,
  EyeOff,
  Gift,
  Globe,
  Loader2,
  Lock,
  Mail,
  User,
  Volume2,
  VolumeX,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { REFERRAL_REWARDS } from "@/components/ReferralProgram";
import { useDutchSpeech } from "@/hooks/useDutchSpeech";
import VoiceInputButton from "@/components/speech/VoiceInputButton";
import NovaVoiceAsk from "@/components/speech/NovaVoiceAsk";
import { matchSpokenOption } from "@/lib/speech/matchOption";
import { finalizeNewAccount } from "@/app/register/actions";
import {
  getOnboardingProfile,
  saveOnboardingProfile,
} from "@/lib/onboarding/storage";
import { LANGUAGES, persistLanguage, type AppLanguage } from "@/lib/appearance/config";

const VAKGEBIEDEN = [
  "Algemene bouw",
  "Renovatie",
  "Dakwerken",
  "Elektriciteit",
  "Sanitair & verwarming",
  "Schilderwerken",
  "Andere",
];

const TEAM_SIZES = [
  { id: "solo", label: "Alleen ik" },
  { id: "klein", label: "2 – 5 mensen" },
  { id: "middel", label: "6 – 15 mensen" },
  { id: "groot", label: "16+ mensen" },
];

const UITDAGINGEN = [
  "Te veel tijd aan administratie",
  "Offertes duren te lang",
  "Facturen worden te laat betaald",
  "Geen overzicht op werven",
  "Alles zit verspreid in Excel/WhatsApp",
];

const DOELEN = [
  { id: "offertes", label: "Sneller offertes maken" },
  { id: "facturatie", label: "Facturatie op orde" },
  { id: "projecten", label: "Werven beter opvolgen" },
  { id: "overzicht", label: "Alles op één plek" },
];

const TOTAL_STEPS = 7;

const inputClass =
  "w-full rounded-xl border border-white/10 bg-zinc-900/60 py-2.5 pl-10 pr-4 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-500 focus:border-sky-500/60 focus:bg-zinc-900";

export default function RegisterOnboardingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/dashboard/command-center?tour=1";
  const refFromUrl = searchParams.get("ref")?.trim() ?? "";
  const prefillEmail = searchParams.get("email") ?? "";

  const { enabled: speechOn, speak, toggle: toggleSpeech } = useDutchSpeech();

  const [selectedLanguage, setSelectedLanguage] = useState<AppLanguage>("nl");

  function handleOptionVoice(
    spoken: string,
    options: string[],
    onMatch: (value: string) => void,
  ) {
    const match = matchSpokenOption(spoken, options);
    if (match) {
      onMatch(match);
      speak(`Oké, ${match}.`);
      return;
    }
    speak(
      `Ik hoorde "${spoken}". Kies één van de opties of probeer het opnieuw.`,
    );
  }

  const [step, setStep] = useState(1);
  const [vakgebied, setVakgebied] = useState(
    () => getOnboardingProfile().vakgebied ?? "",
  );
  const [teamSize, setTeamSize] = useState(
    () => getOnboardingProfile().teamSize ?? "",
  );
  const [uitdaging, setUitdaging] = useState(
    () => getOnboardingProfile().uitdaging ?? "",
  );
  const [doel, setDoel] = useState(() => {
    const profile = getOnboardingProfile();
    return profile.doel ?? profile.intent ?? "";
  });
  const [name, setName] = useState("");
  const [bedrijf, setBedrijf] = useState("");
  const [email, setEmail] = useState(prefillEmail);
  const [referralCode, setReferralCode] = useState(refFromUrl);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const prompts: Record<number, string> = {
      1: "Welke taal spreek je het liefst? Kies je voorkeurstaal.",
      2: "Laten we elkaar leren kennen. In welk vakgebied werk je?",
      3: "Hoe groot is je team?",
      4: "Wat is je grootste uitdaging op dit moment?",
      5: "Wat wil je vooral met ArchonPro bereiken?",
      6: "Hoe heet je en wat is je bedrijfsnaam?",
      7: "Bijna klaar. Vul je e-mail en wachtwoord in om je account aan te maken.",
    };
    const text = prompts[step];
    if (text) speak(text);
  }, [step, speak]);

  function persistProfile() {
    saveOnboardingProfile({ vakgebied, teamSize, uitdaging, doel });
  }

  function canAdvance(): boolean {
    switch (step) {
      case 1:
        return selectedLanguage.length > 0;
      case 2:
        return vakgebied.length > 0;
      case 3:
        return teamSize.length > 0;
      case 4:
        return uitdaging.length > 0;
      case 5:
        return doel.length > 0;
      case 6:
        return name.trim().length > 0 && bedrijf.trim().length > 0;
      case 7:
        return email.trim().length > 0 && password.length >= 6 && agreed;
      default:
        return false;
    }
  }

  function next() {
    if (step === 1) {
      persistLanguage(selectedLanguage);
    }
    persistProfile();
    if (step < TOTAL_STEPS) setStep((s) => s + 1);
  }

  function back() {
    if (step > 1) setStep((s) => s - 1);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canAdvance()) return;
    persistLanguage(selectedLanguage);
    setError(null);
    setNotice(null);
    setLoading(true);
    persistProfile();

    const onboarding = { vakgebied, teamSize, uitdaging, doel };
    const supabase = createClient();

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            company_name: bedrijf.trim(),
            onboarding,
            ...(referralCode.trim()
              ? { referred_by: referralCode.trim().toUpperCase() }
              : {}),
          },
          emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`,
        },
      });
      if (signUpError) throw signUpError;
      if (data.session) {
        if (data.user) {
          await supabase.rpc("ensure_user_referral", {
            p_user_id: data.user.id,
            p_full_name: name.trim() || undefined,
            p_referred_by: referralCode.trim().toUpperCase() || undefined,
          });
        }
        await finalizeNewAccount();
        redirectAfterAuth(redirectTo);
        return;
      } else {
        setNotice(
          "Account aangemaakt. Check je e-mail om je adres te bevestigen en log daarna in.",
        );
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Er ging iets mis. Probeer opnieuw.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleOAuth(provider: "google" | "apple") {
    persistProfile();
    setError(null);
    const supabase = createClient();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`,
      },
    });
    if (oauthError) setError(oauthError.message);
  }

  return (
    <div>
      {/* Ela coach header */}
      <div className="mb-5 flex items-start gap-3 rounded-2xl border border-sky-500/20 bg-sky-500/[0.06] p-4">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-sky-400 to-indigo-500 text-sm font-bold text-white">
          N
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-zinc-100">Ela helpt je opstarten</p>
            <button
              type="button"
              onClick={toggleSpeech}
              aria-label={speechOn ? "Spraak uitzetten" : "Spraak aanzetten"}
              className="shrink-0 text-zinc-500 transition-colors hover:text-zinc-300"
            >
              {speechOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-zinc-400">
            Stap {step} van {TOTAL_STEPS} — zo leer ik je bedrijf kennen en kan ik je beter helpen.
          </p>
          <div className="mt-2 flex gap-1">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => (
              <span
                key={i}
                className={`h-1 flex-1 rounded-full ${
                  i < step ? "bg-sky-500" : "bg-white/10"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <NovaVoiceAsk />

      {step === 7 && (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3">
            <SocialButton
              label="Google"
              icon={<GoogleIcon />}
              onClick={() => handleOAuth("google")}
            />
            <SocialButton
              label="Apple"
              icon={<AppleIcon />}
              onClick={() => handleOAuth("apple")}
            />
          </div>
          <div className="mb-4 flex items-center gap-3">
            <span className="h-px flex-1 bg-white/10" />
            <span className="text-xs text-zinc-500">Of met e-mail</span>
            <span className="h-px flex-1 bg-white/10" />
          </div>
        </>
      )}

      <form onSubmit={step === 7 ? handleSubmit : (e) => e.preventDefault()}>
        {step === 1 && (
          <div>
            <p className="mb-3 text-sm font-medium text-zinc-200">Kies je voorkeurstaal</p>
            <div className="grid gap-2">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.id}
                  type="button"
                  onClick={() => setSelectedLanguage(lang.id)}
                  className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                    selectedLanguage === lang.id
                      ? "border-sky-500/50 bg-sky-500/15 text-sky-200"
                      : "border-white/10 bg-white/[0.03] text-zinc-300 hover:border-white/20 hover:bg-white/[0.05]"
                  }`}
                >
                  <span className="text-xl leading-none">{lang.flag}</span>
                  <span className="flex-1 font-medium">{lang.nativeName}</span>
                  <span className="text-xs text-zinc-500">{lang.label}</span>
                  {selectedLanguage === lang.id && (
                    <span className="ml-auto grid h-5 w-5 shrink-0 place-items-center rounded-full bg-sky-500 text-zinc-950">
                      <Globe size={11} />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <OptionGrid
            label="In welk vakgebied werk je?"
            options={VAKGEBIEDEN}
            value={vakgebied}
            onChange={setVakgebied}
            onVoice={(text) =>
              handleOptionVoice(text, VAKGEBIEDEN, setVakgebied)
            }
          />
        )}

        {step === 3 && (
          <OptionGrid
            label="Hoe groot is je team?"
            options={TEAM_SIZES.map((t) => t.label)}
            value={TEAM_SIZES.find((t) => t.id === teamSize)?.label ?? ""}
            onChange={(label) => {
              const match = TEAM_SIZES.find((t) => t.label === label);
              if (match) setTeamSize(match.id);
            }}
            onVoice={(text) =>
              handleOptionVoice(
                text,
                TEAM_SIZES.map((t) => t.label),
                (label) => {
                  const match = TEAM_SIZES.find((t) => t.label === label);
                  if (match) setTeamSize(match.id);
                },
              )
            }
          />
        )}

        {step === 4 && (
          <OptionGrid
            label="Wat is je grootste uitdaging?"
            options={UITDAGINGEN}
            value={uitdaging}
            onChange={setUitdaging}
            onVoice={(text) =>
              handleOptionVoice(text, UITDAGINGEN, setUitdaging)
            }
          />
        )}

        {step === 5 && (
          <OptionGrid
            label="Wat wil je vooral bereiken?"
            options={DOELEN.map((d) => d.label)}
            value={DOELEN.find((d) => d.id === doel)?.label ?? ""}
            onChange={(label) => {
              const match = DOELEN.find((d) => d.label === label);
              if (match) setDoel(match.id);
            }}
            onVoice={(text) =>
              handleOptionVoice(
                text,
                DOELEN.map((d) => d.label),
                (label) => {
                  const match = DOELEN.find((d) => d.label === label);
                  if (match) setDoel(match.id);
                },
              )
            }
          />
        )}

        {step === 6 && (
          <div className="space-y-3">
            <Field label="Je naam">
              <InputIcon icon={<User size={16} />} />
              <input
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Je volledige naam"
                className={inputClass}
              />
            </Field>
            <Field label="Bedrijfsnaam">
              <InputIcon icon={<Building2 size={16} />} />
              <input
                type="text"
                autoComplete="organization"
                required
                value={bedrijf}
                onChange={(e) => setBedrijf(e.target.value)}
                placeholder="Je bedrijfsnaam"
                className={inputClass}
              />
            </Field>
            <VoiceInputButton
              size="sm"
              label="Of spreek je naam en bedrijfsnaam"
              onTranscript={(text) => {
                const parts = text.split(/\s+van\s+/i);
                if (parts.length >= 2) {
                  setName(parts[0].trim());
                  setBedrijf(parts.slice(1).join(" van ").trim());
                } else if (!name.trim()) {
                  setName(text.trim());
                } else {
                  setBedrijf(text.trim());
                }
                speak("Oké, ik vul dat in. Controleer even je gegevens.");
              }}
            />
          </div>
        )}

        {step === 7 && (
          <div className="space-y-3">
            {referralCode.trim() && (
              <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-3 text-sm text-violet-100">
                <p className="flex items-center gap-2 font-medium">
                  <Gift size={16} className="shrink-0 text-violet-300" />
                  Je bent uitgenodigd door een collega
                </p>
                <p className="mt-1 text-xs leading-relaxed text-violet-200/80">
                  Code{" "}
                  <span className="font-mono font-semibold">
                    {referralCode.trim().toUpperCase()}
                  </span>{" "}
                  — ontvang{" "}
                  <span className="font-semibold text-violet-100">
                    {REFERRAL_REWARDS.invitee}
                  </span>{" "}
                  op je eerste facturatie.
                </p>
              </div>
            )}

            {!refFromUrl && (
              <Field
                label="Uitnodigingscode (optioneel)"
                hint="Heb je een code van een collega?"
              >
                <InputIcon icon={<Gift size={16} />} />
                <input
                  type="text"
                  autoComplete="off"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  placeholder="Bijv. JDV4729"
                  className={`${inputClass} font-mono uppercase tracking-wider`}
                />
              </Field>
            )}

            <Field label="E-mail">
              <InputIcon icon={<Mail size={16} />} />
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jij@bedrijf.be"
                className={inputClass}
              />
            </Field>

            <Field label="Wachtwoord">
              <InputIcon icon={<Lock size={16} />} />
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimaal 6 tekens"
                className={`${inputClass} pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Verberg wachtwoord" : "Toon wachtwoord"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 transition-colors hover:text-zinc-300"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </Field>

            <label className="flex cursor-pointer select-none items-start gap-2.5 pt-1 text-sm text-zinc-400">
              <input
                type="checkbox"
                required
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/20 bg-zinc-900 accent-sky-500"
              />
              <span>
                Ik ga akkoord met de{" "}
                <a href="#" className="text-zinc-200 underline underline-offset-2 hover:text-sky-400">
                  Voorwaarden
                </a>{" "}
                &amp;{" "}
                <a href="#" className="text-zinc-200 underline underline-offset-2 hover:text-sky-400">
                  Privacy
                </a>
              </span>
            </label>
          </div>
        )}

        {error && (
          <p className="mt-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-sm text-rose-300">
            {error}
          </p>
        )}
        {notice && (
          <p className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-300">
            {notice}
          </p>
        )}

        <div className="mt-5 flex items-center justify-between gap-3">
          {step > 1 ? (
            <button
              type="button"
              onClick={back}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-2 text-sm text-zinc-400 transition-colors hover:text-zinc-200"
            >
              <ArrowLeft size={16} />
              Terug
            </button>
          ) : (
            <span />
          )}

          {step < TOTAL_STEPS ? (
            <button
              type="button"
              onClick={next}
              disabled={!canAdvance()}
              className="group inline-flex items-center gap-2 rounded-full bg-sky-500 px-6 py-2.5 text-sm font-medium text-zinc-950 transition-colors hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Volgende
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={loading || !canAdvance()}
              className="group inline-flex items-center gap-2 rounded-full bg-sky-500 px-6 py-2.5 text-sm font-medium text-zinc-950 transition-colors hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Even geduld…
                </>
              ) : (
                <>
                  Account aanmaken
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          )}
        </div>
      </form>

      <p className="mt-4 text-center text-sm text-zinc-400">
        Heb je al een account?{" "}
        <Link
          href="/login"
          className="font-medium text-sky-400 transition-colors hover:text-sky-300"
        >
          Log in
        </Link>
      </p>
    </div>
  );
}

function OptionGrid({
  label,
  options,
  value,
  onChange,
  onVoice,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
  onVoice?: (text: string) => void;
}) {
  return (
    <div>
      <p className="mb-3 text-sm font-medium text-zinc-200">{label}</p>
      <div className="grid gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`rounded-xl border px-3 py-2.5 text-left text-sm transition-colors ${
              value === opt
                ? "border-sky-500/50 bg-sky-500/15 text-sky-200"
                : "border-white/10 bg-white/[0.03] text-zinc-300 hover:border-white/20 hover:bg-white/[0.05]"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
      {onVoice && (
        <div className="mt-3">
          <VoiceInputButton
            size="sm"
            label="Of spreek je antwoord"
            onTranscript={onVoice}
          />
        </div>
      )}
    </div>
  );
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
      <label className="mb-1 block text-sm font-medium text-zinc-200">{label}</label>
      <div className="relative">{children}</div>
      {hint && <p className="mt-1 text-xs text-zinc-500">{hint}</p>}
    </div>
  );
}

function InputIcon({ icon }: { icon: React.ReactNode }) {
  return (
    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
      {icon}
    </span>
  );
}

function SocialButton({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-zinc-900/60 px-3 py-2 text-sm font-medium text-zinc-200 transition-colors hover:border-white/20 hover:bg-zinc-800/60"
    >
      {icon}
      {label}
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M23.52 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.87c2.26-2.09 3.58-5.17 3.58-8.87Z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.08 7.94-2.91l-3.87-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.27 14.28a7.2 7.2 0 0 1 0-4.56V6.63H1.29a12 12 0 0 0 0 10.74l3.98-3.09Z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42A11.97 11.97 0 0 0 12 0 12 12 0 0 0 1.29 6.63l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75Z" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.36 12.78c-.02-2.32 1.9-3.44 1.98-3.5-1.08-1.58-2.76-1.8-3.36-1.82-1.43-.14-2.79.84-3.51.84-.72 0-1.84-.82-3.02-.8-1.55.02-2.98.9-3.78 2.29-1.61 2.8-.41 6.94 1.16 9.21.77 1.11 1.68 2.36 2.87 2.31 1.15-.05 1.59-.74 2.98-.74 1.39 0 1.78.74 3 .72 1.24-.02 2.02-1.13 2.78-2.25.88-1.29 1.24-2.54 1.26-2.6-.03-.01-2.41-.93-2.43-3.68ZM14.06 5.9c.64-.77 1.07-1.85.95-2.9-.92.04-2.03.61-2.69 1.38-.59.68-1.11 1.78-.97 2.83 1.02.08 2.07-.52 2.71-1.31Z" />
    </svg>
  );
}
