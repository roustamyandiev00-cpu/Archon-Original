#!/usr/bin/env bash
# Supabase REST queries — facturen, offertes, Peppol
# Gebruik: ./scripts/supabase_queries.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -f .env.local ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env.local
  set +a
fi

if [[ -z "${SUPABASE_SERVICE_ROLE_KEY:-}" ]]; then
  echo "Fout: SUPABASE_SERVICE_ROLE_KEY ontbreekt in .env.local" >&2
  exit 1
fi

BASE="${NEXT_PUBLIC_SUPABASE_URL:-https://vqiyftyqfpfbpwhadpvn.supabase.co}/rest/v1"
KEY="$SUPABASE_SERVICE_ROLE_KEY"

fetch() {
  local label="$1"
  local path="$2"
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "▶ $label"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  curl -s "$BASE/$path" \
    -H "apikey: $KEY" \
    -H "Authorization: Bearer $KEY" \
    -H "Accept: application/json"
  echo ""
}

echo "ArchonPro — Supabase REST queries"
echo "Project: $BASE"

fetch "FACTUREN (laatste 5)" \
  "facturen?select=id,nummer,klant,totaal_bedrag,status,peppol_status,peppol_sent_at,peppol_last_error&order=id.desc&limit=5"

fetch "FACTUUR + LIJNEN (Peppol testfactuur)" \
  "facturen?select=id,nummer,klant,totaal_bedrag,status,peppol_status,factuur_lijnen(id,omschrijving,aantal,prijs_per_eenheid,btw_percentage)&id=eq.1"

fetch "OFFERTES (laatste 5)" \
  "offertes?select=id,nummer,klant,bedrag,status,status_new,sent_at,accepted_at&order=id.desc&limit=5"

fetch "OFFERTE + LIJNEN (OFF-2026-0001)" \
  "offertes?select=id,nummer,klant,bedrag,status,offerte_lijnen(id,omschrijving,aantal,prijs_per_eenheid,btw_percentage)&nummer=eq.OFF-2026-0001"

fetch "PEPPOL VERZENDINGEN" \
  "peppol_transmissions?select=id,factuur_id,direction,status,access_point,message_id,error_message,created_at&order=id.desc&limit=10"

fetch "PEPPOL INBOX (inkomend)" \
  "peppol_inbox?select=id,document_type,supplier_name,invoice_number,total_amount,currency,status,received_at&order=id.desc&limit=10"

fetch "KLANTEN MET PEPPOL-GEGEVENS" \
  "customers?select=id,name,company_name,email,btw,ondernemingsnummer,peppol_participant_id&or=(peppol_participant_id.not.is.null,btw.not.is.null)&order=name.asc&limit=10"

fetch "E-FACTURATIE INSTELLINGEN PER BEDRIJF" \
  "company_einvoicing_settings?select=bedrijf_id,is_enabled,provider_id,environment,auto_send,peppol_endpoint_url&limit=10"

echo ""
echo "Klaar."
