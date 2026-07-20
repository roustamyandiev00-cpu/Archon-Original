"use client";

import { useState } from "react";
import { Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function PasswordResetForm() {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password.length < 10) {
      setError("Gebruik minstens 10 tekens voor je nieuwe wachtwoord.");
      return;
    }
    if (password !== confirmation) {
      setError("De twee wachtwoorden zijn niet gelijk.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError("Je wachtwoord kon niet worden gewijzigd. Vraag een nieuwe link aan.");
      setLoading(false);
      return;
    }

    await supabase.auth.signOut();
    window.location.assign("/login?passwordReset=1");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PasswordField
        label="Nieuw wachtwoord"
        value={password}
        onChange={setPassword}
        showPassword={showPassword}
        onToggle={() => setShowPassword((visible) => !visible)}
      />
      <PasswordField
        label="Herhaal wachtwoord"
        value={confirmation}
        onChange={setConfirmation}
        showPassword={showPassword}
      />

      {error && (
        <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-sm text-rose-300">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-sky-500 px-6 py-2.5 text-sm font-medium text-zinc-950 transition-colors hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading && <Loader2 size={16} className="animate-spin" />}
        {loading ? "Wachtwoord wijzigen…" : "Wachtwoord wijzigen"}
      </button>
    </form>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  showPassword,
  onToggle,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  showPassword: boolean;
  onToggle?: () => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-zinc-200">
        {label}
      </label>
      <div className="relative">
        <Lock
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
        />
        <input
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          required
          minLength={10}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-xl border border-white/10 bg-zinc-900/60 py-2.5 pl-10 pr-11 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-500 focus:border-sky-500/60 focus:bg-zinc-900"
        />
        {onToggle && (
          <button
            type="button"
            onClick={onToggle}
            aria-label={showPassword ? "Verberg wachtwoord" : "Toon wachtwoord"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 transition-colors hover:text-zinc-300"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
    </div>
  );
}
