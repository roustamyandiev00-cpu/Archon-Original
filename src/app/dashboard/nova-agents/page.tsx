import { Bot } from "lucide-react";
import PlaceholderPage from "@/components/dashboard/PlaceholderPage";

export const metadata = { title: "Nova-agents — ArchonPro" };

export default function NovaAgentsPage() {
  return (
    <PlaceholderPage
      title="Nova-agents"
      description="Beheer je AI-agents en hun taken."
      icon={<Bot size={20} />}
      features={[
        "Agents activeren en configureren",
        "Taken en permissies instellen",
        "Prestaties van agents opvolgen",
      ]}
    />
  );
}
