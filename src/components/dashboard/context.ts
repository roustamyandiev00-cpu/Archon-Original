import { cache } from "react";
import { cookies } from "next/headers";
import { getCompanyContext } from "@/lib/company";
import {
  PREVIEW_COOKIE,
  TRIAL_DAYS,
  computeTrialStatus,
  type TrialStatus,
} from "@/components/dashboard/trial";

export type DashboardContext = Awaited<ReturnType<typeof getDashboardContext>>;

export async function isPreviewMode() {
  const cookieStore = await cookies();
  return cookieStore.get(PREVIEW_COOKIE)?.value === "1";
}

/** Voorbeeldmodus geldt alleen voor anonieme bezoekers (niet na inloggen). */
export async function isActivePreviewMode() {
  const base = await getCompanyContext();
  if (base.user) return false;
  return isPreviewMode();
}

async function loadTrialStatus(
  supabase: Awaited<ReturnType<typeof getCompanyContext>>["supabase"],
  companyId: number,
): Promise<TrialStatus> {
  const { data } = await supabase
    .from("bedrijven")
    .select("created_at, subscription_status")
    .eq("id", companyId)
    .maybeSingle();

  return computeTrialStatus(data?.created_at, data?.subscription_status);
}

export const getDashboardContext = cache(async function getDashboardContext() {
  const previewCookie = await isPreviewMode();
  const base = await getCompanyContext();

  if (base.user) {
    const trial = base.companyId
      ? await loadTrialStatus(base.supabase, base.companyId)
      : null;
    return { ...base, isPreviewMode: false, trial };
  }

  if (previewCookie) {
    return { ...base, isPreviewMode: true, trial: null };
  }

  return { ...base, isPreviewMode: false, trial: null };
});

type WriteAccessError = { error: string };
type WriteAccessOk = {
  supabase: Awaited<ReturnType<typeof getCompanyContext>>["supabase"];
  user: NonNullable<Awaited<ReturnType<typeof getCompanyContext>>["user"]>;
  companyId: number;
  trial: TrialStatus;
};

export async function requireWriteAccess(): Promise<WriteAccessError | WriteAccessOk> {
  const ctx = await getCompanyContext();

  if (!ctx.user && (await isPreviewMode())) {
    return {
      error:
        "Je bekijkt het dashboard in voorbeeldmodus. Maak een gratis account aan om wijzigingen te doen.",
    };
  }

  if (!ctx.user || !ctx.companyId) {
    return { error: "Geen actief bedrijf gevonden." };
  }

  const trial = await loadTrialStatus(ctx.supabase, ctx.companyId);
  if (trial.expired) {
    return {
      error: `Je gratis proefperiode van ${TRIAL_DAYS} dagen is verlopen. Kies een abonnement om door te gaan.`,
    };
  }

  return { supabase: ctx.supabase, user: ctx.user, companyId: ctx.companyId, trial };
}
