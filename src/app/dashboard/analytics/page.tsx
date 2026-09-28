import { redirect } from "next/navigation";

export const metadata = { title: "Analytics — ArchonPro" };

export default async function AnalyticsPage() {
  redirect("/dashboard/kpi");
}

