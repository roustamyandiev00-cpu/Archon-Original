import { redirect } from "next/navigation";
import { integratiesSettingsHref } from "@/lib/integraties";

export const metadata = { title: "Integraties — ArchonPro" };

/** Doorverwijzing: integraties staan onder Instellingen. OAuth-routes blijven op /dashboard/integraties/… */
export default async function IntegratiesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const query: Record<string, string | undefined> = {};

  for (const [key, value] of Object.entries(sp)) {
    if (typeof value === "string") query[key] = value;
  }

  redirect(integratiesSettingsHref(query));
}
