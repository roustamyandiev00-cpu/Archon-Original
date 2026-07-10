import { redirect } from "next/navigation";

export const metadata = { title: "Dashboard — ArchonPro" };

/** Standaard landing: Overzicht (referentie-dashboard). */
export default function DashboardPage() {
  redirect("/dashboard/overzicht");
}
