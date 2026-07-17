"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  Bell,
  CreditCard,
  LogOut,
  MapPin,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { SIDEBAR_SETTINGS } from "@/components/dashboard/sidebar-nav";
import ThemeToggle from "@/components/dashboard/ThemeToggle";
import { isDashboardTourDone, resetDashboardTour } from "@/lib/onboarding/storage";
import { useDashboardTour } from "@/components/onboarding/DashboardTourProvider";

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
  size?: "sm" | "md" | "lg";
}) {
  const sizeMap = { sm: "h-7 w-7", md: "h-9 w-9", lg: "h-10 w-10" };
  const textMap = { sm: "text-[10px]", md: "text-xs", lg: "text-sm" };
  const pixelMap = { sm: 28, md: 36, lg: 40 };
  const dim = sizeMap[size];
  const text = textMap[size];

  if (profile.avatarUrl) {
    return (
      <span className={`relative inline-block ${dim} shrink-0 overflow-hidden rounded-full ring-2 ring-white/15`}>
        <Image
          src={profile.avatarUrl}
          alt=""
          fill
          sizes={`${pixelMap[size]}px`}
          className="object-cover"
          unoptimized
        />
      </span>
    );
  }

  return (
    <span
      className={`grid ${dim} shrink-0 place-items-center rounded-full bg-gradient-to-br ${avatarGradient(profile.name)} ${text} font-bold text-zinc-950 ring-2 ring-white/15`}
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
  const { startTour } = useDashboardTour();

  // Hydrate tour-done state aan clientzijde
  const tourDone = useSyncExternalStore(
    () => () => {},
    () => isDashboardTourDone(),
    () => false,
  );

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

  function handleReplayTour() {
    setOpen(false);
    resetDashboardTour();
    // Navigeer naar command center als we er niet zijn, dan start de tour
    if (window.location.pathname !== "/dashboard/command-center") {
      router.push("/dashboard/command-center");
      // startTour wordt automatisch door NovaDashboardTour opgepakt na navigatie
      // via de ?tour=1 check, maar hier gebruiken we de directe startTour call:
      setTimeout(() => startTour({ replay: true }), 600);
    } else {
      startTour({ replay: true });
    }
  }

  if (isPreviewMode || !profile) {
    return (
      <Link
        href="/register"
        className="ml-1 inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1.5 text-xs font-medium text-sky-200 transition-colors hover:bg-sky-500/20"
      >
        Account
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-1 ml-1">
      {/* Instellingen-knop */}
      <Link
        href={SIDEBAR_SETTINGS.href}
        title="Instellingen"
        aria-label="Instellingen"
        className="grid h-8 w-8 place-items-center rounded-lg text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-100"
      >
        <Settings size={16} />
      </Link>

      {/* Donker/licht thema toggle */}
      <ThemeToggle />

      {/* Avatar + dropdown */}
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-haspopup="menu"
          aria-label="Profielmenu"
          className="ml-1 rounded-full transition-opacity hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
        >
          <ProfileAvatar profile={profile} size="md" />
        </button>

        {open && (
          <div
            role="menu"
            className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-64 overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 shadow-2xl shadow-black/40"
          >
            {/* Profile header */}
            <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3.5">
              <ProfileAvatar profile={profile} size="lg" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-zinc-100">
                  {profile.name}
                </p>
                <p className="truncate text-xs text-zinc-500">{profile.email}</p>
              </div>
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-500/15 text-emerald-400">
                <ShieldCheck size={12} />
              </span>
            </div>

            {/* Menu items */}
            <div className="p-1.5 space-y-0.5">
              <Link
                href={SIDEBAR_SETTINGS.href}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-300 transition-colors hover:bg-white/5 hover:text-zinc-100"
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/5 text-zinc-400">
                  <Settings size={14} />
                </span>
                Account
              </Link>

              <Link
                href={`${SIDEBAR_SETTINGS.href}?tab=ai`}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-300 transition-colors hover:bg-white/5 hover:text-zinc-100"
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/5 text-zinc-400">
                  <CreditCard size={14} />
                </span>
                Billing
              </Link>

              <Link
                href="/dashboard/command-center"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-300 transition-colors hover:bg-white/5 hover:text-zinc-100"
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/5 text-zinc-400">
                  <Bell size={14} />
                </span>
                Notifications
              </Link>

              {/* Rondleiding herstarten — alleen zichtbaar als tour al gedaan is */}
              {tourDone && (
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleReplayTour}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-300 transition-colors hover:bg-orange-500/10 hover:text-orange-300"
                >
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/5 text-zinc-400">
                    <MapPin size={14} />
                  </span>
                  Rondleiding
                </button>
              )}
            </div>

            {/* Separator + logout */}
            <div className="border-t border-white/10 p-1.5">
              <button
                type="button"
                role="menuitem"
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-300 transition-colors hover:bg-rose-500/10 hover:text-rose-300"
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/5 text-zinc-400">
                  <LogOut size={14} />
                </span>
                Log out
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
