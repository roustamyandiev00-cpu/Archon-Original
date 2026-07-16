"use server";

import { revalidatePath } from "next/cache";
import { requireAdminAccess } from "@/components/dashboard/context";
import { untyped } from "@/lib/integraties";

export type TeamRole = "admin" | "member";

function validRole(role: string): role is TeamRole {
  return role === "admin" || role === "member";
}

export async function addTeamMember(input: { email: string; role: TeamRole }) {
  const access = await requireAdminAccess();
  if ("error" in access) return { error: access.error };

  const email = input.email.trim().toLowerCase();
  if (!email) return { error: "Vul een e-mailadres in." };
  if (!validRole(input.role)) return { error: "Ongeldige rol." };

  const { error } = await untyped(access.supabase).rpc("team_add_member", {
    p_company_id: access.companyId,
    p_email: email,
    p_role: input.role,
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard/team");
  return { ok: true };
}

export async function updateTeamMember(input: {
  membershipId: number;
  role: TeamRole;
  isActive: boolean;
}) {
  const access = await requireAdminAccess();
  if ("error" in access) return { error: access.error };

  if (!Number.isInteger(input.membershipId) || input.membershipId <= 0) {
    return { error: "Ongeldig teamlid." };
  }
  if (!validRole(input.role)) return { error: "Ongeldige rol." };

  const { error } = await untyped(access.supabase).rpc("team_update_member", {
    p_company_id: access.companyId,
    p_membership_id: input.membershipId,
    p_role: input.role,
    p_is_active: input.isActive,
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard/team");
  return { ok: true };
}
