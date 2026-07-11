"use client";

import { useState, useTransition } from "react";
import { BookOpen, BrainCircuit, Loader2 } from "lucide-react";
import {
  saveAgentKnowledgeDoc,
  KIND_LABELS,
  type AgentKnowledgeKind,
} from "@/app/dashboard/geheugen/actions";
import type { CustomAgent } from "@/components/dashboard/agents/config";
import { CREW_AGENTS } from "@/components/dashboard/views/crew-display";

const inputClass =
  "w-full rounded-xl border border-white/[0.08] bg-zinc-950/60 px-3.5 py-2.5 text-sm text-zinc-100 outline-none transition-all placeholder:text-zinc-600 focus:border-orange-500/40 focus:ring-2 focus:ring-orange-500/10";

const KIND_OPTIONS: {
  id: AgentKnowledgeKind;
  hint: string;
}[] = [
  {
    id: "instruction",
    hint: "Taken, vaardigheden en grenzen — wat mag deze agent doen?",
  },
  {
    id: "fact",
    hint: "Feiten, prijzen, procedures — wat moet de agent weten?",
  },
  {
    id: "preference",
    hint: "Voorkeuren en regels — wat moet de agent altijd onthouden?",
  },
  {
    id: "context",
    hint: "Klant- of werfcontext die relevant blijft.",
  },
];

type Props = {
  companyAgents: CustomAgent[];
  defaultAgentId?: string;
  onSaved?: () => void;
};

export default function AgentKnowledgeForm({
  companyAgents,
  defaultAgentId,
  onSaved,
}: Props) {
  const allAgents = [
    ...companyAgents.filter((a) => a.enabled),
    ...CREW_AGENTS.filter(
      (c) => !companyAgents.some((a) => a.id === c.id),
    ).map((c) => ({
      id: c.id,
      name: c.name,
      role: c.role,
      instructies: c.description,
      capabilities: [] as CustomAgent["capabilities"],
      gradient: c.gradient,
      enabled: true,
      toestemming: "voorstellen" as const,
    })),
  ];

  const [agentId, setAgentId] = useState(
    defaultAgentId ?? allAgents[0]?.id ?? "",
  );
  const [kind, setKind] = useState<AgentKnowledgeKind>("instruction");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const selected = allAgents.find((a) => a.id === agentId);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) {
      setError("Kies een agent.");
      return;
    }

    startTransition(async () => {
      setError(null);
      setMessage(null);
      const result = await saveAgentKnowledgeDoc({
        agentId: selected.id,
        agentName: selected.name,
        kind,
        content,
        title: title || undefined,
      });
      if ("error" in result && result.error) {
        setError(result.error);
        return;
      }
      setContent("");
      setTitle("");
      setMessage(`Opgeslagen voor ${selected.name}.`);
      onSaved?.();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-500/10 text-violet-400">
          <BrainCircuit size={18} />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-zinc-100">
            Kennis & documenten
          </h3>
          <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">
            Voeg toe wat een agent moet kunnen, leren of onthouden. Dit wordt
            opgeslagen in het geheugen en de kennisbank.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            Agent
          </label>
          <select
            value={agentId}
            onChange={(e) => setAgentId(e.target.value)}
            className={inputClass}
          >
            {allAgents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} — {a.role}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            Type document
          </label>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as AgentKnowledgeKind)}
            className={inputClass}
          >
            {KIND_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {KIND_LABELS[opt.id]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="text-xs text-zinc-500">
        {KIND_OPTIONS.find((k) => k.id === kind)?.hint}
      </p>

      <div>
        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
          Titel (optioneel)
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Bijv. Offerte-opvolging na 5 dagen"
          className={inputClass}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
          Inhoud
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={5}
          placeholder="Beschrijf wat de agent moet weten, onthouden of doen…"
          className={`${inputClass} resize-y min-h-[120px]`}
        />
      </div>

      {(message || error) && (
        <p
          className={`text-sm ${error ? "text-rose-400" : "text-emerald-400"}`}
          role="alert"
        >
          {error ?? message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || !content.trim()}
        className="inline-flex items-center gap-2 rounded-full bg-violet-500 px-4 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:bg-violet-400 disabled:opacity-50"
      >
        {pending ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <BookOpen size={14} />
        )}
        Document opslaan
      </button>
    </form>
  );
}
