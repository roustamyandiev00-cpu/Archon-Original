import { redirect } from "next/navigation";

export const metadata = { title: "Overzicht — ArchonPro" };

/** @deprecated Gebruik /dashboard/command-center */
export default function OverzichtPage() {
  redirect("/dashboard/command-center");
}
