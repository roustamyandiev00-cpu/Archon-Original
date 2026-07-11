import { redirect } from "next/navigation";

export default function AIAgentsPage() {
  redirect("/dashboard/command-center?view=crew");
}