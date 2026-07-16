export function tableColumnClass(
  visible: boolean,
  breakpoint?: "lg" | "xl" | "2xl",
  extra = "min-w-0",
) {
  if (!visible) return "hidden";
  if (!breakpoint) return extra;
  return `hidden ${breakpoint}:table-cell ${extra}`;
}
