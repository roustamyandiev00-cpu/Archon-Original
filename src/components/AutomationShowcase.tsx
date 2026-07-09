"use client";

import {
  Bot,
  CheckCircle2,
  Clock,
  Mail,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";

const agents = [
  {
    name: "Nova",
    role: "Offerte-agent",
    color: "from-sky-500 to-cyan-400",
    status: "Analyseert 5 open offertes",
    task: "Opvolgmail klaar voor Van Dijck Bouw",
    icon: Mail,
    automated: true,
  },
  {
    name: "Scout",
    role: "Lead-agent",
    color: "from-emerald-500 to-teal-400",
    status: "Nieuwe aanvraag gescoord: 94/100",
    task: "WhatsApp-draft automatisch voorbereid",
    icon: TrendingUp,
    automated: true,
  },
  {
    name: "Pulse",
    role: "Factuur-agent",
    color: "from-violet-500 to-fuchsia-400",
    status: "€ 2.487,92 openstaand gedetecteerd",
    task: "Herinnering gepland voor morgen 09:00",
    icon: Clock,
    automated: true,
  },
];

const automations = [
  { label: "Offerte-opvolging", progress: 78, active: true },
  { label: "Factuur-herinneringen", progress: 62, active: true },
  { label: "Lead-kwalificatie", progress: 91, active: true },
];

export default function AutomationShowcase() {
  return (
    <div className="relative">
      <div className="aurora-glow opacity-60" />

      <div className="relative z-10 overflow-hidden rounded-2xl bg-white/[0.02] shadow-2xl shadow-sky-500/5 backdrop-blur-xl ring-1 ring-inset ring-white/5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            <span className="text-xs font-medium text-zinc-200">
              3 AI-agents actief
            </span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-1 text-[11px] font-medium text-sky-300">
            <Zap size={11} />
            Automatisering aan
          </div>
        </div>

        {/* AI reasoning strip */}
        <div className="border-b border-white/5 bg-sky-500/5 px-4 py-2.5">
          <div className="flex items-start gap-2">
            <Sparkles size={14} className="mt-0.5 shrink-0 text-sky-400" />
            <p className="text-xs leading-relaxed text-zinc-300">
              <span className="font-medium text-sky-300">Echte AI:</span> Nova
              analyseerde je pipeline, prioriteerde 3 acties en zette alles klaar
              ter goedkeuring — zonder handmatig werk.
            </p>
          </div>
        </div>

        {/* Agent cards */}
        <div className="space-y-2 p-3">
          {agents.map((agent) => (
            <div
              key={agent.name}
              className="rounded-xl border border-white/5 bg-white/[0.02] p-3"
            >
              <div className="flex items-start gap-3">
                <div
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br ${agent.color} text-zinc-950`}
                >
                  <Bot size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
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
                  <p className="mt-1 text-xs text-zinc-400">{agent.status}</p>
                  <p className="mt-0.5 text-xs font-medium text-zinc-200">
                    {agent.task}
                  </p>
                  {agent.automated && (
                    <div className="mt-2 flex items-center gap-1.5 text-[10px] text-sky-400/90">
                      <CheckCircle2 size={11} />
                      Automatisch voorbereid · wacht op jouw OK
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Automation progress */}
        <div className="border-t border-white/5 bg-white/[0.015] px-4 py-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] font-medium text-zinc-400">
              Automatiseringen vandaag
            </span>
            <span className="text-[11px] font-semibold text-sky-400">
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
                    className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-400 transition-all duration-1000"
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
