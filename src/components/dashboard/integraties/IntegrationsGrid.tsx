"use client";

import { useSyncExternalStore, useState, useTransition } from "react";
import {
  Check,
  Loader2,
  Plug,
  X,
  Link2,
  Unlink,
  ExternalLink,
} from "lucide-react";
import {
  connectIntegration,
  disconnectIntegration,
  testIntegration,
} from "@/app/dashboard/integraties/actions";
import {
  PEPPOL_ACCESS_POINTS,
  type ProviderMeta,
} from "@/lib/integraties";
import { hasOAuth } from "@/lib/oauth";

type ConnState = Record<string, { status: string; config: Record<string, unknown> }>;

const inputClass =
  "w-full rounded-xl border border-white/10 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-500 focus:border-sky-500/60";
const labelClass = "mb-1.5 block text-sm font-medium text-zinc-200";

export default function IntegrationsGrid({
  providers,
  connections,
}: {
  providers: ProviderMeta[];
  connections: ConnState;
}) {
  const [active, setActive] = useState<ProviderMeta | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {providers.map((p) => {
          const conn = connections[p.id];
          const connected = conn?.status === "connected";
          const configured = conn?.status === "configured";
          return (
            <div
              key={p.id}
              className="flex flex-col justify-between rounded-2xl border border-white/10 bg-zinc-900/50 p-5 transition-colors hover:border-sky-500/30"
            >
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-sky-500/20 to-indigo-500/20 text-sm font-bold text-sky-400 ring-1 ring-inset ring-white/10">
                  {p.name.charAt(0)}
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-zinc-50">{p.name}</p>
                  <p className="text-[11px] uppercase tracking-wide text-zinc-500">
                    {p.category}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-xs text-zinc-400">{p.description}</p>

              <div className="mt-4 flex items-center justify-between">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${
                    connected
                      ? "bg-emerald-500/15 text-emerald-300"
                      : configured
                        ? "bg-amber-500/15 text-amber-300"
                        : "bg-zinc-500/15 text-zinc-400"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      connected
                        ? "bg-emerald-400"
                        : configured
                          ? "bg-amber-400"
                          : "bg-zinc-500"
                    }`}
                  />
                  {connected
                    ? "Verbonden"
                    : configured
                      ? "Autorisatie nodig"
                      : "Niet verbonden"}
                </span>
                <button
                  type="button"
                  onClick={() => setActive(p)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    connected || configured
                      ? "border border-white/10 text-zinc-200 hover:bg-white/5"
                      : "bg-sky-500 text-zinc-950 hover:bg-sky-400"
                  }`}
                >
                  {connected || configured ? (
                    <>
                      <Plug size={13} /> Beheren
                    </>
                  ) : (
                    <>
                      <Link2 size={13} /> Verbinden
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {active && (
        <ConnectModal
          provider={active}
          current={connections[active.id]}
          onClose={() => setActive(null)}
        />
      )}
    </>
  );
}

function ConnectModal({
  provider,
  current,
  onClose,
}: {
  provider: ProviderMeta;
  current?: { status: string; config: Record<string, unknown> };
  onClose: () => void;
}) {
  const cfg = current?.config ?? {};
  const connected = current?.status === "connected";
  const isOAuthFlow = provider.auth === "oauth" && hasOAuth(provider.id);
  const isConnectFlow = provider.auth === "connect";
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [configured, setConfigured] = useState(
    current?.status === "configured",
  );
  const [testing, setTesting] = useState(false);
  const [testMsg, setTestMsg] = useState<string | null>(null);
  const [testErr, setTestErr] = useState<string | null>(null);
  const origin = useSyncExternalStore(
    () => () => {},
    () => window.location.origin,
    () => "",
  );

  const [apiKey, setApiKey] = useState((cfg.apiKey as string) ?? "");
  const [clientId, setClientId] = useState((cfg.clientId as string) ?? "");
  const [clientSecret, setClientSecret] = useState(
    (cfg.clientSecret as string) ?? "",
  );
  const [accessPoint, setAccessPoint] = useState(
    (cfg.accessPoint as string) ?? PEPPOL_ACCESS_POINTS[0].id,
  );
  const [participantId, setParticipantId] = useState(
    (cfg.participantId as string) ?? "",
  );
  const [legalEntityId, setLegalEntityId] = useState(
    (cfg.legalEntityId as string) ?? "",
  );
  const [connectorUid, setConnectorUid] = useState(
    (cfg.connectorUid as string) ?? "",
  );
  const [notificationChannel, setNotificationChannel] = useState(
    (cfg.notificationChannel as string) ?? "",
  );
  const workspaceName =
    typeof cfg.workspaceName === "string" ? cfg.workspaceName : null;

  const redirectUri = origin
    ? `${origin}/dashboard/integraties/${provider.id}/callback`
    : "";

  function submit() {
    setError(null);
    let config: Record<string, string>;
    if (provider.auth === "peppol") {
      config = {
        accessPoint,
        participantId: participantId.trim(),
        apiKey: apiKey.trim(),
        legalEntityId: legalEntityId.trim(),
      };
    } else if (isConnectFlow) {
      config = {
        connectorUid: connectorUid.trim(),
        notificationChannel: notificationChannel.trim(),
      };
    } else if (isOAuthFlow) {
      config = { clientId: clientId.trim(), clientSecret: clientSecret.trim() };
    } else {
      config = { apiKey: apiKey.trim() };
    }
    startTransition(async () => {
      const res = await connectIntegration(provider.id, config);
      if (res && "error" in res && res.error) {
        setError(res.error);
        return;
      }
      // OAuth- of Connect-flow: modal openhouden zodat de gebruiker kan autoriseren.
      if (isOAuthFlow || isConnectFlow) {
        setConfigured(true);
        return;
      }
      onClose();
    });
  }

  function runTest() {
    setTestErr(null);
    setTestMsg(null);
    setTesting(true);
    startTransition(async () => {
      const res = await testIntegration(provider.id);
      setTesting(false);
      if (res && "error" in res && res.error) {
        setTestErr(res.error);
        return;
      }
      const account = res && "account" in res ? res.account : null;
      setTestMsg(
        account
          ? `Verbonden als: ${account}`
          : "Verbinding werkt (geen accountnaam ontvangen).",
      );
    });
  }

  function remove() {
    setError(null);
    startTransition(async () => {
      const res = await disconnectIntegration(provider.id);
      if (res && "error" in res && res.error) {
        setError(res.error);
        return;
      }
      onClose();
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-sky-500/20 to-indigo-500/20 text-sm font-bold text-sky-400 ring-1 ring-inset ring-white/10">
              {provider.name.charAt(0)}
            </span>
            <div>
              <h2 className="text-base font-semibold text-zinc-50">
                {provider.name}
              </h2>
              <p className="text-xs text-zinc-500">{provider.category}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-zinc-400 hover:bg-white/10 hover:text-zinc-100"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          {provider.auth === "peppol" ? (
            <>
              <div>
                <label className={labelClass}>Access point</label>
                <select
                  value={accessPoint}
                  onChange={(e) => setAccessPoint(e.target.value)}
                  className={inputClass}
                >
                  {PEPPOL_ACCESS_POINTS.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Peppol-identificatie</label>
                <input
                  value={participantId}
                  onChange={(e) => setParticipantId(e.target.value)}
                  placeholder="0208:BE0123456789"
                  className={inputClass}
                />
                <p className="mt-1 text-xs text-zinc-500">
                  Schema + waarde, bv. <code>0208</code> (KBO) gevolgd door je
                  ondernemingsnummer.
                </p>
              </div>
              <div>
                <label className={labelClass}>API-sleutel access point</label>
                <input
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Sleutel van je access point-provider"
                  className={inputClass}
                  type="password"
                />
                <p className="mt-1 text-xs text-zinc-500">
                  Nodig om e-facturen effectief te versturen. Zonder sleutel kun
                  je nog steeds de UBL-XML downloaden.
                </p>
              </div>
              {accessPoint === "storecove" && (
                <div>
                  <label className={labelClass}>Legal Entity ID (Storecove)</label>
                  <input
                    value={legalEntityId}
                    onChange={(e) => setLegalEntityId(e.target.value)}
                    placeholder="bv. 12345"
                    className={inputClass}
                  />
                </div>
              )}
            </>
          ) : isConnectFlow ? (
            <>
              <p className="text-xs text-zinc-500">
                Tokens komen via{" "}
                <a
                  href="https://vercel.com/docs/connect"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sky-400 hover:underline"
                >
                  Vercel Connect
                </a>
                . Geen bot-token in je omgeving.
              </p>
              <div>
                <label className={labelClass}>Connector-UID</label>
                <input
                  value={connectorUid}
                  onChange={(e) => setConnectorUid(e.target.value)}
                  placeholder="slack/archon"
                  className={inputClass}
                />
                <p className="mt-1 text-xs text-zinc-500">
                  Optioneel als <code>SLACK_CONNECTOR</code> al in de omgeving
                  staat.
                </p>
              </div>
              <div>
                <label className={labelClass}>Meldingenkanaal (optioneel)</label>
                <input
                  value={notificationChannel}
                  onChange={(e) => setNotificationChannel(e.target.value)}
                  placeholder="#facturen of C01234567"
                  className={inputClass}
                />
              </div>
              {connected && workspaceName && (
                <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
                  Workspace: <b>{workspaceName}</b>
                </p>
              )}
              {(configured || connected) && (
                <a
                  href="/dashboard/integraties/slack/authorize"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-indigo-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-400"
                >
                  <ExternalLink size={15} />
                  {connected
                    ? "Opnieuw koppelen"
                    : "Slack-workspace koppelen"}
                </a>
              )}
              {connected && (
                <button
                  type="button"
                  onClick={runTest}
                  disabled={testing}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/10 px-4 py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:bg-white/5 disabled:opacity-60"
                >
                  {testing ? (
                    <>
                      <Loader2 size={15} className="animate-spin" /> Testen…
                    </>
                  ) : (
                    <>
                      <Link2 size={15} /> Test verbinding
                    </>
                  )}
                </button>
              )}
              {testMsg && (
                <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
                  {testMsg}
                </p>
              )}
              {testErr && (
                <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
                  {testErr}
                </p>
              )}
            </>
          ) : isOAuthFlow ? (
            <>
              <div>
                <label className={labelClass}>Client ID</label>
                <input
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder="Client ID van je geregistreerde app"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Client Secret</label>
                <input
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  placeholder="Client Secret"
                  className={inputClass}
                  type="password"
                />
              </div>
              <div>
                <label className={labelClass}>Redirect-URI</label>
                <input
                  value={redirectUri}
                  readOnly
                  onFocus={(e) => e.currentTarget.select()}
                  className={`${inputClass} text-zinc-400`}
                />
                <p className="mt-1 text-xs text-zinc-500">
                  Registreer <b>exact</b> deze URI in je {provider.name}-app.
                  Sla daarna op en klik op <b>Autoriseren</b>.
                </p>
              </div>
              {(configured || connected) && (
                <a
                  href={`/dashboard/integraties/${provider.id}/authorize`}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-indigo-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-400"
                >
                  <ExternalLink size={15} />
                  {connected ? "Opnieuw autoriseren" : `Autoriseren bij ${provider.name}`}
                </a>
              )}
              {connected && (
                <button
                  type="button"
                  onClick={runTest}
                  disabled={testing}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/10 px-4 py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:bg-white/5 disabled:opacity-60"
                >
                  {testing ? (
                    <>
                      <Loader2 size={15} className="animate-spin" /> Testen…
                    </>
                  ) : (
                    <>
                      <Link2 size={15} /> Test verbinding
                    </>
                  )}
                </button>
              )}
              {testMsg && (
                <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
                  {testMsg}
                </p>
              )}
              {testErr && (
                <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
                  {testErr}
                </p>
              )}
            </>
          ) : (
            <div>
              <label className={labelClass}>
                {provider.auth === "oauth" ? "Toegangstoken / API-sleutel" : "API-sleutel"}
              </label>
              <input
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Plak hier je sleutel"
                className={inputClass}
                type="password"
              />
              {provider.auth === "oauth" && (
                <p className="mt-1 text-xs text-zinc-500">
                  Voor {provider.name} verloopt de koppeling normaal via OAuth.
                  Vul hier voorlopig je API-token in; de volledige OAuth-flow
                  wordt geactiveerd zodra de app-credentials zijn ingesteld.
                </p>
              )}
            </div>
          )}

          {error && (
            <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
              {error}
            </p>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          {connected || configured ? (
            <button
              type="button"
              onClick={remove}
              disabled={pending}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-rose-300 transition-colors hover:bg-rose-500/10 disabled:opacity-60"
            >
              <Unlink size={14} /> Ontkoppelen
            </button>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={submit}
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-5 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-sky-400 disabled:opacity-60"
          >
            {pending ? (
              <>
                <Loader2 size={15} className="animate-spin" /> Opslaan…
              </>
            ) : (
              <>
                <Check size={15} />{" "}
                {connected
                  ? "Bijwerken"
                  : isOAuthFlow || isConnectFlow
                    ? "Opslaan"
                    : "Verbinden"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
