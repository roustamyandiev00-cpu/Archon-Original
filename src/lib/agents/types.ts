import type { OfferteLijnInput } from "@/lib/offertes";
import type { CreateOfferteInput } from "@/app/dashboard/offertes/actions";

export type AgentActionType =
  | "create_offerte"
  | "send_offerte"
  | "create_invoice_from_offerte"
  | "send_payment_reminder"
  | "send_formal_notice"
  | "forward_to_bailiff";

export type IncassoStage =
  | "herinnering"
  | "aanmaning"
  | "ingebrekestelling"
  | "deurwaarder";

export type SendPaymentReminderPayload = {
  factuurId: number;
  stage: IncassoStage;
};

export type CreateOffertePayload = CreateOfferteInput & {
  description?: string;
};

export type SendOffertePayload = {
  offerteId: number;
  recipientEmail?: string | null;
};

export type CreateInvoiceFromOffertePayload = {
  offerteId: number;
};

export type NovaOfferteDraft = {
  klant: string;
  notes: string;
  lines: OfferteLijnInput[];
  summary: string;
};

export type AgentExecutionResult = {
  ok: true;
  offerteId?: number;
  factuurId?: number;
  route?: string;
};
