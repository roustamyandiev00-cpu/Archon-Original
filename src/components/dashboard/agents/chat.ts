import type { SupabaseClient } from "@supabase/supabase-js";
import type { AiConfig } from "@/app/dashboard/instellingen/settings";
import type { CustomAgent } from "@/components/dashboard/agents/config";
import { CAPABILITY_OPTIONS } from "@/components/dashboard/agents/config";
import { fetchAgentMandateContext, fetchRetrievalContext } from "@/components/dashboard/agents/memory";
import { runChatCompletion } from "@/lib/ai/client";
import { llmIsConfigured } from "@/lib/ai/config";
import {
  assertAiCreditsAvailable,
  deductAiCredits,
} from "@/lib/ai/credits";

export type AgentChatTurn = {
  role: "user" | "agent";
  text: string;
};

export type AgentChatReply = {
  text: string;
  options?: string[];
  navigateTo?: string | null;
  openControlCenter?: boolean;
  remember?: string | null;
};

const ALLOWED_ROUTES = [
  "/dashboard",
  "/dashboard/command-center",
  "/dashboard/offertes",
  "/dashboard/offertes/nieuw",
  "/dashboard/facturen",
  "/dashboard/contacten",
  "/dashboard/leads",
  "/dashboard/automatisaties",
  "/dashboard/geheugen",
  "/dashboard/command-center?view=crew",
  "/dashboard/projecten",
  "/dashboard/instellingen",
];

function capabilityRoutes(agent: CustomAgent): string {
  return agent.capabilities
    .map((c) => CAPABILITY_OPTIONS.find((o) => o.id === c)?.href)
    .filter(Boolean)
    .join(", ");
}

async function loadCrmSnapshot(
  supabase: SupabaseClient,
  companyId: number,
): Promise<string> {
  const today = new Date().toISOString().slice(0, 10);
  const [pendingRes, openFacturenRes, followUpRes, dealsRes] = await Promise.all([
    supabase
      .from("agent_actions")
      .select("title, agent_name")
      .eq("company_id", companyId)
      .eq("status", "pending")
      .limit(4),
    supabase
      .from("facturen")
      .select("nummer, klant, vervaldatum")
      .eq("bedrijf_id", companyId)
      .is("paid_at", null)
      .neq("status", "betaald")
      .order("vervaldatum", { ascending: true })
      .limit(3),
    supabase
      .from("offertes")
      .select("nummer, klant, sent_at")
      .eq("bedrijf_id", companyId)
      .in("status_new", ["verzonden", "bekeken"])
      .order("sent_at", { ascending: true })
      .limit(3),
    supabase
      .from("deals")
      .select("titel, stadium")
      .eq("bedrijf_id", companyId)
      .eq("stadium", "Nieuw")
      .limit(3),
  ]);

  const lines: string[] = [];
  for (const a of pendingRes.data ?? []) {
    lines.push(`- Wachtend voorstel: ${a.title} (${a.agent_name})`);
  }
  for (const f of openFacturenRes.data ?? []) {
    const overdue = f.vervaldatum && f.vervaldatum < today;
    lines.push(
      `- Open factuur ${f.nummer} ${f.klant ?? ""}${overdue ? " (VERVALLEN)" : ""}`,
    );
  }
  for (const o of followUpRes.data ?? []) {
    lines.push(`- Offerte ${o.nummer} voor ${o.klant} wacht op reactie`);
  }
  for (const d of dealsRes.data ?? []) {
    lines.push(`- Nieuwe lead: ${d.titel}`);
  }

  return lines.length ? lines.join("\n") : "Geen urgente openstaande zaken.";
}

function parseReply(raw: string): AgentChatReply | null {
  try {
    const parsed = JSON.parse(raw) as Partial<AgentChatReply>;
    if (!parsed.text || typeof parsed.text !== "string") return null;

    const navigateTo =
      typeof parsed.navigateTo === "string" &&
      ALLOWED_ROUTES.some(
        (r) => parsed.navigateTo === r || parsed.navigateTo?.startsWith(`${r}/`),
      )
        ? parsed.navigateTo
        : null;

    const options = Array.isArray(parsed.options)
      ? parsed.options.filter((o) => typeof o === "string").slice(0, 4)
      : undefined;

    const remember =
      typeof parsed.remember === "string" && parsed.remember.trim()
        ? parsed.remember.trim()
        : null;

    const openControlCenter = parsed.openControlCenter === true;

    return { text: parsed.text.trim(), options, navigateTo, openControlCenter, remember };
  } catch {
    return null;
  }
}

export async function generateAgentChatReply(input: {
  supabase: SupabaseClient;
  companyId: number;
  userId: string;
  agent: CustomAgent;
  ai: AiConfig;
  history: AgentChatTurn[];
  message: string;
}): Promise<{
  reply?: AgentChatReply;
  useFallback?: boolean;
  fallbackReason?: "no_api_key" | "no_credits" | "error";
  error?: string;
}> {
  if (!llmIsConfigured()) return { useFallback: true, fallbackReason: "no_api_key" };

  const creditCheck = await assertAiCreditsAvailable(
    input.supabase,
    input.companyId,
    "chat",
  );
  if (!creditCheck.ok) {
    return {
      useFallback: true,
      fallbackReason: "no_credits",
      error: creditCheck.error,
    };
  }

  const trimmed = input.message.trim();
  if (!trimmed) return { error: "Leeg bericht." };

  const [retrievalContext, crmSnapshot, mandateContext] = await Promise.all([
    fetchRetrievalContext(input.supabase, input.companyId, trimmed),
    loadCrmSnapshot(input.supabase, input.companyId),
    fetchAgentMandateContext(input.supabase, input.companyId, input.agent.id),
  ]);

  const agentDisplayName =
    input.agent.id === "nova"
      ? input.ai.agentNaam.trim() || input.agent.name
      : input.agent.name;

  const historyText = input.history
    .slice(-8)
    .map((m) => `${m.role === "user" ? "Gebruiker" : agentDisplayName}: ${m.text}`)
    .join("\n");

  const system = [
    `Je bent ${agentDisplayName}, ${input.agent.role} in ArchonPro (Belgisch bouw/CRM dashboard).`,
    `Specialiteit: ${input.agent.instructies}`,
    mandateContext
      ? `Officiële mandaat-documenten voor ${agentDisplayName} (mag/moet/grenzen — altijd volgen):\n${mandateContext}`
      : "",
    `Taken: ${capabilityRoutes(input.agent)}`,
    input.ai.vakgebied ? `Vakgebied: ${input.ai.vakgebied}` : "",
    input.ai.instructies ? `Bedrijfsinstructies: ${input.ai.instructies}` : "",
    `Toestemmingsniveau: ${input.agent.toestemming}. Bij "voorstellen" zet je acties klaar ter goedkeuring; bij "versturen" mag je directer handelen.`,
    retrievalContext
      ? `Relevante context over dit bedrijf:\n${retrievalContext}`
      : "Nog weinig geheugen — leer voorkeuren en prijzen wanneer de gebruiker die deelt.",
    `Live CRM-snapshot:\n${crmSnapshot}`,
    "Antwoord ALLEEN met geldig JSON (geen markdown).",
    `Schema: {"text":"antwoord in het Nederlands","options":["max 4 korte suggesties"],"navigateTo":"route of null","openControlCenter":true/false,"remember":"voorkeur om op te slaan of null"}`,
    `Toegestane navigateTo routes: ${ALLOWED_ROUTES.join(", ")} of null.`,
    "Gebruik navigateTo wanneer de gebruiker expliciet een pagina wil openen of jij ze daar naartoe moet brengen.",
    "Zet openControlCenter op true wanneer de gebruiker agent-status, het logboek, recente AI-acties of het AI Control Center wil zien — of wanneer jij net een agent hebt aangemaakt, een actie hebt uitgevoerd of iets belangrijks in het logboek staat dat ze moeten zien.",
    "Het AI Control Center is het zijpaneel rechts op het dashboard met live agent-status (Ela, Schatter, Facturatie, Opvolger) en het recente logboek van uitgevoerde acties.",
    "Zet remember alleen als de gebruiker een voorkeur, prijs of werkwijze deelt die je moet onthouden.",
    "Wees concreet, kort en actiegericht. Verwijs naar Automatisaties voor goedkeuringen.",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const { result, error } = await runChatCompletion({
      temperature: 0.5,
      jsonMode: true,
      messages: [
        { role: "system", content: system },
        {
          role: "user",
          content: [
            historyText ? `Recente chat:\n${historyText}\n` : "",
            `Nieuw bericht: ${trimmed}`,
          ]
            .filter(Boolean)
            .join("\n"),
        },
      ],
    });

    if (error || !result) {
      return { useFallback: true, fallbackReason: "error", error: error ?? "Leeg antwoord." };
    }

    const reply = parseReply(result.content);
    if (!reply) return { useFallback: true, fallbackReason: "error" };

    await deductAiCredits(input.supabase, {
      companyId: input.companyId,
      userId: input.userId,
      action: "chat",
      metadata: {
        model: result.model,
        provider: result.provider,
        tokens: result.totalTokens,
      },
    });

    return { reply };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "AI-chat mislukt.";
    return { useFallback: true, fallbackReason: "error", error: msg };
  }
}
