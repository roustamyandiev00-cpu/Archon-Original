"use client";

import { forwardRef, useImperativeHandle, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Bot,
  Check,
  Loader2,
  MessageCircle,
  Pencil,
  Plus,
  RotateCcw,
  ScrollText,
  Trash2,
  X,
} from "lucide-react";
import GlowCard from "@/components/dashboard/GlowCard";
import { useAgentChat } from "@/components/dashboard/agent-chat/AgentChatProvider";
import { customAgentToChatAgent } from "@/components/dashboard/agent-chat/agents";
import { saveAgents } from "@/app/dashboard/nova-agents/actions";
import {
  CAPABILITY_OPTIONS,
  DEFAULT_AGENTS,
  GRADIENT_OPTIONS,
  newAgentId,
  type AgentCapability,
  type CustomAgent,
} from "@/components/dashboard/agents/config";
import AgentPortrait from "@/components/dashboard/agents/AgentPortrait";
import { AGENT_AVATAR_OPTIONS, defaultAvatarUrl } from "@/lib/agents/avatar-options";
import type { AiToestemming } from "@/app/dashboard/instellingen/settings";

const inputClass =
  "w-full rounded-xl border border-white/20 bg-zinc-950/85 px-3.5 py-2.5 text-sm text-zinc-100 outline-none transition-all placeholder:text-zinc-500 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10";
const labelClass = "mb-1.5 block text-xs font-bold uppercase tracking-wider text-zinc-400";

type Props = {
  initialAgents: CustomAgent[];
  readOnly?: boolean;
  embedded?: boolean;
  onClose?: () => void;
  onAddDocument?: (agentId: string) => void;
};

export type AgentsManagerHandle = {
  openNew: () => void;
};

const emptyDraft = (): CustomAgent => ({
  id: newAgentId(),
  name: "",
  role: "",
  instructies: "",
  capabilities: ["automatisaties"],
  gradient: GRADIENT_OPTIONS[0].id,
  avatarUrl: defaultAvatarUrl(),
  enabled: true,
  toestemming: "voorstellen",
});

const AgentsManager = forwardRef<AgentsManagerHandle, Props>(function AgentsManager(
  { initialAgents, readOnly, embedded, onClose, onAddDocument },
  ref,
) {
  const router = useRouter();
  const { openWith, syncCompanyAgents } = useAgentChat();
  const [agents, setAgents] = useState(initialAgents);
  const [editing, setEditing] = useState<CustomAgent | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const openNew = () => {
    setEditing(emptyDraft());
    setIsNew(true);
    setError(null);
  };

  useImperativeHandle(ref, () => ({ openNew }), []);

  const openEdit = (agent: CustomAgent) => {
    setEditing({ ...agent, capabilities: [...agent.capabilities] });
    setIsNew(false);
    setError(null);
  };

  const closeEditor = () => {
    setEditing(null);
    setIsNew(false);
    setError(null);
  };

  const updateDraft = <K extends keyof CustomAgent>(
    key: K,
    value: CustomAgent[K],
  ) => {
    setEditing((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const toggleCapability = (cap: AgentCapability) => {
    setEditing((prev) => {
      if (!prev) return prev;
      const has = prev.capabilities.includes(cap);
      return {
        ...prev,
        capabilities: has
          ? prev.capabilities.filter((c) => c !== cap)
          : [...prev.capabilities, cap],
      };
    });
  };

  const persist = (next: CustomAgent[]) => {
    startTransition(async () => {
      setError(null);
      setMessage(null);
      const result = await saveAgents(next);
      if ("error" in result && result.error) {
        setError(result.error);
        return;
      }
      setAgents(next);
      setMessage("Opgeslagen.");
      syncCompanyAgents(next);
      closeEditor();
      router.refresh();
    });
  };

  const handleSaveDraft = () => {
    if (!editing) return;
    if (!editing.name.trim()) {
      setError("Geef je agent een naam.");
      return;
    }
    if (!editing.capabilities.length) {
      setError("Kies minstens één taak.");
      return;
    }

    const next = isNew
      ? [...agents, editing]
      : agents.map((a) => (a.id === editing.id ? editing : a));
    const savedAgent = editing;
    startTransition(async () => {
      setError(null);
      setMessage(null);
      const result = await saveAgents(next);
      if ("error" in result && result.error) {
        setError(result.error);
        return;
      }
      setAgents(next);
      setMessage("Opgeslagen.");
      syncCompanyAgents(next);
      openWith(customAgentToChatAgent(savedAgent));
      closeEditor();
      router.refresh();
    });
  };

  const handleDelete = (id: string) => {
    const agent = agents.find((a) => a.id === id);
    if (!agent || agent.builtin) return;
    if (!confirm(`Agent "${agent.name}" verwijderen?`)) return;
    persist(agents.filter((a) => a.id !== id));
  };

  const handleReset = (id: string) => {
    const def = DEFAULT_AGENTS.find((a) => a.id === id);
    if (!def) return;
    persist(agents.map((a) => (a.id === id ? { ...def } : a)));
  };

  const toggleEnabled = (id: string) => {
    const next = agents.map((a) =>
      a.id === id ? { ...a, enabled: !a.enabled } : a,
    );
    persist(next);
  };

  return (
    <div className={embedded ? "space-y-4" : "space-y-6"}>
      {!embedded && (
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-sky-500/10 text-sky-400">
            <Bot size={20} />
          </span>
          <div>
            <h1 className="text-xl font-semibold text-zinc-50">AI-agents</h1>
            <p className="mt-0.5 text-sm text-zinc-500">
              Maak eigen agents aan, geef ze een naam en stel in wat ze doen.
            </p>
          </div>
        </div>
        {!readOnly && (
          <button
            type="button"
            onClick={openNew}
            className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:bg-sky-400"
          >
            <Plus size={16} />
            Nieuwe agent
          </button>
        )}
      </header>
      )}

      {embedded && !readOnly && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-zinc-400">
            Maak agents aan en stel in wat ze mogen doen.
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openNew}
              className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-3.5 py-1.5 text-xs font-semibold text-zinc-950 transition-colors hover:bg-orange-400"
            >
              <Plus size={14} />
              Nieuwe agent
            </button>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200"
              >
                Sluiten
              </button>
            )}
          </div>
        </div>
      )}

      {readOnly && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          Je bekijkt het dashboard in voorbeeldmodus. Maak een account aan om
          agents te beheren.
        </div>
      )}

      {(message || error) && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            error
              ? "border-red-500/30 bg-red-500/10 text-red-300"
              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
          }`}
        >
          {error ?? message}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {agents.map((agent) => (
          <GlowCard key={agent.id} subtle innerClassName="p-4">
            <div className="flex items-start justify-between gap-2">
              <button
                type="button"
                onClick={() =>
                  openWith({
                    id: agent.id,
                    name: agent.name,
                    role: agent.role,
                    gradient: agent.gradient,
                    avatarUrl: agent.avatarUrl,
                  })
                }
                aria-label={`Chat met ${agent.name}`}
                className="flex items-center gap-3 text-left"
              >
                <AgentPortrait
                  name={agent.name}
                  gradient={agent.gradient}
                  avatarUrl={agent.avatarUrl}
                  size="md"
                  showNovaIcon={agent.id === "nova"}
                />
                <div>
                  <p className="font-semibold text-zinc-100">{agent.name}</p>
                  <p className="text-xs text-zinc-500">{agent.role}</p>
                </div>
              </button>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                  agent.enabled
                    ? "bg-emerald-500/15 text-emerald-300"
                    : "bg-zinc-700/50 text-zinc-500"
                }`}
              >
                {agent.enabled ? "Actief" : "Uit"}
              </span>
            </div>

            <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-zinc-400">
              {agent.instructies || "Geen instructies ingesteld."}
            </p>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {agent.capabilities.map((cap) => {
                const opt = CAPABILITY_OPTIONS.find((c) => c.id === cap);
                return (
                  <span
                    key={cap}
                    className="rounded-full border border-white/10 bg-zinc-800/60 px-2 py-0.5 text-[10px] text-zinc-400"
                  >
                    {opt?.label ?? cap}
                  </span>
                );
              })}
            </div>

            <p className="mt-2 text-[11px] text-zinc-600">
              {agent.toestemming === "versturen"
                ? "Mag zelfstandig versturen"
                : "Stelt eerst voor — jij keurt goed"}
            </p>

            <button
              type="button"
              onClick={() =>
                openWith({
                  id: agent.id,
                  name: agent.name,
                  role: agent.role,
                  gradient: agent.gradient,
                  avatarUrl: agent.avatarUrl,
                })
              }
              className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1.5 text-xs font-semibold text-sky-300 transition-colors hover:bg-sky-500/20"
            >
              <MessageCircle size={13} />
              Chat & taak geven
            </button>

            {onAddDocument && !readOnly && (
              <button
                type="button"
                onClick={() => onAddDocument(agent.id)}
                className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-violet-500/25 bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-300 transition-colors hover:bg-violet-500/15"
              >
                <ScrollText size={13} />
                Mandaat / document
              </button>
            )}

            {!readOnly && (
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/8 pt-3">
                <button
                  type="button"
                  onClick={() => openEdit(agent)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-zinc-300 transition-colors hover:border-white/20 hover:text-zinc-100"
                >
                  <Pencil size={12} />
                  Bewerken
                </button>
                <button
                  type="button"
                  onClick={() => toggleEnabled(agent.id)}
                  disabled={pending}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-zinc-300 transition-colors hover:border-white/20 hover:text-zinc-100 disabled:opacity-50"
                >
                  {agent.enabled ? "Uitzetten" : "Aanzetten"}
                </button>
                {agent.builtin && (
                  <button
                    type="button"
                    onClick={() => handleReset(agent.id)}
                    disabled={pending}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-zinc-500 transition-colors hover:text-zinc-300 disabled:opacity-50"
                  >
                    <RotateCcw size={12} />
                    Reset
                  </button>
                )}
                {!agent.builtin && (
                  <button
                    type="button"
                    onClick={() => handleDelete(agent.id)}
                    disabled={pending}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/20 px-2.5 py-1.5 text-xs text-red-400 transition-colors hover:border-red-500/40 disabled:opacity-50"
                  >
                    <Trash2 size={12} />
                    Verwijderen
                  </button>
                )}
              </div>
            )}
          </GlowCard>
        ))}
      </div>

      {editing && (() => {
        const SUGGESTED_TEMPLATES = [
          {
            name: "Calculator",
            role: "Calculaties & Offertes",
            instructies: "Analyseer projectaanvragen en tekeningen om materiaallijsten en kostenschattingen te maken. Bereid gedetailleerde offertes voor.",
            capabilities: ["offertes"],
            gradient: "from-violet-400 to-purple-500",
            avatarUrl: AGENT_AVATAR_OPTIONS[1]?.url,
          },
          {
            name: "Planner",
            role: "Agenda & Planning",
            instructies: "Beheer de agenda, plan afspraken met klanten in en plan werfbezoeken voor de vakmannen op basis van reistijd.",
            capabilities: ["planning"],
            gradient: "from-sky-400 to-indigo-500",
            avatarUrl: AGENT_AVATAR_OPTIONS[6]?.url,
          },
          {
            name: "Facturatie",
            role: "Peppol & Inkoop",
            instructies: "Scan inkomende inkoopfacturen en leveranciersbonnen, controleer ze tegen de offertes en boek ze in.",
            capabilities: ["facturen", "herinneringen"],
            gradient: "from-amber-400 to-orange-500",
            avatarUrl: AGENT_AVATAR_OPTIONS[4]?.url,
          },
          {
            name: "Werkvoorbereider",
            role: "Projectvoorbereiding",
            instructies: "Zet benodigde materialen klaar voor bestelling zodra een offerte is goedgekeurd, en stel de planning op.",
            capabilities: ["offertes", "planning"],
            gradient: "from-emerald-400 to-teal-500",
            avatarUrl: AGENT_AVATAR_OPTIONS[3]?.url,
          },
          {
            name: "Opvolger",
            role: "Klantopvolging & Sales",
            instructies: "Volg verzonden offertes proactief op via e-mail of WhatsApp als er na 5 dagen nog geen reactie is.",
            capabilities: ["leads", "herinneringen"],
            gradient: "from-rose-400 to-pink-500",
            avatarUrl: AGENT_AVATAR_OPTIONS[9]?.url,
          }
        ];

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
            <div className="max-h-[95vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/15 bg-zinc-950/98 p-5 shadow-2xl shadow-black/90 backdrop-blur-xl">
              <div className="mb-4 flex items-center justify-between border-b border-white/5 pb-2.5">
                <h2 className="text-base font-bold text-zinc-50 flex items-center gap-2">
                  <Bot size={18} className="text-sky-400" />
                  {isNew ? "Nieuwe agent aanmaken" : `${editing.name} bewerken`}
                </h2>
                <button
                  type="button"
                  onClick={closeEditor}
                  className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/5 hover:text-zinc-200 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Compact Suggested Templates Row */}
                {isNew && (
                  <div className="flex items-center gap-2 flex-wrap text-xs rounded-xl border border-white/5 bg-zinc-900/30 px-3 py-2">
                    <span className="text-zinc-500 font-bold uppercase tracking-wider text-[9px] shrink-0">
                      Templates:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {SUGGESTED_TEMPLATES.map((tpl) => (
                        <button
                          key={tpl.name}
                          type="button"
                          onClick={() => {
                            updateDraft("name", tpl.name);
                            updateDraft("role", tpl.role);
                            updateDraft("instructies", tpl.instructies);
                            updateDraft("capabilities", tpl.capabilities as AgentCapability[]);
                            updateDraft("gradient", tpl.gradient);
                            if ("avatarUrl" in tpl && tpl.avatarUrl) {
                              updateDraft("avatarUrl", tpl.avatarUrl as string);
                            }
                          }}
                          className="rounded-full border border-sky-500/20 bg-sky-500/5 px-2.5 py-0.5 text-[10px] font-semibold text-sky-400 hover:bg-sky-500/10 hover:border-sky-500/40 hover:text-sky-300 transition-all"
                        >
                          {tpl.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Name & Role Side-by-Side */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Naam</label>
                    <input
                      className={inputClass}
                      value={editing.name}
                      onChange={(e) => updateDraft("name", e.target.value)}
                      placeholder="bv. Ela, Schatter…"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Rol (omschrijving)</label>
                    <input
                      className={inputClass}
                      value={editing.role}
                      onChange={(e) => updateDraft("role", e.target.value)}
                      placeholder="bv. Offertes, Leads…"
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Wat moet deze agent doen?</label>
                  <textarea
                    className={`${inputClass} min-h-[72px] resize-y py-2`}
                    value={editing.instructies}
                    onChange={(e) => updateDraft("instructies", e.target.value)}
                    placeholder="Beschrijf taken en gedrag..."
                    rows={2}
                  />
                </div>

                {/* Compact Tasks Grid - 3 columns, no description text */}
                <div>
                  <label className={labelClass}>Taken (Capabilities)</label>
                  <div className="grid gap-1.5 grid-cols-3">
                    {CAPABILITY_OPTIONS.map((cap) => {
                      const checked = editing.capabilities.includes(cap.id);
                      return (
                        <label
                          key={cap.id}
                          className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border p-2 transition-all select-none ${
                            checked
                              ? "border-sky-500 bg-sky-500/10 text-sky-300"
                              : "border-white/10 bg-zinc-950/50 text-zinc-400 hover:border-white/20 hover:bg-zinc-900/40"
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="accent-sky-500 rounded border-white/20"
                            checked={checked}
                            onChange={() => toggleCapability(cap.id)}
                          />
                          <span className={`text-[10px] font-bold tracking-tight truncate ${checked ? "text-sky-300" : "text-zinc-300"}`}>
                            {cap.label}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Avatar</label>
                  <div className="grid grid-cols-5 gap-2">
                    {AGENT_AVATAR_OPTIONS.map((option) => {
                      const selected = editing.avatarUrl === option.url;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          title={option.label}
                          onClick={() => updateDraft("avatarUrl", option.url)}
                          className={`overflow-hidden rounded-xl p-1 transition-all ${
                            selected
                              ? "ring-2 ring-sky-400 ring-offset-2 ring-offset-zinc-950"
                              : "ring-1 ring-white/10 hover:ring-white/20"
                          }`}
                        >
                          <AgentPortrait
                            name={option.label}
                            gradient={editing.gradient}
                            avatarUrl={option.url}
                            size="md"
                            className="h-12 w-12 rounded-lg"
                          />
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-2 text-[11px] text-zinc-500">
                    Kies een transparante avatar voor deze agent.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>Toestemming</label>
                    <select
                      className={inputClass}
                      value={editing.toestemming}
                      onChange={(e) =>
                        updateDraft(
                          "toestemming",
                          e.target.value as AiToestemming,
                        )
                      }
                    >
                      <option value="voorstellen" className="bg-zinc-950 text-zinc-200">
                        Eerst voorstellen — ik keur goed
                      </option>
                      <option value="versturen" className="bg-zinc-950 text-zinc-200">
                        Zelfstandig uitvoeren
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>Kleur</label>
                    <select
                      className={inputClass}
                      value={editing.gradient}
                      onChange={(e) => updateDraft("gradient", e.target.value)}
                    >
                      {GRADIENT_OPTIONS.map((g) => (
                        <option key={g.id} value={g.id} className="bg-zinc-950 text-zinc-200">
                          {g.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {error && (
                <p className="mt-3 text-xs font-semibold text-red-400">{error}</p>
              )}

              <div className="mt-5 flex justify-end gap-2 border-t border-white/5 pt-3.5">
                <button
                  type="button"
                  onClick={closeEditor}
                  className="rounded-full border border-white/15 px-3.5 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 transition-colors"
                >
                  Annuleren
                </button>
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={pending}
                  className="inline-flex items-center gap-1.5 rounded-full bg-sky-500 px-3.5 py-1.5 text-xs font-bold text-zinc-950 hover:bg-sky-400 disabled:opacity-50 transition-all"
                >
                  {pending ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Check size={14} />
                  )}
                  Opslaan
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
});

export default AgentsManager;
