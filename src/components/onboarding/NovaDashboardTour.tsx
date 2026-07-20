"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { usePathname, useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { useDutchSpeech } from "@/hooks/useDutchSpeech";
import NovaVoiceAsk from "@/components/speech/NovaVoiceAsk";
import { useAgentChat } from "@/components/dashboard/agent-chat/AgentChatProvider";
import {
  DASHBOARD_INTENT_GREETING,
  DASHBOARD_TOURS,
} from "@/lib/onboarding/dashboard-tours";
import {
  INTENT_OPTIONS,
  isTourIntent,
  type TourIntent,
  type TourStep,
} from "@/lib/onboarding/tour-intents";
import {
  getOnboardingProfile,
  isDashboardTourDone,
  markDashboardTourDone,
  resetDashboardTour,
} from "@/lib/onboarding/storage";
import { useDashboardTour } from "@/components/onboarding/DashboardTourProvider";

type Phase = "intent" | "tour";

type SpotlightRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

export default function NovaDashboardTour() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const forceTour = searchParams.get("tour") === "1";
  const { showTour, isReplay, startTour, dismissTour } = useDashboardTour();
  const { enabled: speechOn, speak, stop, toggle: toggleSpeech } = useDutchSpeech();
  const { open, sendMessage } = useAgentChat();

  const askNova = useCallback(
    (question: string) => {
      open();
      sendMessage(question);
    },
    [open, sendMessage],
  );

  const [phase, setPhase] = useState<Phase>("intent");
  const [intent, setIntent] = useState<TourIntent | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [spotlight, setSpotlight] = useState<SpotlightRect | null>(null);
  const autoStartedRef = useRef(false);
  const tourInitRef = useRef(false);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const isCommandCenter = pathname === "/dashboard/command-center";
  const steps: TourStep[] = intent ? DASHBOARD_TOURS[intent] : [];
  const currentStep = steps[stepIndex];

  const updateSpotlight = useCallback((selector?: string) => {
    if (!selector) {
      setSpotlight(null);
      return;
    }
    const el = document.querySelector(selector);
    if (!el) {
      setSpotlight(null);
      return;
    }
    const rect = el.getBoundingClientRect();
    const pad = 10;
    setSpotlight({
      top: rect.top - pad,
      left: rect.left - pad,
      width: rect.width + pad * 2,
      height: rect.height + pad * 2,
    });
  }, []);

  const scrollToTarget = useCallback((step: TourStep) => {
    if (!step.target) return;
    document.querySelector(step.target)?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, []);

  const finishTour = useCallback(() => {
    stop();
    markDashboardTourDone();
    dismissTour();
  }, [stop, dismissTour]);

  const beginTour = useCallback(
    (selected: TourIntent) => {
      setIntent(selected);
      setStepIndex(0);
      setPhase("tour");
      const step = DASHBOARD_TOURS[selected][0];
      if (step) {
        scrollToTarget(step);
        window.setTimeout(() => updateSpotlight(step.target), 350);
        speak(
          `${DASHBOARD_INTENT_GREETING[selected]} ${step.title}. ${step.text}`,
        );
      }
    },
    [speak, scrollToTarget, updateSpotlight],
  );

  const showIntentPhase = useCallback(() => {
    setPhase("intent");
    setIntent(null);
    setStepIndex(0);
    setSpotlight(null);
    stop();
    window.setTimeout(
      () =>
        speak(
          "Welkom in je Command Center! Waar wil je mee beginnen? Ik geef je een rondleiding.",
        ),
      300,
    );
  }, [speak, stop]);

  const goToStep = useCallback(
    (index: number) => {
      if (!intent) return;
      const step = DASHBOARD_TOURS[intent][index];
      if (!step) return;
      setStepIndex(index);
      scrollToTarget(step);
      window.setTimeout(() => updateSpotlight(step.target), 350);
      speak(`${step.title}. ${step.text}`);
    },
    [intent, scrollToTarget, updateSpotlight, speak],
  );

  const nextStep = useCallback(() => {
    if (!intent) return;
    if (stepIndex + 1 >= DASHBOARD_TOURS[intent].length) {
      finishTour();
      return;
    }
    goToStep(stepIndex + 1);
  }, [intent, stepIndex, goToStep, finishTour]);

  const prevStep = useCallback(() => {
    if (stepIndex > 0) goToStep(stepIndex - 1);
  }, [stepIndex, goToStep]);

  // Auto-start on first visit (or after registratie met ?tour=1)
  useEffect(() => {
    if (!mounted || !isCommandCenter || autoStartedRef.current) return;

    if (forceTour) {
      resetDashboardTour();
    }

    if (isDashboardTourDone() && !forceTour) return;

    autoStartedRef.current = true;
    startTour();
  }, [mounted, isCommandCenter, forceTour, startTour]);

  // Initialiseer tour één keer per open-sessie
  useEffect(() => {
    if (!showTour) {
      tourInitRef.current = false;
      return;
    }
    if (tourInitRef.current) return;
    tourInitRef.current = true;

    queueMicrotask(() => {
      if (isReplay) {
        showIntentPhase();
        return;
      }

      const profile = getOnboardingProfile();
      const rawIntent = profile.doel ?? profile.intent;
      const knownIntent = isTourIntent(rawIntent) ? rawIntent : undefined;

      if (knownIntent) {
        beginTour(knownIntent);
        return;
      }

      showIntentPhase();
    });
  }, [showTour, isReplay, beginTour, showIntentPhase]);

  useEffect(() => {
    if (phase !== "tour" || !currentStep?.target) return;
    const refresh = () => updateSpotlight(currentStep.target);
    refresh();
    window.addEventListener("resize", refresh);
    window.addEventListener("scroll", refresh, { passive: true });
    return () => {
      window.removeEventListener("resize", refresh);
      window.removeEventListener("scroll", refresh);
    };
  }, [phase, currentStep, updateSpotlight]);

  if (!mounted || !showTour || !isCommandCenter) return null;

  const content = (
    <>
      {phase === "tour" && spotlight && (
        <div className="pointer-events-none fixed inset-0 z-[75]" aria-hidden>
          <div
            className="absolute rounded-xl ring-2 ring-orange-400/80 transition-all duration-300"
            style={{
              top: spotlight.top,
              left: spotlight.left,
              width: spotlight.width,
              height: spotlight.height,
              boxShadow: "0 0 0 9999px rgba(3, 6, 12, 0.75)",
            }}
          />
        </div>
      )}

      <div
        className="fixed bottom-[calc(5.75rem+env(safe-area-inset-bottom))] left-4 right-4 z-[85] max-h-[calc(100dvh-7rem-env(safe-area-inset-bottom))] overflow-y-auto rounded-2xl border border-white/10 bg-zinc-950/95 shadow-2xl backdrop-blur-xl sm:bottom-6 sm:left-auto sm:right-6 sm:w-[min(100vw-2rem,24rem)] sm:max-h-[calc(100dvh-3rem)]"
        role="dialog"
        aria-label="Ela rondleiding"
      >
        <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-sky-400 to-indigo-500 text-sm font-bold text-white">
            N
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-zinc-50">Ela</p>
            <p className="text-xs text-zinc-500">Rondleiding Command Center</p>
          </div>
          <button
            type="button"
            onClick={toggleSpeech}
            aria-label={speechOn ? "Spraak uitzetten" : "Spraak aanzetten"}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-200"
          >
            {speechOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
          <button
            type="button"
            onClick={finishTour}
            aria-label="Rondleiding sluiten"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-200"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-4 py-4">
          {phase === "intent" && (
            <>
              <p className="text-sm leading-relaxed text-zinc-300">
                Waar wil je mee beginnen? Ik leg uit wat alles doet in je Command
                Center.
              </p>
              <div className="mt-4 grid gap-2">
                {INTENT_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => beginTour(opt.id)}
                    className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-left text-sm text-zinc-200 transition-colors hover:border-orange-500/40 hover:bg-orange-500/10"
                  >
                    <span aria-hidden>{opt.emoji}</span>
                    {opt.label}
                  </button>
                ))}
              </div>
              <NovaVoiceAsk variant="orange" onAskChat={askNova} />
            </>
          )}

          {phase === "tour" && currentStep && intent && (
            <>
              <div className="mb-3 flex items-center gap-1.5">
                {steps.map((s, i) => (
                  <span
                    key={s.id}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      i <= stepIndex ? "bg-orange-500" : "bg-white/10"
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs font-medium uppercase tracking-wide text-orange-400">
                Stap {stepIndex + 1} van {steps.length}
              </p>
              <h3 className="mt-1 text-base font-semibold text-zinc-50">
                {currentStep.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                {currentStep.text}
              </p>

              <NovaVoiceAsk
                variant="orange"
                stepTitle={currentStep.title}
                stepText={currentStep.text}
                onAskChat={askNova}
              />

              <div className="mt-4 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={stepIndex === 0}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-zinc-400 transition-colors hover:text-zinc-200 disabled:opacity-30"
                >
                  <ChevronLeft size={16} />
                  Terug
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  className="inline-flex items-center gap-1.5 rounded-full bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-400"
                >
                  {stepIndex + 1 >= steps.length ? "Klaar" : "Volgende"}
                  <ChevronRight size={16} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );

  return createPortal(content, document.body);
}
