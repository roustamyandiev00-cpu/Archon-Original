import { redirect } from "next/navigation";

export const metadata = { title: "Comms — ArchonPro" };

/** Chat is geïntegreerd in Bouwnetwerk. */
export default function CommsPage() {
  redirect("/dashboard/werkposts");
}
