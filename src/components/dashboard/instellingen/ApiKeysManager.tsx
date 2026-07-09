"use client";

import { useSyncExternalStore, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  KeyRound,
  Plus,
  Copy,
  Check,
  Trash2,
  Loader2,
  Terminal,
  TriangleAlert,
  BookOpen,
} from "lucide-react";
import {
  createApiKey,
  revokeApiKey,
} from "@/app/dashboard/instellingen/api-keys/actions";
import { API_RESOURCES, type ApiKeyInfo } from "@/lib/apiResources";

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("nl-BE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function CopyButton({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        } catch {
          /* clipboard niet beschikbaar */
        }
      }}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs font-medium text-zinc-200 transition-colors hover:border-sky-500/40 hover:bg-sky-500/10"
    >
      {copied ? (
        <>
          <Check size={13} className="text-emerald-400" /> Gekopieerd
        </>
      ) : (
        <>
          <Copy size={13} /> {label ?? "Kopiëren"}
        </>
      )}
    </button>
  );
}

export default function ApiKeysManager({
  initialKeys,
}: {
  initialKeys: ApiKeyInfo[];
}) {
  const router = useRouter();
  const allScopeIds = API_RESOURCES.map((r) => r.id);
  const [name, setName] = useState("");
  const [scopes, setScopes] = useState<string[]>(allScopeIds);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);
  const origin = useSyncExternalStore(
    () => () => {},
    () => window.location.origin,
    () => "https://jouw-domein.be",
  );

  const activeKeys = initialKeys.filter((k) => !k.revokedAt);

  function toggleScope(id: string) {
    setScopes((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  }

  function handleCreate() {
    setError(null);
    startTransition(async () => {
      const res = await createApiKey(name, scopes);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      setCreatedKey(res.rawKey);
      setName("");
      setScopes(allScopeIds);
      router.refresh();
    });
  }

  function handleRevoke(id: string) {
    setError(null);
    setRevoking(id);
    startTransition(async () => {
      const res = await revokeApiKey(id);
      setRevoking(null);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  const curlExample = `curl -H "Authorization: Bearer ${
    createdKey ?? "ap_live_JOUW_SLEUTEL"
  }" \\\n  ${origin}/api/v1/offertes`;

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 border-b border-white/10 pb-4">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sky-500/10 text-sky-400">
          <KeyRound size={18} />
        </span>
        <div>
          <h2 className="text-base font-semibold text-zinc-100">
            API & integraties
          </h2>
          <p className="mt-0.5 text-sm text-zinc-500">
            Maak een API-sleutel om je ArchonPro-gegevens veilig te koppelen aan
            eigen software, boekhouding, dashboards of automatiseringen.
          </p>
        </div>
      </div>

      {/* Uitleg: wat kan je ermee */}
      <div className="rounded-xl border border-sky-500/20 bg-sky-500/[0.06] p-4">
        <p className="flex items-center gap-2 text-sm font-medium text-zinc-100">
          <BookOpen size={15} className="text-sky-400" />
          Wat kan je met de API?
        </p>
        <ul className="mt-2 space-y-1.5 text-sm text-zinc-400">
          <li>
            • Je <strong className="text-zinc-300">offertes, facturen en
            klanten</strong> automatisch uitlezen in je eigen tools of
            boekhoudpakket.
          </li>
          <li>
            • Een eigen <strong className="text-zinc-300">dashboard of
            rapport</strong> bouwen met live cijfers.
          </li>
          <li>
            • Gegevens <strong className="text-zinc-300">synchroniseren</strong>{" "}
            met zapier-achtige automatiseringen of scripts.
          </li>
        </ul>
        <p className="mt-2 text-xs text-zinc-500">
          Alle endpoints zijn read-only en geven uitsluitend gegevens van jouw
          bedrijf terug.
        </p>
      </div>

      {/* Nieuw aangemaakte sleutel (eenmalig zichtbaar) */}
      {createdKey && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/[0.07] p-4">
          <p className="flex items-center gap-2 text-sm font-medium text-emerald-300">
            <TriangleAlert size={15} />
            Kopieer je sleutel nu — hij wordt maar één keer getoond.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded-lg border border-white/10 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100">
              {createdKey}
            </code>
            <CopyButton value={createdKey} />
          </div>
          <button
            type="button"
            onClick={() => setCreatedKey(null)}
            className="mt-3 text-xs font-medium text-zinc-400 hover:text-zinc-200"
          >
            Ik heb de sleutel opgeslagen — verbergen
          </button>
        </div>
      )}

      {/* Nieuwe sleutel maken */}
      <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-4">
        <label className="mb-1.5 block text-sm font-medium text-zinc-200">
          Nieuwe API-sleutel
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Naam, bijv. 'Boekhouding' of 'Zapier'"
            className="w-full rounded-xl border border-white/10 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-500 focus:border-sky-500/60"
          />
          <button
            type="button"
            onClick={handleCreate}
            disabled={pending}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-sky-500 px-5 py-2.5 text-sm font-medium text-zinc-950 transition-colors hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending && !revoking ? (
              <>
                <Loader2 size={15} className="animate-spin" /> Aanmaken…
              </>
            ) : (
              <>
                <Plus size={15} /> Sleutel aanmaken
              </>
            )}
          </button>
        </div>

        <p className="mt-3 mb-1.5 text-xs font-medium text-zinc-400">
          Toegang van deze sleutel
        </p>
        <div className="flex flex-wrap gap-2">
          {API_RESOURCES.map((r) => {
            const on = scopes.includes(r.id);
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => toggleScope(r.id)}
                aria-pressed={on}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  on
                    ? "border-sky-500/60 bg-sky-500/10 text-sky-300"
                    : "border-white/10 text-zinc-400 hover:bg-white/5"
                }`}
              >
                {on && <Check size={12} />}
                {r.title}
              </button>
            );
          })}
        </div>
        <p className="mt-1.5 text-xs text-zinc-500">
          Kies enkel wat nodig is. Standaard heeft de sleutel toegang tot alles.
        </p>

        {error && <p className="mt-2 text-xs text-rose-400">{error}</p>}
      </div>

      {/* Bestaande sleutels */}
      <div>
        <h3 className="text-sm font-semibold text-zinc-100">
          Actieve sleutels
        </h3>
        {activeKeys.length === 0 ? (
          <p className="mt-2 rounded-xl border border-dashed border-white/10 bg-zinc-900/40 px-4 py-6 text-center text-sm text-zinc-500">
            Je hebt nog geen actieve API-sleutels.
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-white/5 overflow-hidden rounded-xl border border-white/10">
            {activeKeys.map((k) => (
              <li
                key={k.id}
                className="flex flex-wrap items-center justify-between gap-3 bg-zinc-900/40 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-sm font-medium text-zinc-100">
                    <KeyRound size={14} className="text-sky-400" />
                    {k.name}
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    <code className="text-zinc-400">{k.keyPrefix}…</code> ·
                    aangemaakt {formatDate(k.createdAt)} · laatst gebruikt{" "}
                    {formatDate(k.lastUsedAt)}
                  </p>
                  {k.scopes.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {k.scopes.map((s) => (
                        <span
                          key={s}
                          className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-zinc-400"
                        >
                          {API_RESOURCES.find((r) => r.id === s)?.title ?? s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleRevoke(k.id)}
                  disabled={pending}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-300 disabled:opacity-60"
                >
                  {revoking === k.id ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Trash2 size={13} />
                  )}
                  Intrekken
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Documentatie */}
      <div className="space-y-3 border-t border-white/10 pt-6">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
          <Terminal size={15} className="text-sky-400" />
          Endpoints & voorbeeld
        </h3>

        <div className="overflow-hidden rounded-xl border border-white/10">
          <div className="flex items-center justify-between gap-2 border-b border-white/10 bg-zinc-900/60 px-3 py-2">
            <span className="text-xs font-medium text-zinc-400">
              Voorbeeld (bash)
            </span>
            <CopyButton value={curlExample} label="Kopieer" />
          </div>
          <pre className="overflow-x-auto bg-zinc-950/60 px-4 py-3 text-xs leading-relaxed text-zinc-200">
            <code>{curlExample}</code>
          </pre>
        </div>

        <ul className="divide-y divide-white/5 overflow-hidden rounded-xl border border-white/10">
          {API_RESOURCES.map((r) => (
            <li
              key={r.id}
              className="flex flex-wrap items-center justify-between gap-2 bg-zinc-900/40 px-4 py-2.5"
            >
              <div className="min-w-0">
                <code className="text-xs font-medium text-sky-300">
                  GET {r.path}
                </code>
                <p className="mt-0.5 text-xs text-zinc-500">{r.description}</p>
              </div>
              <span className="text-[11px] uppercase tracking-wide text-zinc-600">
                read-only
              </span>
            </li>
          ))}
        </ul>

        <p className="text-xs text-zinc-500">
          Paginering via <code className="text-zinc-400">?limit=</code> (max. 200)
          en <code className="text-zinc-400">?offset=</code>. Authenticatie met de
          header <code className="text-zinc-400">Authorization: Bearer …</code>.
        </p>
      </div>
    </div>
  );
}
