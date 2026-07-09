"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Building2,
  Eye,
  EyeOff,
  Gift,
  Lock,
  Mail,
  User,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { REFERRAL_REWARDS } from "@/components/ReferralProgram";

type Mode = "login" | "register";

const copy: Record<
  Mode,
  {
    title: string;
    subtitle: string;
    cta: string;
    switchText: string;
    switchLabel: string;
    switchHref: string;
  }
> = {
  login: {
    title: "Welkom terug",
    subtitle: "Log in en pak je werkdag op waar je gebleven was.",
    cta: "Inloggen",
    switchText: "Nog geen account?",
    switchLabel: "Registreer gratis",
    switchHref: "/register",
  },
  register: {
    title: "Maak je account",
    subtitle: "Slimmer beheren start hier. Gratis, geen creditcard nodig.",
    cta: "Account aanmaken",
    switchText: "Heb je al een account?",
    switchLabel: "Log in",
    switchHref: "/login",
  },
};

export default function AuthForm({ mode }: { mode: Mode }) {
  const t = copy[mode];
  const isRegister = mode === "register";

  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/dashboard";
  const refCode = searchParams.get("ref")?.trim() ?? "";
  const prefillEmail = searchParams.get("email") ?? "";

  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [name, setName] = useState("");
  const [bedrijf, setBedrijf] = useState("");
  const [email, setEmail] = useState(prefillEmail);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);
    const supabase = createClient();

    try {
      if (isRegister) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
              ...(bedrijf.trim() ? { company_name: bedrijf.trim() } : {}),
              ...(refCode ? { referred_by: refCode } : {}),
            },
            emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`,
          },
        });
        if (error) throw error;
        if (data.session) {
          router.push(redirectTo);
          router.refresh();
        } else {
          setNotice(
            "Account aangemaakt. Check je e-mail om je adres te bevestigen en log daarna in.",
          );
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push(redirectTo);
        router.refresh();
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
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`,
      },
    });
    if (error) setError(error.message);
  }

  return (
    <div>
      {/* Social buttons */}
      <div className="grid grid-cols-2 gap-3">
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

      {/* Divider */}
      <div className="my-4 flex items-center gap-3">
        <span className="h-px flex-1 bg-white/10" />
        <span className="text-xs text-zinc-500">Of</span>
        <span className="h-px flex-1 bg-white/10" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {isRegister && refCode && (
          <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-3 text-sm text-violet-100">
            <p className="flex items-center gap-2 font-medium">
              <Gift size={16} className="shrink-0 text-violet-300" />
              Je bent uitgenodigd door een collega
            </p>
            <p className="mt-1 text-xs leading-relaxed text-violet-200/80">
              Maak je account af en ontvang automatisch{" "}
              <span className="font-semibold text-violet-100">
                {REFERRAL_REWARDS.invitee}
              </span>{" "}
              op je eerste facturatie.
            </p>
          </div>
        )}

        {isRegister && (
          <Field label="Naam">
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
        )}

        {isRegister && (
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
            autoComplete={isRegister ? "new-password" : "current-password"}
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Voer je wachtwoord in"
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

        {isRegister ? (
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
        ) : (
          <div className="flex items-center justify-between pt-1">
            <label className="flex cursor-pointer select-none items-center gap-2 text-sm text-zinc-400">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-white/20 bg-zinc-900 accent-sky-500"
              />
              Onthoud mij
            </label>
            <a
              href="#"
              className="text-sm text-zinc-400 transition-colors hover:text-sky-400"
            >
              Wachtwoord vergeten?
            </a>
          </div>
        )}

        {error && (
          <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-sm text-rose-300">
            {error}
          </p>
        )}
        {notice && (
          <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-300">
            {notice}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || (isRegister && !agreed)}
          className="group mt-1 inline-flex w-full items-center justify-center gap-2 rounded-full bg-sky-500 px-6 py-2.5 text-sm font-medium text-zinc-950 transition-colors hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Even geduld…
            </>
          ) : (
            <>
              {t.cta}
              <ArrowRight
                size={16}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </>
          )}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-zinc-400">
        {t.switchText}{" "}
        <Link
          href={t.switchHref}
          className="font-medium text-sky-400 transition-colors hover:text-sky-300"
        >
          {t.switchLabel}
        </Link>
      </p>
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-white/10 bg-zinc-900/60 py-2.5 pl-10 pr-4 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-500 focus:border-sky-500/60 focus:bg-zinc-900";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-zinc-200">
        {label}
      </label>
      <div className="relative">{children}</div>
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
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.87c2.26-2.09 3.58-5.17 3.58-8.87Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.08 7.94-2.91l-3.87-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.28a7.2 7.2 0 0 1 0-4.56V6.63H1.29a12 12 0 0 0 0 10.74l3.98-3.09Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42A11.97 11.97 0 0 0 12 0 12 12 0 0 0 1.29 6.63l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75Z"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M16.36 12.78c-.02-2.32 1.9-3.44 1.98-3.5-1.08-1.58-2.76-1.8-3.36-1.82-1.43-.14-2.79.84-3.51.84-.72 0-1.84-.82-3.02-.8-1.55.02-2.98.9-3.78 2.29-1.61 2.8-.41 6.94 1.16 9.21.77 1.11 1.68 2.36 2.87 2.31 1.15-.05 1.59-.74 2.98-.74 1.39 0 1.78.74 3 .72 1.24-.02 2.02-1.13 2.78-2.25.88-1.29 1.24-2.54 1.26-2.6-.03-.01-2.41-.93-2.43-3.68ZM14.06 5.9c.64-.77 1.07-1.85.95-2.9-.92.04-2.03.61-2.69 1.38-.59.68-1.11 1.78-.97 2.83 1.02.08 2.07-.52 2.71-1.31Z" />
    </svg>
  );
}
