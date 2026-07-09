"use server";

import { revalidatePath } from "next/cache";
import { requireWriteAccess } from "@/components/dashboard/context";
import { statusMeta, formatEuro } from "@/lib/offertes";

function toWhatsappNumber(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits.slice(1);
  if (digits.startsWith("00")) return digits.slice(2);
  if (digits.startsWith("0")) return "32" + digits.slice(1);
  return digits;
}

function randomToken() {
  return crypto.randomUUID().replace(/-/g, "");
}

export async function markOfferteSent(
  offerteId: number,
  opts?: { recipientEmail?: string | null; channel?: string },
) {
  const access = await requireWriteAccess();
  if ("error" in access) return { error: access.error };
  const { supabase, user, companyId } = access;

  const { data: offerte } = await supabase
    .from("offertes")
    .select(
      "id, nummer, klant, bedrag, status_new, public_token, customer_id",
    )
    .eq("id", offerteId)
    .eq("bedrijf_id", companyId)
    .maybeSingle();

  if (!offerte) return { error: "Offerte niet gevonden." };

  let customerEmail: string | null = opts?.recipientEmail ?? null;
  let customerPhone: string | null = null;

  if (offerte.customer_id) {
    const { data: customer } = await supabase
      .from("customers")
      .select("email, phone")
      .eq("id", offerte.customer_id)
      .eq("company_id", companyId)
      .maybeSingle();
    customerEmail = customerEmail || customer?.email || null;
    customerPhone = customer?.phone || null;
  }

  const token = offerte.public_token || randomToken();
  const now = new Date().toISOString();

  const { error: updateError } = await supabase
    .from("offertes")
    .update({
      status_new: "verzonden",
      status: statusMeta("verzonden").label,
      sent_at: now,
      public_token: token,
      token_expires_at: new Date(
        Date.now() + 90 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      updated_at: now,
    })
    .eq("id", offerteId)
    .eq("bedrijf_id", companyId);

  if (updateError) return { error: updateError.message };

  const recipient = customerEmail || "onbekend@klant.be";
  await supabase.from("offerte_email_log").insert({
    bedrijf_id: companyId,
    offerte_id: offerteId,
    recipient_email: recipient,
    sent_by: user.id,
    status: opts?.channel === "agent" ? "agent_marked" : "shared",
  });

  await supabase.rpc("log_offerte_activity", {
    p_offerte_id: offerteId,
    p_company_id: companyId,
    p_activity_type: "sent",
    p_old_status: offerte.status_new ?? undefined,
    p_new_status: "verzonden",
    p_performed_by: user.id,
    p_metadata: { channel: opts?.channel ?? "manual" },
  });

  revalidatePath("/dashboard/offertes");
  revalidatePath(`/dashboard/offertes/${offerteId}`);
  return { ok: true };
}

export async function sendOfferteShare(offerteId: number) {
  const access = await requireWriteAccess();
  if ("error" in access) return { error: access.error };
  const { supabase, companyId } = access;

  const { data: offerte } = await supabase
    .from("offertes")
    .select("id, nummer, klant, bedrag, customer_id")
    .eq("id", offerteId)
    .eq("bedrijf_id", companyId)
    .maybeSingle();

  if (!offerte) return { error: "Offerte niet gevonden." };

  let email: string | null = null;
  let phone: string | null = null;
  if (offerte.customer_id) {
    const { data: customer } = await supabase
      .from("customers")
      .select("email, phone")
      .eq("id", offerte.customer_id)
      .eq("company_id", companyId)
      .maybeSingle();
    email = customer?.email ?? null;
    phone = customer?.phone ?? null;
  }

  const mark = await markOfferteSent(offerteId, {
    recipientEmail: email,
    channel: "share",
  });
  if ("error" in mark && mark.error) return { error: mark.error };

  const nummer = offerte.nummer ?? `#${offerte.id}`;
  const klant = offerte.klant ?? "klant";
  const bedragTekst =
    offerte.bedrag != null
      ? ` ter waarde van ${formatEuro(offerte.bedrag)}`
      : "";
  const bericht = `Beste ${klant},\n\nHierbij offerte ${nummer}${bedragTekst}. Heeft u nog vragen, laat het gerust weten.\n\nMet vriendelijke groet`;

  const pdfUrl = `/dashboard/offertes/${offerteId}/pdf`;
  const mailtoUrl = email
    ? `mailto:${email}?subject=${encodeURIComponent(`Offerte ${nummer}`)}&body=${encodeURIComponent(bericht)}`
    : null;
  const whatsappUrl = phone
    ? `https://wa.me/${toWhatsappNumber(phone)}?text=${encodeURIComponent(bericht)}`
    : null;

  return {
    ok: true,
    pdfUrl,
    mailtoUrl,
    whatsappUrl,
    nummer,
    klant,
  };
}
