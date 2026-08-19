import type { SupabaseClient } from "@supabase/supabase-js";
import { proposeAgentAction } from "@/lib/agents/propose";
import { evaluatePolicy } from "@/lib/agents/policy";
import {
  analyzeChatMessage,
  suggestedSanctionType,
  type ModerationFinding,
} from "@/lib/bouwnetwerk/chat-moderation";
import {
  detectContactDetails,
  type ContactHit,
} from "@/lib/bouwnetwerk/contact-detect";

export async function channelHasSignedContract(
  supabase: SupabaseClient,
  channelId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("samenwerking_contracts")
    .select("id")
    .eq("channel_id", channelId)
    .eq("status", "signed")
    .maybeSingle();
  return Boolean(data?.id);
}

/**
 * Soft contact-check vóór insert. Geeft warning terug; blokkeert niet
 * als er een signed contract is. Blokkeert wél herhaalde contact-spam
 * zonder contract (optioneel streng).
 */
export async function evaluateContactSharing(input: {
  supabase: SupabaseClient;
  channelId: string;
  content: string;
  blockWithoutContract?: boolean;
}): Promise<{ hits: ContactHit[]; warning?: string; blocked?: string }> {
  const hits = detectContactDetails(input.content);
  if (hits.length === 0) return { hits };

  const signed = await channelHasSignedContract(
    input.supabase,
    input.channelId,
  );
  if (signed) return { hits };

  const warning =
    `Contactgegevens gedetecteerd (${hits.map((h) => h.kind).join(", ")}). ` +
    `Deel deze pas na een ondertekend samenwerkingscontract.`;

  if (input.blockWithoutContract) {
    return {
      hits,
      warning,
      blocked:
        "Contactgegevens delen is niet toegestaan zolang er geen ondertekend contract is.",
    };
  }
  return { hits, warning };
}

/** Na insert: bij findings een pending agent-action (mens bevestigt). */
export async function proposeChatModerationIfNeeded(input: {
  supabase: SupabaseClient;
  companyId: number;
  channelId: string;
  messageId: string | null;
  content: string;
  contactHits?: ContactHit[];
}): Promise<{ actionId?: number; findings: ModerationFinding[] }> {
  const findings = analyzeChatMessage(input.content);
  if ((input.contactHits?.length ?? 0) > 0) {
    const signed = await channelHasSignedContract(
      input.supabase,
      input.channelId,
    );
    if (!signed) {
      findings.push({
        category: "contactgegevens",
        severity: "medium",
        detail: "Contactgegevens gedeeld zonder signed contract",
      });
    }
  }

  if (findings.length === 0) return { findings };

  const policy = evaluatePolicy({
    agentId: "Nova",
    actionType: "propose_chat_sanction",
    tenantId: input.companyId,
    isExternal: false,
  });
  if (!policy.allowed) return { findings };

  const sanctionType = suggestedSanctionType(findings);
  const categories = findings.map((f) => f.category).join(", ");

  const proposed = await proposeAgentAction({
    supabase: input.supabase,
    companyId: input.companyId,
    agentName: "Nova",
    actionType: "propose_chat_sanction",
    title: `Chat-moderatie: ${sanctionType} (${categories})`,
    reason: findings.map((f) => f.detail).join("; "),
    payload: {
      bedrijfId: input.companyId,
      sanctionType,
      reden: findings.map((f) => f.detail).join("; "),
      channelId: input.channelId,
      messageId: input.messageId,
      findings,
    },
    targetEntityType: "bouwnetwerk_channel",
    targetRoute: `/dashboard/werkposts/samenwerkingen?channel=${input.channelId}`,
    requiresApproval: true,
    confidence: findings.some((f) => f.severity === "high") ? 0.75 : 0.6,
  });

  if ("error" in proposed && proposed.error) {
    console.error("proposeChatModeration:", proposed.error);
    return { findings };
  }

  return { actionId: proposed.id, findings };
}
