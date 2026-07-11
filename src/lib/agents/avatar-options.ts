export type AgentAvatarOption = {
  id: string;
  url: string;
  label: string;
};

export const AGENT_AVATAR_OPTIONS: AgentAvatarOption[] = [
  {
    id: "01",
    url: "/avatars/avatar_01_vrouw_knot_zwart.png",
    label: "Vrouw, knot",
  },
  {
    id: "02",
    url: "/avatars/avatar_02_man_bril_paars.png",
    label: "Man, bril paars",
  },
  {
    id: "03",
    url: "/avatars/avatar_03_vrouw_lang_geel.png",
    label: "Vrouw, lang geel",
  },
  {
    id: "04",
    url: "/avatars/avatar_04_man_groen_hoodie.png",
    label: "Man, groen",
  },
  {
    id: "05",
    url: "/avatars/avatar_05_man_blauw_hemd.png",
    label: "Man, blauw hemd",
  },
  {
    id: "06",
    url: "/avatars/avatar_06_vrouw_blond_bril.png",
    label: "Vrouw, blond bril",
  },
  {
    id: "07",
    url: "/avatars/avatar_07_man_zwarte_trui.png",
    label: "Man, zwarte trui",
  },
  {
    id: "08",
    url: "/avatars/avatar_08_vrouw_zwart_bob.png",
    label: "Vrouw, bob",
  },
  {
    id: "09",
    url: "/avatars/avatar_09_man_bril_grijs.png",
    label: "Man, bril grijs",
  },
  {
    id: "10",
    url: "/avatars/avatar_10_vrouw_rood_haar.png",
    label: "Vrouw, rood haar",
  },
];

export const DEFAULT_BUILTIN_AVATARS: Record<string, string> = {
  nova: AGENT_AVATAR_OPTIONS[0]!.url,
  schatter: AGENT_AVATAR_OPTIONS[1]!.url,
  facturatie: AGENT_AVATAR_OPTIONS[4]!.url,
  opvolger: AGENT_AVATAR_OPTIONS[7]!.url,
};

export function defaultAvatarUrl(agentId?: string) {
  if (agentId && DEFAULT_BUILTIN_AVATARS[agentId]) {
    return DEFAULT_BUILTIN_AVATARS[agentId];
  }
  return AGENT_AVATAR_OPTIONS[0]?.url ?? null;
}
