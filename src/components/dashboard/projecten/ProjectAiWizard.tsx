"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Bot, Loader2, Send, X } from "lucide-react";
import { createProject } from "@/app/dashboard/offertes/projecten/actions";
import {
  PROJECT_STATUS_META,
  type ProjectStatus,
} from "@/components/dashboard/projecten/projecten";

type Step =
  | "naam"
  | "klant"
  | "start"
  | "eind"
  | "status"
  | "review";

type ChatMsg = {
  id: string;
  role: "agent" | "user";
  text: string;
};

const fieldClass =
  "h-11 w-full rounded-lg border border-white/10 bg-zinc-900/80 px-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/20";

const subscribeToClient = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

function formatPlanningLabel(start: string, end: string) {
  const fmt = (iso: string) => {
    if (!iso) return "";
    return new Intl.DateTimeFormat("nl-BE", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(`${iso}T12:00:00`));
  };
  const s = fmt(start);
  const e = fmt(end);
  if (s && e) return `${s} – ${e}`;
  return s || e || "";
}

function statusLabel(status: ProjectStatus) {
  return PROJECT_STATUS_META[status].label;
}

function nextId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export default function ProjectAiWizard({
  open,
  onOpenChange,
  agentName = "Lara",
  returnFocusRef,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agentName?: string;
  returnFocusRef?: RefObject<HTMLButtonElement | null>;
}) {
  const router = useRouter();
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState<Step>("naam");
  const [messages, setMessages] = useState<ChatMsg[]>(() => [
    {
      id: nextId(),
      role: "agent",
      text: `Hoi, ik ben ${agentName}. Ik help je een project aan te maken. Wat is de projectnaam?`,
    },
  ]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [answers, setAnswers] = useState({
    naam: "",
    klant_naam: "",
    start_datum: "",
    eind_datum: "",
    status: "gepland" as ProjectStatus,
  });
  const mounted = useSyncExternalStore(
    subscribeToClient,
    clientSnapshot,
    serverSnapshot,
  );

  function close() {
    if (pending) return;
    onOpenChange(false);
    queueMicrotask(() => returnFocusRef?.current?.focus());
  }

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => inputRef.current?.focus(), 40);
    return () => {
      document.body.style.overflow = prev;
      window.clearTimeout(t);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !pending) {
        e.preventDefault();
        onOpenChange(false);
        queueMicrotask(() => returnFocusRef?.current?.focus());
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange, pending, returnFocusRef]);

  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, step]);

  function pushAgent(text: string) {
    setMessages((prev) => [...prev, { id: nextId(), role: "agent", text }]);
  }

  function pushUser(text: string) {
    setMessages((prev) => [...prev, { id: nextId(), role: "user", text }]);
  }

  function askNext(after: Step, nextAnswers: typeof answers) {
    if (after === "naam") {
      setStep("klant");
      pushAgent("Voor welke klant is dit project?");
      return;
    }
    if (after === "klant") {
      setStep("start");
      pushAgent("Wanneer start het project? Kies een startdatum.");
      return;
    }
    if (after === "start") {
      setStep("eind");
      pushAgent(
        "Heb je al een einddatum? Vul die in, of sla over als je dat nog niet weet.",
      );
      return;
    }
    if (after === "eind") {
      setStep("status");
      pushAgent("Welke status past nu het best?");
      return;
    }
    if (after === "status") {
      setStep("review");
      const planning = formatPlanningLabel(
        nextAnswers.start_datum,
        nextAnswers.eind_datum,
      );
      pushAgent(
        [
          "Dit stel ik voor:",
          `• Project: ${nextAnswers.naam}`,
          `• Klant: ${nextAnswers.klant_naam}`,
          `• Planning: ${planning || "nog niet gezet"}`,
          `• Status: ${statusLabel(nextAnswers.status)}`,
          "",
          "Klopt dit? Bevestig om het project aan te maken — ik voer niets uit zonder jouw akkoord.",
        ].join("\n"),
      );
    }
  }

  function submitText() {
    const value = draft.trim();
    setError(null);

    if (step === "naam") {
      if (!value) {
        setError("Geef een projectnaam.");
        return;
      }
      pushUser(value);
      const next = { ...answers, naam: value };
      setAnswers(next);
      setDraft("");
      askNext("naam", next);
      return;
    }

    if (step === "klant") {
      if (!value) {
        setError("Geef een klantnaam.");
        return;
      }
      pushUser(value);
      const next = { ...answers, klant_naam: value };
      setAnswers(next);
      setDraft("");
      askNext("klant", next);
      return;
    }

    if (step === "start") {
      if (!value) {
        setError("Kies een startdatum, of typ een label zoals ‘Mrt 2026’.");
        return;
      }
      // date input gives ISO; free text also allowed via draft when type=text fallback
      pushUser(value);
      const next = { ...answers, start_datum: value };
      setAnswers(next);
      setDraft("");
      askNext("start", next);
    }
  }

  function submitStartDate(iso: string) {
    if (!iso) {
      setError("Kies een startdatum.");
      return;
    }
    setError(null);
    const label = formatPlanningLabel(iso, "");
    pushUser(label || iso);
    const next = { ...answers, start_datum: iso };
    setAnswers(next);
    setDraft("");
    askNext("start", next);
  }

  function submitEndDate(iso: string | null) {
    setError(null);
    if (!iso) {
      pushUser("Geen einddatum");
      const next = { ...answers, eind_datum: "" };
      setAnswers(next);
      askNext("eind", next);
      return;
    }
    pushUser(formatPlanningLabel(iso, "") || iso);
    const next = { ...answers, eind_datum: iso };
    setAnswers(next);
    askNext("eind", next);
  }

  function submitStatus(status: ProjectStatus) {
    setError(null);
    pushUser(statusLabel(status));
    const next = { ...answers, status };
    setAnswers(next);
    askNext("status", next);
  }

  function confirmCreate() {
    startTransition(async () => {
      setError(null);
      const planning = formatPlanningLabel(
        answers.start_datum,
        answers.eind_datum,
      );
      const result = await createProject({
        naam: answers.naam,
        klant_naam: answers.klant_naam,
        start_datum_label: planning || answers.start_datum || undefined,
        status: answers.status,
      });
      if ("error" in result && result.error) {
        setError(result.error);
        pushAgent(`Dat lukte niet: ${result.error}. Pas de gegevens aan of probeer opnieuw.`);
        return;
      }
      pushAgent("Project aangemaakt. Je ziet het meteen in de lijst.");
      onOpenChange(false);
      router.refresh();
      queueMicrotask(() => returnFocusRef?.current?.focus());
    });
  }

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Sluiten"
        className="absolute inset-0 bg-black/70"
        disabled={pending}
        onClick={() => {
          if (!pending) close();
        }}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex max-h-[100dvh] w-full max-w-[640px] flex-col rounded-t-2xl border border-white/[0.08] bg-zinc-950 shadow-2xl sm:max-h-[calc(100vh-48px)] sm:rounded-xl"
      >
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-white/[0.08] px-5 py-4">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-500/15 text-violet-300">
              <Bot size={18} />
            </span>
            <div className="min-w-0">
              <h2 id={titleId} className="text-lg font-semibold text-zinc-50">
                Nieuw project met AI
              </h2>
              <p className="mt-0.5 text-sm text-zinc-400">
                {agentName} stelt vragen — jij bevestigt vóór aanmaken.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={close}
            disabled={pending}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-100 disabled:opacity-45"
            aria-label="Sluiten"
          >
            <X size={18} />
          </button>
        </header>

        <div
          ref={listRef}
          className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4"
        >
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[90%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "rounded-br-md bg-sky-500 text-zinc-950"
                    : "rounded-bl-md border border-white/[0.08] bg-zinc-900 text-zinc-200"
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
        </div>

        {error && (
          <p className="px-5 pb-2 text-sm text-rose-400" role="alert">
            {error}
          </p>
        )}

        <footer className="shrink-0 border-t border-white/[0.08] bg-zinc-950 px-5 py-4">
          {step === "naam" || step === "klant" ? (
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                submitText();
              }}
            >
              <input
                ref={inputRef}
                className={fieldClass}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={
                  step === "naam"
                    ? "bv. Renovatie Peeters"
                    : "bv. Renovatie Peeters BV"
                }
                disabled={pending}
              />
              <button
                type="submit"
                disabled={pending || !draft.trim()}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-sky-500 text-zinc-950 hover:bg-sky-400 disabled:opacity-45"
                aria-label="Antwoord versturen"
              >
                <Send size={16} />
              </button>
            </form>
          ) : null}

          {step === "start" && (
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                ref={inputRef}
                type="date"
                className={fieldClass}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                disabled={pending}
              />
              <button
                type="button"
                disabled={pending || !draft}
                onClick={() => submitStartDate(draft)}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-sky-500 px-4 text-sm font-semibold text-zinc-950 hover:bg-sky-400 disabled:opacity-45"
              >
                Volgende
              </button>
            </div>
          )}

          {step === "eind" && (
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="date"
                className={fieldClass}
                value={draft}
                min={answers.start_datum || undefined}
                onChange={(e) => setDraft(e.target.value)}
                disabled={pending}
              />
              <button
                type="button"
                disabled={pending}
                onClick={() => submitEndDate(null)}
                className="inline-flex h-11 items-center justify-center rounded-lg border border-white/10 px-4 text-sm text-zinc-200 hover:bg-white/[0.06]"
              >
                Overslaan
              </button>
              <button
                type="button"
                disabled={pending || !draft}
                onClick={() => submitEndDate(draft)}
                className="inline-flex h-11 items-center justify-center rounded-lg bg-sky-500 px-4 text-sm font-semibold text-zinc-950 hover:bg-sky-400 disabled:opacity-45"
              >
                Volgende
              </button>
            </div>
          )}

          {step === "status" && (
            <div className="flex flex-wrap gap-2">
              {(Object.keys(PROJECT_STATUS_META) as ProjectStatus[]).map(
                (key) => (
                  <button
                    key={key}
                    type="button"
                    disabled={pending}
                    onClick={() => submitStatus(key)}
                    className="inline-flex h-11 items-center rounded-lg border border-white/10 bg-zinc-900 px-3 text-sm text-zinc-200 hover:border-sky-500/40 hover:bg-sky-500/10"
                  >
                    {statusLabel(key)}
                  </button>
                ),
              )}
            </div>
          )}

          {step === "review" && (
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={pending}
                onClick={close}
                className="inline-flex h-11 items-center justify-center rounded-lg border border-white/10 px-4 text-sm text-zinc-200 hover:bg-white/[0.06] disabled:opacity-45"
              >
                Annuleren
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={confirmCreate}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-sky-500 px-5 text-sm font-semibold text-zinc-950 hover:bg-sky-400 disabled:opacity-45"
              >
                {pending ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Project wordt aangemaakt…
                  </>
                ) : (
                  "Bevestigen en aanmaken"
                )}
              </button>
            </div>
          )}
        </footer>
      </div>
    </div>,
    document.body,
  );
}
