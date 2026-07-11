import { redirect } from "next/navigation";

/** Doorverwijzing naar AI Crew op Command Center. */
export default function NovaAgentsPage() {
  redirect("/dashboard/command-center?view=crew&panel=agents");
}
