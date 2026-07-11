export type AgentKnowledgeKind =
  | "instruction"
  | "fact"
  | "preference"
  | "context";

export type AgentMandateSections = {
  mustDo: string;
  mayDo: string;
  mustNot: string;
  boundaries: string;
  examples: string;
};

export type AgentDocumentRow = {
  id: string;
  title: string;
  kind: AgentKnowledgeKind;
  kindLabel: string;
  docMode: "mandate" | "free";
  contentPreview: string;
  createdAt: string | null;
};

export const KIND_LABELS: Record<AgentKnowledgeKind, string> = {
  instruction: "Mandaat (mag & moet)",
  fact: "Feiten & procedures",
  preference: "Voorkeuren & regels",
  context: "Context & notities",
};

export function formatMandateDocument(
  agentName: string,
  sections: AgentMandateSections,
): string {
  const blocks: string[] = [`# Mandaat — ${agentName}`, ""];

  if (sections.mustDo.trim()) {
    blocks.push("## Wat deze agent MOET doen", sections.mustDo.trim(), "");
  }
  if (sections.mayDo.trim()) {
    blocks.push("## Wat deze agent MAG doen", sections.mayDo.trim(), "");
  }
  if (sections.mustNot.trim()) {
    blocks.push("## Wat deze agent NIET mag doen", sections.mustNot.trim(), "");
  }
  if (sections.boundaries.trim()) {
    blocks.push("## Grenzen & escalatie", sections.boundaries.trim(), "");
  }
  if (sections.examples.trim()) {
    blocks.push("## Voorbeelden & situaties", sections.examples.trim(), "");
  }

  return blocks.join("\n").trim();
}

export function docModeFromMetadata(
  metadata: Record<string, unknown> | null,
): "mandate" | "free" {
  return metadata?.docMode === "mandate" ? "mandate" : "free";
}
