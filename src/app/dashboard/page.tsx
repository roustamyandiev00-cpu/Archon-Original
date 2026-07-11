import { redirect } from "next/navigation";

export const metadata = { title: "Dashboard — ArchonPro" };

/** Standaard landing: Command Center. */
export default function DashboardPage() {
  redirect("/dashboard/command-center");
}
