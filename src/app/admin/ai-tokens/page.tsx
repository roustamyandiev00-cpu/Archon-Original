import AiTokensManagement from "@/components/dashboard/admin/AiTokensManagement";
import { AlertTriangle } from "lucide-react";
import {
  fetchCompanyTokenUsage,
  getTokenUsageSummary,
} from "@/lib/admin/ai-tokens";
import { requirePlatformAdmin } from "@/lib/platform-admin";

export const metadata = { title: "AI Tokens — Admin Dashboard" };

export default async function AiTokensPage() {
  const { serviceSupabase } = await requirePlatformAdmin();

  const result = await fetchCompanyTokenUsage(serviceSupabase);

  if (result.error) {
    return (
      <div className="space-y-6">
        <header>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
            Platform AI Management
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">
            AI Token Dashboard
          </h1>
        </header>
        <section
          role="alert"
          className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 shrink-0 text-amber-400" size={20} />
            <div>
              <h2 className="font-semibold text-amber-200">
                Tokenbeheer niet beschikbaar
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-amber-100/70">
                {result.error} Er zijn geen tokenmutaties uitgevoerd.
              </p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  const summary = getTokenUsageSummary(result.companies);

  return <AiTokensManagement companies={result.companies} summary={summary} />;
}
