"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import {
  BookOpen,
  BrainCircuit,
  FileUp,
  Loader2,
  ScrollText,
} from "lucide-react";
import {
  fetchAgentDocuments,
  saveAgentKnowledgeDoc,
} from "@/app/dashboard/geheugen/actions";
import {
  KIND_LABELS,
  type AgentDocumentRow,
  type AgentKnowledgeKind,
  type AgentMandateSections,
} from "@/lib/agents/agent-knowledge";
import type { CustomAgent } from "@/components/dashboard/agents/config";

const inputClass =
  "w-full rounded-xl border border-white/[0.08] bg-zinc-950/60 px-3.5 py-2.5 text-sm text-zinc-100 outline-none transition-all placeholder:text-zinc-600 focus:border-orange-500/40 focus:ring-2 focus:ring-orange-500/10";

const sectionClass = `${inputClass} resize-y min-h-[88px]`;

const EMPTY_MANDATE: AgentMandateSections = {
  mustDo: "",
  mayDo: "",
  mustNot: "",
  boundaries: "",
  examples: "",
};

const MANDATE_FIELDS: {
  key: keyof AgentMandateSections;
  label: string;
  placeholder: string;
}[] = [
  {
    key: "mustDo",
    label: "Wat MOET deze agent doen?",
    placeholder:
      "Verplichte taken, deadlines, opvolgstappen, communicatiestijl…",
  },
  {
    key: "mayDo",
    label: "Wat MAG deze agent doen?",
    placeholder:
      "Toegestane acties, kan zelfstandig versturen, mag bellen/mailen…",
  },
  {
    key: "mustNot",
    label: "Wat mag deze agent NIET doen?",
    placeholder:
      "Verboden acties, geen prijzen wijzigen zonder goedkeuring, geen…",
  },
  {
    key: "boundaries",
    label: "Grenzen & escalatie",
    placeholder:
      "Wanneer moet de agent stoppen en jou inschakelen? Drempelbedragen…",
  },
  {
    key: "examples",
    label: "Voorbeelden & situaties",
    placeholder:
      "Concrete scenario's: 'Als offerte 5 dagen openstaat → stuur herinnering.'",
  },
];

const FREE_KIND_OPTIONS: {
  id: AgentKnowledgeKind;
  hint: string;
}[] = [
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
  readOnly?: boolean;
  onSaved?: () => void;
};

export default function AgentKnowledgeForm({
  companyAgents,
  defaultAgentId,
  readOnly = false,
  onSaved,
}: Props) {
  const agents = companyAgents.filter((a) => a.enabled);

  const [agentId, setAgentId] = useState(
    defaultAgentId ?? agents[0]?.id ?? "",
  );
  const [docMode, setDocMode] = useState<"mandate" | "free">("mandate");
  const [kind, setKind] = useState<AgentKnowledgeKind>("instruction");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mandate, setMandate] = useState<AgentMandateSections>(EMPTY_MANDATE);
  const [documents, setDocuments] = useState<AgentDocumentRow[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [loadingDocs, setLoadingDocs] = useState(false);

  const selected = agents.find((a) => a.id === agentId);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (defaultAgentId) setAgentId(defaultAgentId);
  }, [defaultAgentId]);

  const loadDocuments = useCallback(async (id: string) => {
    if (!id) {
      setDocuments([]);
      return;
    }
    setLoadingDocs(true);
    const result = await fetchAgentDocuments(id);
    setLoadingDocs(false);
    if ("documents" in result) {
      setDocuments(result.documents);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadDocuments(agentId);
  }, [agentId, loadDocuments]);

  function updateMandate<K extends keyof AgentMandateSections>(
    key: K,
    value: AgentMandateSections[K],
  ) {
    setMandate((prev) => ({ ...prev, [key]: value }));
  }

  function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "").trim();
      if (!text) return;

      if (docMode === "mandate") {
        setMandate((prev) => ({ ...prev, mustDo: text }));
        setTitle((t) => t || file.name.replace(/\.[^.]+$/, ""));
      } else {
        setContent(text);
        setTitle((t) => t || file.name.replace(/\.[^.]+$/, ""));
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (readOnly) return;
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
        kind: docMode === "mandate" ? "instruction" : kind,
        title: title || undefined,
        docMode,
        content: docMode === "free" ? content : undefined,
        mandate: docMode === "mandate" ? mandate : undefined,
      });

      if ("error" in result && result.error) {
        setError(result.error);
        return;
      }

      if (docMode === "mandate") {
        setMandate(EMPTY_MANDATE);
      } else {
        setContent("");
      }
      setTitle("");
      setMessage(
        docMode === "mandate"
          ? `Mandaat opgeslagen voor ${selected.name}. De agent volgt dit bij elk gesprek.`
          : `Document opgeslagen voor ${selected.name}.`,
      );
      await loadDocuments(selected.id);
      onSaved?.();
    });
  }

  const mandateFilled = Object.values(mandate).some((v) => v.trim().length > 0);
  const canSubmit =
    !readOnly &&
    selected &&
    (docMode === "mandate" ? mandateFilled : content.trim().length > 0);

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-500/10 text-violet-400">
          <BrainCircuit size={18} />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-zinc-100">
            Agent-documenten
          </h3>
          <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">
            Leg vast wat een agent mag, moet en niet mag doen. Dit wordt
            opgeslagen in het geheugen en gebruikt bij elk gesprek.
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
            disabled={readOnly}
          >
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} — {a.role}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            Documenttype
          </label>
          <select
            value={docMode}
            onChange={(e) => setDocMode(e.target.value as "mandate" | "free")}
            className={inputClass}
            disabled={readOnly}
          >
            <option value="mandate">Volledig mandaat (mag & moet)</option>
            <option value="free">Vrij document</option>
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
          Titel (optioneel)
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={
            docMode === "mandate"
              ? "Bijv. Mandaat offerte-opvolging"
              : "Bijv. Prijslijst sanitair 2026"
          }
          className={inputClass}
          disabled={readOnly}
        />
      </div>

      {!readOnly && (
        <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-white/10 bg-zinc-950/40 px-3 py-2.5 text-xs text-zinc-400 transition-colors hover:border-violet-500/30 hover:text-zinc-300">
          <FileUp size={14} className="shrink-0 text-violet-400" />
          <span>Upload .txt of .md — inhoud wordt ingevuld</span>
          <input
            type="file"
            accept=".txt,.md,.markdown,text/plain"
            className="sr-only"
            onChange={handleFileUpload}
          />
        </label>
      )}

      {docMode === "mandate" ? (
        <div className="space-y-2.5 rounded-xl border border-white/[0.06] bg-zinc-950/40 p-3">
          <p className="text-xs text-zinc-500">
            Vul de secties in die relevant zijn. Hoe gedetailleerder, hoe
            betrouwbaarder de agent handelt.
          </p>
          {MANDATE_FIELDS.map((field) => (
            <div key={field.key}>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                {field.label}
              </label>
              <textarea
                value={mandate[field.key]}
                onChange={(e) => updateMandate(field.key, e.target.value)}
                rows={2}
                placeholder={field.placeholder}
                className={sectionClass}
                disabled={readOnly}
              />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              Categorie
            </label>
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as AgentKnowledgeKind)}
              className={inputClass}
              disabled={readOnly}
            >
              {FREE_KIND_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {KIND_LABELS[opt.id]}
                </option>
              ))}
            </select>
          </div>
          <p className="text-xs text-zinc-500">
            {FREE_KIND_OPTIONS.find((k) => k.id === kind)?.hint}
          </p>
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              Inhoud
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              placeholder="Beschrijf wat de agent moet weten, onthouden of doen…"
              className={`${inputClass} min-h-[140px] resize-y`}
              disabled={readOnly}
            />
          </div>
        </>
      )}

      {(message || error) && (
        <p
          className={`text-sm ${error ? "text-rose-400" : "text-emerald-400"}`}
          role="alert"
        >
          {error ?? message}
        </p>
      )}

      {!readOnly && (
        <button
          type="submit"
          disabled={pending || !canSubmit}
          className="inline-flex items-center gap-2 rounded-full bg-violet-500 px-4 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:bg-violet-400 disabled:opacity-50"
        >
          {pending ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <BookOpen size={14} />
          )}
          {docMode === "mandate" ? "Mandaat opslaan" : "Document opslaan"}
        </button>
      )}

      <div className="border-t border-white/[0.06] pt-3">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
          <ScrollText size={13} />
          Opgeslagen documenten
          {selected ? ` — ${selected.name}` : ""}
        </div>
        {loadingDocs ? (
          <p className="text-xs text-zinc-600">Laden…</p>
        ) : documents.length === 0 ? (
          <p className="text-xs text-zinc-600">
            Nog geen documenten voor deze agent.
          </p>
        ) : (
          <ul className="max-h-36 space-y-2 overflow-y-auto pr-1">
            {documents.map((doc) => (
              <li
                key={doc.id}
                className="rounded-lg border border-white/[0.06] bg-zinc-950/50 px-3 py-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium text-zinc-200">
                    {doc.title}
                  </p>
                  <span className="shrink-0 rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-zinc-500">
                    {doc.docMode === "mandate" ? "Mandaat" : doc.kindLabel}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-zinc-500">
                  {doc.contentPreview}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </form>
  );
}
