import { Users } from "lucide-react";
import { getCompanyContext } from "@/lib/company";
import { untyped } from "@/lib/integraties";
import ModuleWipBanner from "@/components/dashboard/ModuleWipBanner";
import TeamManager, {
  type TeamMember,
} from "@/components/dashboard/team/TeamManager";

export const metadata = { title: "Team — ArchonPro" };

type TeamMemberRow = {
  membership_id: number;
  user_id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
  is_active: boolean;
  joined_at: string | null;
};

export default async function TeamPage() {
  const { supabase, companyId, user } = await getCompanyContext();

  if (!companyId || !user) {
    return (
      <div className="rounded-2xl border border-white/10 bg-zinc-950/50 p-6">
        <h1 className="text-xl font-semibold text-zinc-50">Team</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Geen actief bedrijf gevonden voor je account.
        </p>
      </div>
    );
  }

  const [{ data: memberRows, error }, { data: isAdmin }] = await Promise.all([
    untyped(supabase).rpc("team_list_members", { p_company_id: companyId }),
    supabase.rpc("is_company_admin", { p_company_id: companyId }),
  ]);

  const members: TeamMember[] = ((memberRows ?? []) as TeamMemberRow[]).map(
    (member) => ({
      membershipId: member.membership_id,
      userId: member.user_id,
      email: member.email ?? "Onbekend e-mailadres",
      fullName: member.full_name,
      avatarUrl: member.avatar_url,
      role: member.role === "admin" ? "admin" : "member",
      isActive: member.is_active,
      joinedAt: member.joined_at,
    }),
  );

  return (
    <div className="mx-auto max-w-[1100px] space-y-5">
      <ModuleWipBanner
        moduleId="team"
        title="Team is nog in ontwikkeling"
        description="Je kan teamleden al toevoegen en rollen beheren. Uitnodigingen via e-mail volgen later. Verberg dit bericht als je wilt."
      />
      <header className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-sky-500/10 text-sky-400">
          <Users size={20} />
        </span>
        <div>
          <h1 className="text-xl font-semibold text-zinc-50">Team</h1>
          <p className="mt-0.5 text-sm text-zinc-500">
            Beheer teamleden en rollen binnen je organisatie.
          </p>
        </div>
      </header>

      {error ? (
        <p className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200">
          Teamleden konden niet worden geladen: {error.message}
        </p>
      ) : (
        <TeamManager
          members={members}
          canManage={Boolean(isAdmin)}
          currentUserId={user.id}
        />
      )}
    </div>
  );
}
