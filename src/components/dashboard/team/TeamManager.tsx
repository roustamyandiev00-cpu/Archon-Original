"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, UserPlus, UserRoundX, Users } from "lucide-react";
import {
  addTeamMember,
  updateTeamMember,
  type TeamRole,
} from "@/app/dashboard/team/actions";

export type TeamMember = {
  membershipId: number;
  userId: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  role: TeamRole;
  isActive: boolean;
  joinedAt: string | null;
};

type Props = {
  members: TeamMember[];
  canManage: boolean;
  currentUserId: string;
};

const inputClass =
  "w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-sky-500/60";

function memberName(member: TeamMember) {
  return member.fullName?.trim() || member.email;
}

export default function TeamManager({
  members,
  canManage,
  currentUserId,
}: Props) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<TeamRole>("member");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function addMember() {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await addTeamMember({ email, role });
      if ("error" in result) {
        setError(result.error ?? "Teamlid toevoegen mislukt.");
        return;
      }
      setEmail("");
      setRole("member");
      setSuccess("Teamlid toegevoegd.");
    });
  }

  function updateMember(
    member: TeamMember,
    next: { role: TeamRole; isActive: boolean },
  ) {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await updateTeamMember({
        membershipId: member.membershipId,
        ...next,
      });
      if ("error" in result) {
        setError(result.error ?? "Teamlid bijwerken mislukt.");
        return;
      }
      setSuccess("Teamlid bijgewerkt.");
    });
  }

  return (
    <div className="space-y-5">
      {canManage && (
        <section className="rounded-2xl border border-white/10 bg-zinc-950/50 p-4 sm:p-5">
          <div className="mb-4 flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sky-500/10 text-sky-400">
              <UserPlus size={18} />
            </span>
            <div>
              <h2 className="font-semibold text-zinc-100">Teamlid toevoegen</h2>
              <p className="mt-0.5 text-sm text-zinc-500">
                Het e-mailadres moet al een ArchonPro-account hebben. E-mailuitnodigingen volgen
                wanneer SMTP is gekoppeld.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-[1fr_150px_auto]">
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="collega@bedrijf.be"
              className={inputClass}
              aria-label="E-mailadres van teamlid"
            />
            <select
              value={role}
              onChange={(event) => setRole(event.target.value as TeamRole)}
              className={inputClass}
              aria-label="Rol"
            >
              <option value="member">Medewerker</option>
              <option value="admin">Beheerder</option>
            </select>
            <button
              type="button"
              disabled={pending || !email.trim()}
              onClick={addMember}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-sky-500/40 bg-sky-500/15 px-4 text-sm font-medium text-sky-100 hover:bg-sky-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pending ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
              Toevoegen
            </button>
          </div>
        </section>
      )}

      {error && (
        <p className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {error}
        </p>
      )}
      {success && (
        <p className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
          <Check size={16} />
          {success}
        </p>
      )}

      <section className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/50">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-4 sm:px-5">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-white/5 text-zinc-300">
              <Users size={17} />
            </span>
            <div>
              <h2 className="font-semibold text-zinc-100">Teamleden</h2>
              <p className="text-sm text-zinc-500">{members.length} geregistreerde leden</p>
            </div>
          </div>
        </div>

        <div className="divide-y divide-white/10">
          {members.map((member) => {
            const isSelf = member.userId === currentUserId;
            const disabled = pending || isSelf || !canManage;

            return (
              <article
                key={member.membershipId}
                className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium text-zinc-100">{memberName(member)}</p>
                    {isSelf && (
                      <span className="rounded-full bg-sky-500/10 px-2 py-0.5 text-xs text-sky-300">
                        Jij
                      </span>
                    )}
                    {!member.isActive && (
                      <span className="rounded-full bg-zinc-700 px-2 py-0.5 text-xs text-zinc-300">
                        Inactief
                      </span>
                    )}
                  </div>
                  {member.fullName && (
                    <p className="mt-0.5 truncate text-sm text-zinc-500">{member.email}</p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={member.role}
                    disabled={disabled}
                    onChange={(event) =>
                      updateMember(member, {
                        role: event.target.value as TeamRole,
                        isActive: member.isActive,
                      })
                    }
                    className="rounded-lg border border-white/10 bg-zinc-900 px-2.5 py-2 text-sm text-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label={`Rol van ${memberName(member)}`}
                  >
                    <option value="member">Medewerker</option>
                    <option value="admin">Beheerder</option>
                  </select>
                  {canManage && !isSelf && (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() =>
                        updateMember(member, {
                          role: member.role,
                          isActive: !member.isActive,
                        })
                      }
                      className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/10 px-3 text-sm text-zinc-300 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <UserRoundX size={15} />
                      {member.isActive ? "Deactiveren" : "Heractiveren"}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
