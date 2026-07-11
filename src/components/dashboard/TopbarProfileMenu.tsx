"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut, Settings, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { SIDEBAR_SETTINGS } from "@/components/dashboard/sidebar-nav";

export type TopbarProfile = {
  name: string;
  email: string;
  avatarUrl: string | null;
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  return (parts[0]?.slice(0, 2) ?? "?").toUpperCase();
}

function avatarGradient(name: string) {
  const tones = [
    "from-sky-400 to-indigo-500",
    "from-violet-400 to-purple-500",
    "from-emerald-400 to-teal-500",
    "from-amber-400 to-orange-500",
    "from-rose-400 to-pink-500",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return tones[Math.abs(hash) % tones.length]!;
}

function ProfileAvatar({
  profile,
  size = "md",
}: {
  profile: TopbarProfile;
  size?: "sm" | "md";
}) {
  const dim = size === "sm" ? "h-7 w-7" : "h-8 w-8";
  const text = size === "sm" ? "text-[10px]" : "text-xs";

  if (profile.avatarUrl) {
    return (
      <span className={`relative ${dim} shrink-0 overflow-hidden rounded-full ring-1 ring-white/15`}>
        <Image
          src={profile.avatarUrl}
          alt=""
          fill
          sizes={size === "sm" ? "28px" : "32px"}
          className="object-cover"
          unoptimized
        />
      </span>
    );
  }

  return (
    <span
      className={`grid ${dim} shrink-0 place-items-center rounded-full bg-gradient-to-br ${avatarGradient(profile.name)} ${text} font-bold text-zinc-950 ring-1 ring-white/15`}
    >
      {initials(profile.name)}
    </span>
  );
}

export default function TopbarProfileMenu({
  profile,
  isPreviewMode = false,
}: {
  profile: TopbarProfile | null;
  isPreviewMode?: boolean;
}) {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  async function handleLogout() {
    setOpen(false);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  if (isPreviewMode || !profile) {
    return (
      <Link
        href="/register"
        className="ml-1 inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1.5 text-xs font-medium text-sky-200 transition-colors hover:bg-sky-500/20"
      >
        <UserRound size={14} />
        Account
      </Link>
    );
  }

  return (
    <div className="relative ml-1" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Profielmenu"
        className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 py-1 pl-1 pr-2.5 transition-colors hover:border-white/15 hover:bg-white/[0.08]"
      >
        <ProfileAvatar profile={profile} size="sm" />
        <span className="hidden max-w-[7rem] truncate text-xs font-medium text-zinc-200 sm:inline">
          {profile.name}
        </span>
        <ChevronDown
          size={12}
          className={`shrink-0 text-zinc-500 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+0.4rem)] z-50 w-60 overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 shadow-2xl"
        >
          <div className="border-b border-white/10 px-4 py-3">
            <div className="flex items-center gap-3">
              <ProfileAvatar profile={profile} />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-zinc-100">
                  {profile.name}
                </p>
                <p className="truncate text-xs text-zinc-500">{profile.email}</p>
              </div>
            </div>
          </div>

          <div className="p-1.5">
            <Link
              href={SIDEBAR_SETTINGS.href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-zinc-300 transition-colors hover:bg-white/5 hover:text-zinc-100"
            >
              <Settings size={15} className="text-zinc-500" />
              Instellingen
            </Link>
            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-zinc-300 transition-colors hover:bg-rose-500/10 hover:text-rose-300"
            >
              <LogOut size={15} className="text-zinc-500" />
              Uitloggen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
