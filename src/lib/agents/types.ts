import type { OfferteLijnInput } from "@/lib/offertes";
import type { CreateOfferteInput } from "@/app/dashboard/offertes/actions";

export type AgentActionType =
  | "create_offerte"
  | "send_offerte"
  | "send_quote_followup"
  | "create_invoice_from_offerte"
  | "send_payment_reminder"
  | "send_formal_notice"
  | "forward_to_bailiff"
  | "propose_chat_sanction"
  | "propose_werkpost_match"
  | "propose_materiaal_zoek"
  | "propose_geschil_samenvatting";

export type ProposeMateriaalvoorraadPayload = {
  query: string;
  regio?: string | null;
  hits: Array<{
    prijsId: string;
    winkelNaam: string;
    productnaam: string;
    prijs: number;
    eenheid: string;
    gecontroleerdOp: string;
    btwStatus: string;
    isStale: boolean;
  }>;
};

export type ProposeGeschilSamenvattingPayload = {
  geschilId: string;
  samenvatting: string;
};

export type ProposeChatSanctionPayload = {
  bedrijfId: number;
  sanctionType: "waarschuwing" | "schorsing_tijdelijk" | "schorsing_lang" | "blokkade";
  reden: string;
  channelId: string;
  messageId?: string | null;
  findings?: Array<{ category: string; severity: string; detail: string }>;
};

export type ProposeWerkpostMatchPayload = {
  companyId: number;
  werkpostId: string;
  werkpostTitel: string;
  regio: string;
  aardVanWerk: string;
  draftMessage: string;
};

export type SendQuoteFollowupPayload = {
  offerteId: number;
  draftMessage: string;
  recipientEmail?: string | null;
  channel?: "email" | "whatsapp";
  _meta?: Record<string, unknown>;
};

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
