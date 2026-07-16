"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  loadCompanyAgents,
  saveCompanyAgents,
} from "@/components/dashboard/agents/storage";
import {
  DEFAULT_AGENTS,
  type CustomAgent,
} from "@/components/dashboard/agents/config";
import {
  customAgentToChatAgent,
  chatAgentFromId,
} from "@/components/dashboard/agent-chat/agents";
import { DEFAULT_BUILTIN_AVATARS, defaultAvatarUrl } from "@/lib/agents/avatar-options";
import { DEFAULT_AGENT_NAME, normalizeAgentName } from "@/lib/agents/userAi";
import { sendAgentChatMessage } from "@/app/dashboard/agent-chat/actions";
import { rememberChatInsight } from "@/app/dashboard/geheugen/actions";
import {
  detectNavigationIntent,
  detectQuickAction,
} from "@/components/dashboard/agent-navigation/routes";
import { useAgentNavigation } from "@/components/dashboard/agent-navigation/AgentNavigationProvider";
import { dispatchOpenControlCenter } from "@/components/dashboard/DashboardSidePanel";

export type AgentChatMessage = {
  id: string;
  role: "user" | "agent";
  text: string;
  time: string;
  options?: string[];
};

export type AgentChatView = "open" | "minimized" | "closed";

export type ChatAgent = {
  id: string;
  name: string;
  role: string;
  gradient: string;
  avatarUrl?: string | null;
  instructies?: string;
};

export const NOVA_AGENT: ChatAgent = {
  id: "nova",
  name: DEFAULT_AGENT_NAME,
  role: "AI-metgezel",
  gradient: "from-sky-400 to-indigo-500",
  avatarUrl: DEFAULT_BUILTIN_AVATARS.nova,
};

type AgentChatContextValue = {
  view: AgentChatView;
  open: () => void;
  openWith: (agent: ChatAgent) => void;
  minimize: () => void;
  close: () => void;
  toggle: () => void;
  activeAgent: ChatAgent;
  availableAgents: ChatAgent[];
  syncCompanyAgents: (agents: CustomAgent[]) => void;
  position: { x: number; y: number };
  setPosition: (position: { x: number; y: number }) => void;
  messages: AgentChatMessage[];
  sendMessage: (text: string) => void;
  isTyping: boolean;
  hasUnread: boolean;
  clearUnread: () => void;
  pushAgentAlert: (input: {
    agentName: string;
    text: string;
    options?: string[];
    openChat?: boolean;
  }) => void;
};

const AgentChatContext = createContext<AgentChatContextValue | null>(null);

const STORAGE_VIEW_KEY = "archon.agent-chat.view";
const STORAGE_POSITION_KEY = "archon.agent-chat.position";
const FALLBACK_HINT_KEY = "archon.agent-chat.fallback-hint";

function starterFor(agent: ChatAgent): AgentChatMessage[] {
  const intros: Record<string, string> = {
    nova: `Ik ben ${agent.name}, je AI-metgezel. Vraag me om offertes, facturen of opvolging — ik zet acties klaar ter goedkeuring. Via het AI Control Center zie je live agent-status en recente acties.`,
    schatter:
      "Ik ben Schatter en regel je offertes. Geef me een taak — bijvoorbeeld een offerte opstellen of een verzonden offerte opvolgen.",
    facturatie:
      "Ik ben Facturatie. Ik maak facturen aan, verstuur via Peppol en regel betalingsherinneringen. Wat mag ik voor je klaarzetten?",
    opvolger:
      "Ik ben Opvolger en houd je leads warm. Vertel me welke lead of klant ik moet opvolgen.",
  };

  const optionsMap: Record<string, string[]> = {
    nova: ["🤖 Maak nieuwe AI-agent", "📄 Verstuur een offerte", "📊 Toon AI Control Center", "💡 Ben ik iets vergeten?"],
    schatter: ["✍️ Nieuwe offerte opstellen", "📈 Verzonden offerte opvolgen"],
    facturatie: ["✉️ Betalingsherinnering klaarzetten", "💰 Facturen controleren"],
    opvolger: ["📞 Nieuwe leads opvolgen", "🤝 Lead status bekijken"],
  };

  const customIntro = agent.instructies?.trim()
    ? `Ik ben **${agent.name}**, je ${agent.role}. ${agent.instructies.trim()} Geef me een taak of stel een vraag — ik zet acties klaar ter goedkeuring.`
    : `Ik ben ${agent.name} (${agent.role}). Geef me een taak of stel een vraag — ik zet acties klaar ter goedkeuring.`;

  return [
    {
      id: `welcome-${agent.id}`,
      role: "agent",
      text: intros[agent.id] ?? customIntro,
      time: "Nu",
      options: optionsMap[agent.id] ?? [
        "Geef me een taak",
        "Wat kan jij voor me doen?",
        "Bekijk goedkeuringen",
      ],
    },
  ];
}

function replyFor(agent: ChatAgent, input: string): { text: string; options?: string[] } {
  const q = input.toLowerCase();
  if (agent.id === "schatter") {
    if (q.includes("nieuw") || q.includes("opstel") || q.includes("maak")) {
      return {
        text: "Ik open **Nieuwe offerte** — daar vul ik de regels alvast voor je in op basis van je geheugen en laatste projecten.",
        options: ["Open nieuwe offerte", "Bekijk offertelijst"],
      };
    }
    return {
      text: "Ik zie je verzonden offertes. Wil je dat ik een vriendelijke opvolging klaarzet voor de oudste openstaande offerte?",
      options: ["Ja, stel opvolging op", "Nee, sla over"],
    };
  }
  if (agent.id === "facturatie") {
    if (q.includes("herinner") || q.includes("betaal")) {
      return {
        text: "Ik zet een nette betalingsherinnering klaar voor de openstaande facturen — jij keurt goed met één klik.",
        options: ["Ja, herinnering klaarzetten", "Nee, niet nu"],
      };
    }
    return {
      text: "Begrepen. Ik controleer je openstaande facturen en zet de volgende actie klaar in Automatisaties.",
    };
  }
  if (agent.id === "opvolger") {
    return {
      text: "Ik pak de nieuwste leads op en bereid een opvolgbericht voor op basis van je standaardtekst. Je vindt het voorstel zo in Automatisaties.",
    };
  }
  if (q.includes("offerte")) {
    return {
      text: "Ik zie offertes die opvolging nodig hebben. Wil je dat ik een vriendelijke herinnering voorstel, of geef ik dit door aan Schatter?",
      options: ["Laat Schatter opvolgen", "Stel een herinnering op"],
    };
  }
  if (q.includes("factuur") || q.includes("betaal")) {
    return {
      text: "Ik kan een nette betalingsherinnering klaarzetten — jij keurt goed met één klik. Zal ik dit aan Facturatie doorgeven?",
      options: ["Ja, geef door aan Facturatie", "Nee, laat maar"],
    };
  }
  if (q.includes("lead")) {
    return {
      text: "Zal ik Opvolger een WhatsApp-opvolging laten voorbereiden op basis van je standaardtekst?",
      options: ["Ja, laat Opvolger opvolgen", "Nee, bedankt"],
    };
  }
  return {
    text: `Begrepen. Ik (${agent.name}) kijk even in je pipeline en zet de volgende beste actie klaar ter goedkeuring.`,
  };
}

function isAgentChatView(value: unknown): value is AgentChatView {
  return value === "open" || value === "minimized" || value === "closed";
}

function readStoredView(): AgentChatView {
  if (typeof window === "undefined") return "minimized";
  try {
    const stored = sessionStorage.getItem(STORAGE_VIEW_KEY);
    return isAgentChatView(stored) ? stored : "minimized";
  } catch {
    return "minimized";
  }
}

function readStoredPosition(): { x: number; y: number } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_POSITION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { x?: number; y?: number };
    if (typeof parsed.x === "number" && typeof parsed.y === "number") {
      return { x: parsed.x, y: parsed.y };
    }
    return null;
  } catch {
    return null;
  }
}

export function defaultChatPosition() {
  if (typeof window === "undefined") return { x: 16, y: 72 };
  const width = Math.min(380, window.innerWidth * 0.92);
  const height = Math.min(520, window.innerHeight * 0.7);
  const bottomInset =
    window.innerWidth < 1024
      ? 96 + Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue("env(safe-area-inset-bottom)") || "0")
      : 24;
  return {
    x: Math.max(16, window.innerWidth - width - 16),
    y: Math.max(72, window.innerHeight - height - bottomInset),
  };
}

function clampChatPosition(position: { x: number; y: number }) {
  if (typeof window === "undefined") return position;
  const width = Math.min(380, window.innerWidth * 0.92);
  const height = Math.min(520, window.innerHeight * 0.7);
  const bottomInset = window.innerWidth < 1024 ? 96 : 16;
  const maxX = Math.max(8, window.innerWidth - width - 8);
  const maxY = Math.max(64, window.innerHeight - height - bottomInset);
  return {
    x: Math.min(Math.max(8, position.x), maxX),
    y: Math.min(Math.max(64, position.y), maxY),
  };
}

function novaAgentWithName(name?: string): ChatAgent {
  const display = name?.trim() || NOVA_AGENT.name;
  return { ...NOVA_AGENT, name: display };
}

export function AgentChatProvider({
  children,
  companyId,
  userAgentName = DEFAULT_AGENT_NAME,
  initialCompanyAgents,
}: {
  children: ReactNode;
  companyId: number | null;
  userAgentName?: string;
  initialCompanyAgents?: CustomAgent[];
}) {
  const router = useRouter();
  const { navigateTo } = useAgentNavigation();
  const primaryAgent = useMemo(
    () => novaAgentWithName(userAgentName),
    [userAgentName],
  );
  const [companyAgents, setCompanyAgents] = useState<CustomAgent[]>(
    () => initialCompanyAgents ?? DEFAULT_AGENTS.map((a) => ({ ...a })),
  );
  const availableAgents = useMemo(
    () =>
      companyAgents
        .filter((a) => a.enabled)
        .map((a) =>
          a.id === "nova" ? { ...customAgentToChatAgent(a), name: primaryAgent.name } : customAgentToChatAgent(a),
        ),
    [companyAgents, primaryAgent.name],
  );
  const [view, setView] = useState<AgentChatView>("minimized");
  const [position, setPositionState] = useState({ x: 16, y: 72 });
  const [positionReady, setPositionReady] = useState(false);
  const [activeAgent, setActiveAgent] = useState<ChatAgent>(primaryAgent);
  const [historyByAgent, setHistoryByAgent] = useState<
    Record<string, AgentChatMessage[]>
  >(() => ({ nova: starterFor(primaryAgent) }));
  const [isTyping, setIsTyping] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  // Stateful Dialog Flow
  const [chatState, setChatState] = useState<{
    flow: "create_agent" | "send_quote";
    step: string;
    data: Record<string, string>;
  } | null>(null);

  const messages = historyByAgent[activeAgent.id] ?? starterFor(activeAgent);

  useEffect(() => {
    setActiveAgent((prev) => {
      if (prev.id === "nova") return primaryAgent;
      const refreshed = chatAgentFromId(companyAgents, prev.id, userAgentName);
      return refreshed ?? prev;
    });
    setHistoryByAgent((prev) => {
      const welcome = prev.nova?.[0];
      if (!welcome || welcome.id !== "welcome-nova") return prev;
      return { ...prev, nova: starterFor(primaryAgent) };
    });
  }, [primaryAgent, companyAgents, userAgentName]);

  useEffect(() => {
    if (!initialCompanyAgents?.length) return;
    setCompanyAgents(initialCompanyAgents);
  }, [initialCompanyAgents]);

  const syncCompanyAgents = useCallback((agents: CustomAgent[]) => {
    setCompanyAgents(agents);
  }, []);

  useEffect(() => {
    setView(readStoredView());
    const storedPosition = readStoredPosition();
    setPositionState(
      storedPosition ? clampChatPosition(storedPosition) : defaultChatPosition(),
    );
    setPositionReady(true);
  }, []);

  useEffect(() => {
    if (!positionReady) return;
    try {
      sessionStorage.setItem(STORAGE_VIEW_KEY, view);
    } catch {
      /* negeer */
    }
  }, [view, positionReady]);

  const setPosition = useCallback((next: { x: number; y: number }) => {
    const clamped = clampChatPosition(next);
    setPositionState(clamped);
    try {
      sessionStorage.setItem(STORAGE_POSITION_KEY, JSON.stringify(clamped));
    } catch {
      /* negeer */
    }
  }, []);

  const open = useCallback(() => {
    setView("open");
    setHasUnread(false);
    if (!positionReady) {
      setPosition(defaultChatPosition());
      setPositionReady(true);
    }
  }, [positionReady, setPosition]);

  const openWith = useCallback(
    (agent: ChatAgent) => {
      setActiveAgent(agent);
      setHistoryByAgent((prev) =>
        prev[agent.id] ? prev : { ...prev, [agent.id]: starterFor(agent) },
      );
      setView("open");
      setHasUnread(false);
      if (!positionReady) {
        setPosition(defaultChatPosition());
        setPositionReady(true);
      }
    },
    [positionReady, setPosition],
  );

  const minimize = useCallback(() => {
    setView("minimized");
    setHasUnread(false);
  }, []);

  const close = useCallback(() => {
    setView("closed");
    setHasUnread(false);
  }, []);

  const toggle = useCallback(() => {
    setView((current) => {
      if (current === "open") return "minimized";
      setHasUnread(false);
      if (!positionReady) {
        setPosition(defaultChatPosition());
        setPositionReady(true);
      }
      return "open";
    });
  }, [positionReady, setPosition]);

  const clearUnread = useCallback(() => setHasUnread(false), []);

  const agentFromName = useCallback((name: string): ChatAgent => {
    const n = name.toLowerCase();
    if (n.includes("viktor") || n.includes("offerte")) {
      return {
        id: "schatter",
        name: "Viktor",
        role: "Offertes",
        gradient: "from-violet-400 to-purple-500",
        avatarUrl: DEFAULT_BUILTIN_AVATARS.schatter,
      };
    }
    if (n.includes("factuur") || n.includes("peppol") || n.includes("nina")) {
      return {
        id: "facturatie",
        name: "Nina",
        role: "Peppol",
        gradient: "from-amber-400 to-orange-500",
        avatarUrl: DEFAULT_BUILTIN_AVATARS.facturatie,
      };
    }
    if (n.includes("opvolg") || n.includes("lead")) {
      return {
        id: "opvolger",
        name: "Opvolger",
        role: "Leads",
        gradient: "from-emerald-400 to-teal-500",
        avatarUrl: DEFAULT_BUILTIN_AVATARS.opvolger,
      };
    }
    return {
      ...NOVA_AGENT,
      name: name.trim() || NOVA_AGENT.name,
    };
  }, []);

  const pushAgentAlert = useCallback(
    (input: {
      agentName: string;
      text: string;
      options?: string[];
      openChat?: boolean;
    }) => {
      const agent = agentFromName(input.agentName);
      const alertMessage: AgentChatMessage = {
        id: `alert-${Date.now()}`,
        role: "agent",
        text: input.text,
        time: "Nu",
        options: input.options ?? [
          "Bekijk goedkeuringen",
          "Geef andere instructie",
        ],
      };

      setActiveAgent(agent);
      setHistoryByAgent((prev) => ({
        ...prev,
        [agent.id]: [...(prev[agent.id] ?? starterFor(agent)), alertMessage],
      }));
      setHasUnread(true);

      if (input.openChat) {
        setView("open");
        setHasUnread(false);
      } else {
        setView((current) =>
          current === "closed" ? "minimized" : current,
        );
      }
    },
    [agentFromName],
  );

  const sendMessage = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      const agent = activeAgent;
      const userMessage: AgentChatMessage = {
        id: `u-${Date.now()}`,
        role: "user",
        text: trimmed,
        time: "Nu",
      };

      setHistoryByAgent((prev) => ({
        ...prev,
        [agent.id]: [...(prev[agent.id] ?? starterFor(agent)), userMessage],
      }));
      setIsTyping(true);

      const supabase = createClient();
      const priorMessages = historyByAgent[agent.id] ?? starterFor(agent);

      void (async () => {
        let replyText = "";
        let replyOptions: string[] | undefined = undefined;
        const q = trimmed.toLowerCase();

        try {
          if (companyId && !chatState) {
            const history = [...priorMessages, userMessage]
              .filter((m) => !m.id.startsWith("welcome-"))
              .slice(-10)
              .map((m) => ({
                role: m.role,
                text: m.text,
              }));

            const llm = await sendAgentChatMessage({
              agentId: agent.id,
              history,
              message: trimmed,
            });

            if ("ok" in llm && llm.ok) {
              replyText = llm.text;
              replyOptions = llm.options;
              if (llm.navigateTo) {
                navigateTo(llm.navigateTo, { minimizeChat: true });
              }
              if (llm.openControlCenter) {
                dispatchOpenControlCenter();
              }
              if (llm.remembered) {
                replyText += "\n\n_Ik heb dit opgeslagen in je geheugen._";
              }

              setHistoryByAgent((prev) => ({
                ...prev,
                [agent.id]: [
                  ...(prev[agent.id] ?? starterFor(agent)),
                  {
                    id: `a-${Date.now()}`,
                    role: "agent",
                    text: replyText,
                    time: "Nu",
                    options: replyOptions,
                  },
                ],
              }));
              setView((current) => {
                if (current !== "open") setHasUnread(true);
                return current;
              });
              return;
            }

            if (
              "useFallback" in llm &&
              llm.useFallback &&
              llm.fallbackReason === "no_api_key"
            ) {
              try {
                if (!sessionStorage.getItem(FALLBACK_HINT_KEY)) {
                  sessionStorage.setItem(FALLBACK_HINT_KEY, "1");
                  setHistoryByAgent((prev) => ({
                    ...prev,
                    [agent.id]: [
                      ...(prev[agent.id] ?? starterFor(agent)),
                      {
                        id: `hint-${Date.now()}`,
                        role: "agent",
                        text: "⚠️ **Echte AI is nog niet actief** — `GROQ_API_KEY` ontbreekt in je omgeving (of fallback: `OPENAI_API_KEY`). Ik antwoord met basisfuncties (navigatie, geheugen, goedkeuringen). Voeg de key toe in `.env.local` en herstart de dev-server.",
                        time: "Nu",
                      },
                    ],
                  }));
                }
              } catch {
                /* negeer */
              }
            }

            if (
              "useFallback" in llm &&
              llm.useFallback &&
              llm.fallbackReason === "no_credits"
            ) {
              setHistoryByAgent((prev) => ({
                ...prev,
                [agent.id]: [
                  ...(prev[agent.id] ?? starterFor(agent)),
                  {
                    id: `credits-${Date.now()}`,
                    role: "agent",
                    text:
                      llm.error ??
                      "⚠️ **Onvoldoende AI-tegoed.** Koop extra credits zodra betaling live is, of vraag een admin om tegoed toe te voegen.",
                    time: "Nu",
                  },
                ],
              }));
              setView((current) => {
                if (current !== "open") setHasUnread(true);
                return current;
              });
              return;
            }
          }

          if (
          q.includes("bekijk goedkeuring") ||
          q.includes("goedkeuringen") ||
          q === "goedkeuren" ||
          q.includes("toon automatisaties")
        ) {
          navigateTo("/dashboard/automatisaties", { minimizeChat: true });
          replyText =
            q === "goedkeuren"
              ? "Ik open **Automatisaties** — klik daar op **Goedkeuren** bij het voorstel dat je wilt uitvoeren."
              : "Ik open **Automatisaties** — daar zie je alle voorstellen die op je wachten.";
        } else if (q === "open nieuwe offerte") {
          navigateTo("/dashboard/offertes/nieuw", { minimizeChat: true });
          replyText =
            "Ik open **Nieuwe offerte**. Beschrijf de werken en ik gebruik je geheugen voor realistische prijzen.";
        } else if (q === "bekijk offertelijst" || q === "open offertelijst") {
          navigateTo("/dashboard/offertes", { minimizeChat: true });
          replyText = "Ik open je **offertelijst**.";
        } else if (q === "bekijk geheugen") {
          navigateTo("/dashboard/geheugen", { minimizeChat: true });
          replyText = "Ik open je **geheugen** — daar zie je wat ik over je werkwijze en prijzen heb geleerd.";
        } else if (
          q.includes("andere instructie") ||
          q.includes("reageren op het wachtende")
        ) {
          replyText =
            "Vertel me wat ik anders moet doen. Bijvoorbeeld: andere klant, ander bedrag, andere toon, of overslaan.";
          replyOptions = [
            "Stel opnieuw op voor andere klant",
            "Annuleer dit voorstel",
          ];
        } else if (chatState) {
          if (chatState.flow === "create_agent") {
            if (chatState.step === "await_name") {
              const name = trimmed;
              replyText = `Prima, de agent heet **${name}**. Wat wordt de belangrijkste **rol of specialiteit** van deze agent?`;
              replyOptions = [
                "Offertes berekenen en opstellen",
                "Werfbezoeken inplannen",
                "Inkomende facturen controleren",
                "Leads opvolgen",
              ];
              setChatState({
                flow: "create_agent",
                step: "await_role",
                data: { name },
              });
            } else if (chatState.step === "await_role") {
              const role = trimmed;
              replyText = `Duidelijk! Wat is de **belangrijkste trigger of actie** die deze agent proactief moet uitvoeren?`;
              replyOptions = [
                "Elke vrijdag statusrapport opstellen",
                "Bevestiging sturen bij getekende offerte",
                "WhatsApp herinnering klaarzetten",
              ];
              setChatState({
                flow: "create_agent",
                step: "await_trigger",
                data: { ...chatState.data, role },
              });
            } else if (chatState.step === "await_trigger") {
              const trigger = trimmed;
              const { name, role } = chatState.data;

              replyText = `Geweldig! Ik heb alle gegevens verzameld. Hier is het profiel van je nieuwe agent:\n\n🤖 **Naam**: ${name}\n💼 **Rol**: ${role}\n⚡ **Actie**: ${trigger}\n\nIk ga deze agent nu aanmaken en activeren in je dashboard. Een moment geduld...`;

              if (companyId) {
                try {
                  const currentAgents = await loadCompanyAgents(supabase, companyId);
                  const newAgent: CustomAgent = {
                    id: `agent-${Date.now().toString(36)}`,
                    name: name,
                    role: role,
                    instructies: trigger,
                    capabilities: ["automatisaties"],
                    gradient: "from-rose-400 to-pink-500",
                    avatarUrl: defaultAvatarUrl(),
                    enabled: true,
                    toestemming: "voorstellen",
                  };
                  await saveCompanyAgents(supabase, companyId, [...currentAgents, newAgent]);

                  // Log action creation
                  await supabase.from("agent_activity_logs").insert({
                    company_id: companyId,
                    agent_name: DEFAULT_AGENT_NAME,
                    action_type: "opvolging",
                    message: `Nieuwe AI-agent ${name} (${role}) succesvol aangemaakt via AI Control Center.`,
                  });

                  setTimeout(() => {
                    dispatchOpenControlCenter();
                    setHistoryByAgent((prev) => ({
                      ...prev,
                      [agent.id]: [
                        ...(prev[agent.id] ?? []),
                        {
                          id: `a-finish-${Date.now()}`,
                          role: "agent",
                          text: `✅ **Succes!** De AI-agent **${name}** is aangemaakt en toegevoegd aan je agent-vloot. Je ziet hem nu terug op je dashboard!`,
                          time: "Nu",
                          options: ["Super, bedankt!", "Wat kan ik nog meer doen?"],
                        },
                      ],
                    }));
                    router.refresh();
                  }, 1500);
                } catch (err) {
                  console.error(err);
                }
              } else {
                // Mock success for preview mode
                setTimeout(() => {
                  dispatchOpenControlCenter();
                  setHistoryByAgent((prev) => ({
                    ...prev,
                    [agent.id]: [
                      ...(prev[agent.id] ?? []),
                      {
                        id: `a-finish-${Date.now()}`,
                        role: "agent",
                        text: `✅ **Succes (Demo-modus)!** De AI-agent **${name}** is aangemaakt en toegevoegd aan de actieve vloot.`,
                        time: "Nu",
                        options: ["Super, bedankt!"],
                      },
                    ],
                  }));
                }, 1500);
              }
              setChatState(null);
            }
          } else if (chatState.flow === "send_quote") {
            if (chatState.step === "await_target") {
              const target = trimmed;
              replyText = `Duidelijk, we gaan de offerte opzoeken voor **${target}**. Naar welk **e-mailadres** moet deze verzonden worden?`;
              replyOptions = [
                "info@janssens.be",
                "peeters@telenet.be",
                "boekhouding@archonpro.be",
              ];
              setChatState({
                flow: "send_quote",
                step: "await_email",
                data: { target },
              });
            } else if (chatState.step === "await_email") {
              const email = trimmed;
              const { target } = chatState.data;

              replyText = `Begrepen! Ik heb een actie om de offerte voor **${target}** te verzenden naar **${email}** klaargezet in je Automatisaties. Je kunt deze direct goedkeuren en verzenden met één klik!`;
              replyOptions = ["Toon Automatisaties", "Dank je"];

              if (companyId) {
                await supabase.from("agent_actions").insert({
                  company_id: companyId,
                  agent_name: "Viktor",
                  action_type: "send_offerte",
                  title: `Offerte verzenden naar ${email}`,
                  reason: `Gevraagd via ${DEFAULT_AGENT_NAME} AI-metgezel voor ${target}`,
                  payload_json: { email, target },
                  target_entity_type: "offerte",
                  status: "pending",
                  requires_approval: true,
                  confidence: 0.95,
                });

                // Add log entry
                await supabase.from("agent_activity_logs").insert({
                  company_id: companyId,
                  agent_name: DEFAULT_AGENT_NAME,
                  action_type: "opvolging",
                  message: `${DEFAULT_AGENT_NAME} heeft een voorstel klaargezet om offerte te verzenden naar ${email}`,
                });

                router.refresh();
              }
              setChatState(null);
            }
          }
        } else {
          // 2. DETECT INITIAL FLOWS
          if (
            q.includes("agent") &&
            (q.includes("maak") ||
              q.includes("creeer") ||
              q.includes("creëer") ||
              q.includes("nieuw") ||
              q.includes("ontwerp") ||
              q.includes("toevoegen"))
          ) {
            replyText =
              "Wat leuk! Laten we een nieuwe AI-agent maken. Wat moet de **naam** van deze agent worden?";
            replyOptions = ["Calculator", "Planner", "FactuurControleur", "Werkvoorbereider"];
            setChatState({
              flow: "create_agent",
              step: "await_name",
              data: {},
            });
          } else if (
            q.includes("offerte") &&
            (q.includes("stuur") ||
              q.includes("verstuur") ||
              q.includes("verzend") ||
              q.includes("send") ||
              q.includes("mail"))
          ) {
            replyText =
              "Ik help je graag met het verzenden van een offerte. Voor welke **klant** of welk **offertenummer** wil je dit doen?";
            replyOptions = ["Dakwerken Janssens", "Renovatie Peeters", "OF-2026-0004", "OF-2026-0008"];
            setChatState({
              flow: "send_quote",
              step: "await_target",
              data: {},
            });
          } else if (
            q.includes("vergeten") ||
            q.includes("vergeteren") ||
            q.includes("wat moet ik doen") ||
            q.includes("briefing") ||
            q.includes("status") ||
            q.includes("suggestie")
          ) {
            if (companyId) {
              const [facturenRes, dealsRes] = await Promise.all([
                supabase
                  .from("facturen")
                  .select("id, nummer, klant, totaal_bedrag")
                  .eq("bedrijf_id", companyId)
                  .is("paid_at", null)
                  .neq("status", "betaald")
                  .limit(1),
                supabase
                  .from("deals")
                  .select("id, titel, waarde")
                  .eq("bedrijf_id", companyId)
                  .eq("stadium", "Nieuw")
                  .limit(1),
              ]);

              const openFacturen = facturenRes.data;
              const openDeals = dealsRes.data;

              if (openFacturen && openFacturen.length > 0) {
                replyText = `💡 **Wat je misschien vergeten bent:**\n\nIk zie dat factuur **${openFacturen[0].nummer}** voor **${openFacturen[0].klant}** openstaat. Zal ik Facturatie een vriendelijke betalingsherinnering laten voorbereiden?`;
                replyOptions = ["Ja, bereid herinnering voor", "Nee, nu niet"];
              } else if (openDeals && openDeals.length > 0) {
                replyText = `💡 **AI Suggestie:**\n\nJe hebt een nieuwe lead gekregen: **${openDeals[0].titel}** ter waarde van €${openDeals[0].waarde}. Zal ik Opvolger een kennismakingsbericht laten opstellen?`;
                replyOptions = ["Ja, stel bericht op", "Nee, sla over"];
              } else {
                replyText =
                  "💡 **AI Suggestie:**\n\nAlles ziet er momenteel bijgewerkt uit! Er zijn geen openstaande calculaties of vervallen facturen. Goed bezig!";
                replyOptions = ["Top!", "Controleer nogmaals"];
              }
            } else {
              replyText =
                "💡 **AI Suggestie (Demo):**\n\nIk zie dat de offerte voor **Dakwerken Janssens** al 5 dagen onbeantwoord is gebleven. Zal ik Schatter een opvolgbericht via WhatsApp laten voorbereiden?";
              replyOptions = ["Ja, bereid opvolging voor", "Nee, overslaan"];
            }
          } else {
            const navIntent =
              detectNavigationIntent(trimmed, agent.id) ??
              detectQuickAction(trimmed, agent.id);

            if (navIntent) {
              navigateTo(navIntent.route, { minimizeChat: true });
              if ("openControlCenter" in navIntent && navIntent.openControlCenter) {
                dispatchOpenControlCenter();
              }
              replyText =
                "openControlCenter" in navIntent && navIntent.openControlCenter
                  ? `Ik open het **AI Control Center** — daar zie je live agent-status en het recente logboek.`
                  : `Ik open **${navIntent.label}** voor je.`;
            } else if (companyId) {
              const remembered = await rememberChatInsight({
                text: trimmed,
                agentName: agent.name,
              });
              if (remembered.ok) {
                replyText =
                  "Genoteerd in je **geheugen** — ik gebruik dit voortaan bij offertes en suggesties.";
                replyOptions = ["Bekijk geheugen", "Dank je"];
              } else {
                const standardReply = replyFor(agent, trimmed);
                replyText = standardReply.text;
                replyOptions = standardReply.options;
              }
            } else {
              const standardReply = replyFor(agent, trimmed);
              replyText = standardReply.text;
              replyOptions = standardReply.options;
            }
          }
        }

        setHistoryByAgent((prev) => ({
          ...prev,
          [agent.id]: [
            ...(prev[agent.id] ?? []),
            {
              id: `a-${Date.now()}`,
              role: "agent",
              text: replyText,
              time: "Nu",
              options: replyOptions,
            },
          ],
        }));
        setView((current) => {
          if (current !== "open") setHasUnread(true);
          return current;
        });
        } finally {
          setIsTyping(false);
        }
      })();
    },
    [activeAgent, chatState, companyId, router, navigateTo, historyByAgent],
  );

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && view === "open") {
        setView("minimized");
        setHasUnread(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [view]);

  useEffect(() => {
    function onResize() {
      setPositionState((current) => {
        const clamped = clampChatPosition(current);
        try {
          sessionStorage.setItem(STORAGE_POSITION_KEY, JSON.stringify(clamped));
        } catch {
          /* negeer */
        }
        return clamped;
      });
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const value = useMemo(
    () => ({
      view,
      open,
      openWith,
      minimize,
      close,
      toggle,
      activeAgent,
      availableAgents,
      syncCompanyAgents,
      position,
      setPosition,
      messages,
      sendMessage,
      isTyping,
      hasUnread,
      clearUnread,
      pushAgentAlert,
    }),
    [
      view,
      open,
      openWith,
      minimize,
      close,
      toggle,
      activeAgent,
      availableAgents,
      syncCompanyAgents,
      position,
      setPosition,
      messages,
      sendMessage,
      isTyping,
      hasUnread,
      clearUnread,
      pushAgentAlert,
    ],
  );

  return (
    <AgentChatContext.Provider value={value}>{children}</AgentChatContext.Provider>
  );
}

export function useAgentChat() {
  const ctx = useContext(AgentChatContext);
  if (!ctx) {
    throw new Error("useAgentChat moet binnen AgentChatProvider gebruikt worden.");
  }
  return ctx;
}
