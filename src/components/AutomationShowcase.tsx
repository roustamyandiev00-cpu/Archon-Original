"use client";

import { useState } from "react";
import {
  Check,
  CheckCircle2,
  Pencil,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import AgentPortrait from "@/components/dashboard/agents/AgentPortrait";
import {
  AGENT_AVATAR_OPTIONS,
  DEFAULT_BUILTIN_AVATARS,
} from "@/lib/agents/avatar-options";

const agents = [
  {
    name: "Ela",
    role: "Offerte-agent",
    gradient: "from-sky-400 to-indigo-500",
    avatarUrl: DEFAULT_BUILTIN_AVATARS.schatter,
    capabilities: ["Offertes", "Opvolging", "Pipeline"],
    watches: "5 open offertes · 2 verlopen deze week",
    prepares: "Opvolgmail voor Van Dijck Bouw — vriendelijk, met concrete vervolgstap",
  },
  {
    name: "Scout",
    role: "Lead-agent",
    gradient: "from-emerald-400 to-teal-500",
    avatarUrl: DEFAULT_BUILTIN_AVATARS.opvolger,
    capabilities: ["Leads", "Scoring", "WhatsApp"],
    watches: "Nieuwe aanvraag dakrenovatie · score 94/100",
    prepares: "WhatsApp-draft met intro en voorstel voor werfbezoek morgen",
  },
  {
    name: "Pulse",
    role: "Factuur-agent",
    gradient: "from-amber-400 to-orange-500",
    avatarUrl: DEFAULT_BUILTIN_AVATARS.facturatie,
    capabilities: ["Facturen", "Peppol", "Herinneringen"],
    watches: "€ 2.487,92 openstaand · 1 factuur 14 dagen te laat",
    prepares: "Betalingsherinnering gepland voor morgen 09:00",
  },
];

const automations = [
  { label: "Offerte-opvolging", progress: 78 },
  { label: "Factuur-herinneringen", progress: 62 },
  { label: "Lead-kwalificatie", progress: 91 },
];

const workflow = [
  { label: "Monitoren", detail: "Scant pipeline, facturen & leads" },
  { label: "Voorbereiden", detail: "Schrijft mails & acties klaar" },
  { label: "Goedkeuren", detail: "Jij beslist met één klik" },
];

export default function AutomationShowcase() {
  const [selectedAvatar, setSelectedAvatar] = useState(
    AGENT_AVATAR_OPTIONS[0]!.url,
  );

  return (
    <div className="relative">
      <div className="relative z-10 overflow-hidden rounded-2xl border border-white/[0.1] bg-[#050b14] shadow-[0_24px_72px_rgba(0,0,0,0.3)]">
        {/* Header */}
        <div className="flex flex-col gap-2 border-b border-white/[0.08] bg-[#08111d] px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            <span className="text-xs font-medium text-zinc-200">
              3 AI-agents actief in je crew
            </span>
          </div>
          <div className="flex w-fit items-center gap-1.5 rounded-full border border-sky-300/25 bg-sky-400/[0.08] px-2.5 py-1 text-[11px] font-medium text-sky-300">
            <Zap size={11} />
            Automatisering aan
          </div>
        </div>

        {/* How it works strip */}
        <div className="flex flex-col border-b border-white/[0.08] bg-[#071526] sm:grid sm:grid-cols-3">
          {workflow.map((step, i) => (
            <div
              key={step.label}
              className={`px-3 py-2.5 sm:px-3 ${
                i < workflow.length - 1
                  ? "border-b border-white/[0.08] sm:border-b-0 sm:border-r"
                  : ""
              }`}
            >
              <p className="text-[10px] font-semibold uppercase tracking-wide text-sky-400">
                {i + 1}. {step.label}
              </p>
              <p className="mt-0.5 text-[10px] leading-snug text-zinc-500">
                {step.detail}
              </p>
            </div>
          ))}
        </div>

        {/* AI reasoning strip */}
        <div className="border-b border-white/[0.08] bg-sky-400/[0.05] px-4 py-2.5">
          <div className="flex items-start gap-2">
            <Sparkles size={14} className="mt-0.5 shrink-0 text-sky-400" />
            <p className="text-xs leading-relaxed text-zinc-300">
              <span className="font-medium text-sky-300">Zo werkt het:</span>{" "}
              agents lezen je data, bereiden concrete acties voor en wachten op
              jouw OK. Niets wordt verstuurd zonder goedkeuring.
            </p>
          </div>
        </div>

        {/* Agent cards */}
        <div className="space-y-2 p-2.5 sm:p-3">
          {agents.map((agent) => (
            <div
              key={agent.name}
              className="rounded-xl border border-white/[0.08] bg-[#08111d] p-2.5 sm:p-3"
            >
              <div className="flex items-start gap-2.5 sm:gap-3">
                <AgentPortrait
                  name={agent.name}
                  gradient={agent.gradient}
                  avatarUrl={agent.avatarUrl}
                  size="md"
                  className="h-9 w-9 rounded-xl sm:h-10 sm:w-10"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span className="text-sm font-semibold text-zinc-100">
                        {agent.name}
                      </span>
                      <span className="text-[10px] text-zinc-500">
                        {agent.role}
                      </span>
                    </div>
                    <span className="flex items-center gap-1 text-[10px] text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      Live
                    </span>
                  </div>

                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {agent.capabilities.map((cap) => (
                      <span
                        key={cap}
                        className="rounded-full border border-white/[0.08] bg-white/[0.025] px-1.5 py-0.5 text-[9px] text-slate-400"
                      >
                        {cap}
                      </span>
                    ))}
                  </div>

                  <p className="mt-2 text-[11px] leading-relaxed text-zinc-500">
                    <span className="font-medium text-zinc-400">Ziet:</span>{" "}
                    {agent.watches}
                  </p>
                  <p className="mt-0.5 text-xs font-medium leading-relaxed text-zinc-200">
                    <span className="font-normal text-zinc-500">Bereidt voor:</span>{" "}
                    {agent.prepares}
                  </p>

                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                    <span className="flex min-h-8 items-center gap-1 rounded-md border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1.5 text-[10px] font-medium text-emerald-300 sm:min-h-0 sm:py-1">
                      <Check size={10} />
                      Goedkeuren
                    </span>
                    <span className="flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 text-[10px] text-zinc-400">
                      <Pencil size={10} />
                      Bewerken
                    </span>
                    <span className="flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 text-[10px] text-zinc-500">
                      <X size={10} />
                      Afwijzen
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Avatar picker demo */}
        <div className="border-t border-white/[0.08] bg-[#081525] px-3 py-3 sm:px-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <AgentPortrait
              name="Jouw agent"
              gradient="from-violet-400 to-purple-500"
              avatarUrl={selectedAvatar}
              size="md"
              className="mx-auto h-11 w-11 rounded-xl ring-1 ring-sky-300/40 sm:mx-0"
            />
            <div className="min-w-0 flex-1 text-center sm:text-left">
              <p className="text-xs font-semibold text-zinc-200">
                Kies een gezicht voor je agent
              </p>
              <p className="mt-0.5 text-[10px] leading-relaxed text-zinc-500">
                Geef elke agent een eigen naam, rol en avatar — zo herken je ze
                meteen in je inbox en chat.
              </p>
              <div className="mt-2 flex flex-wrap justify-center gap-1.5 sm:justify-start">
                {AGENT_AVATAR_OPTIONS.slice(0, 8).map((option) => {
                  const selected = selectedAvatar === option.url;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      title={option.label}
                      onClick={() => setSelectedAvatar(option.url)}
                      className={`rounded-lg p-0.5 transition-all ${
                        selected
                          ? "ring-2 ring-sky-300 ring-offset-1 ring-offset-[#081525]"
                          : "ring-1 ring-white/10 hover:ring-white/25"
                      }`}
                    >
                      <AgentPortrait
                        name={option.label}
                        gradient="from-violet-400 to-purple-500"
                        avatarUrl={option.url}
                        size="sm"
                        className="h-9 w-9 rounded-md sm:h-8 sm:w-8"
                      />
                    </button>
                  );
                })}
                <span className="flex h-8 items-center rounded-lg border border-dashed border-white/15 px-2 text-[9px] text-zinc-500">
                  +2 meer
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Automation progress */}
        <div className="border-t border-white/[0.08] bg-[#07101b] px-4 py-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] font-medium text-zinc-400">
              Automatiseringen vandaag
            </span>
            <span className="flex items-center gap-1 text-[11px] font-semibold text-sky-400">
              <CheckCircle2 size={11} />
              12 uitgevoerd
            </span>
          </div>
          <div className="space-y-2">
            {automations.map((item) => (
              <div key={item.label}>
                <div className="mb-1 flex items-center justify-between text-[10px]">
                  <span className="text-zinc-500">{item.label}</span>
                  <span className="text-zinc-400">{item.progress}%</span>
                </div>
                <div className="h-1 overflow-hidden rounded-full bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-sky-400 transition-all duration-1000"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
