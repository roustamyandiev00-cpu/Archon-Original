// Letterlijke klassenamen: Tailwind genereert alleen utilities die als
// volledige string in de broncode staan, dus geen `${breakpoint}:table-cell`.
const BREAKPOINT_CLASS = {
  lg: "hidden lg:table-cell",
  xl: "hidden xl:table-cell",
  "2xl": "hidden 2xl:table-cell",
} as const;

export function tableColumnClass(
  visible: boolean,
  breakpoint?: "lg" | "xl" | "2xl",
  extra = "min-w-0",
) {
  if (!visible) return "hidden";
  if (!breakpoint) return extra;
  return `${BREAKPOINT_CLASS[breakpoint]} ${extra}`;
}
