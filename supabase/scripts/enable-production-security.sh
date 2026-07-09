#!/usr/bin/env bash
# Zet productie-beveiliging aan via Supabase Management API.
# Vereist: Pro-plan of hoger voor leaked password protection + PITR.
set -euo pipefail

PROJECT_REF="${PROJECT_REF:-vqiyftyqfpfbpwhadpvn}"
API="https://api.supabase.com/v1/projects/${PROJECT_REF}"

if [[ -z "${SUPABASE_ACCESS_TOKEN:-}" ]]; then
  echo "Geen SUPABASE_ACCESS_TOKEN gevonden." >&2
  echo "1. Ga naar https://supabase.com/dashboard/account/tokens" >&2
  echo "2. Maak een token aan" >&2
  echo "3. export SUPABASE_ACCESS_TOKEN='sbp_...'" >&2
  echo "   of: supabase login" >&2
  exit 1
fi

auth_header=(-H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" -H "Content-Type: application/json")

echo "==> Project: ${PROJECT_REF}"
echo "==> Huidige auth-config ophalen..."
curl -sS "${auth_header[@]}" "${API}/config/auth" | python3 -m json.tool 2>/dev/null | head -30 || true

echo ""
echo "==> Leaked password protection + wachtwoordsterkte aanzetten..."
AUTH_BODY="$(python3 - <<'PY'
import json
print(json.dumps({
    "password_hibp_enabled": True,
    "password_min_length": 10,
    "password_required_characters": (
        "abcdefghijklmnopqrstuvwxyz:"
        "ABCDEFGHIJKLMNOPQRSTUVWXYZ:"
        "0123456789:"
        "!@#$%^&*()_+-=[]{};\\'\\\\:\"|<>?,./`~"
    ),
}))
PY
)"
curl -sS "${auth_header[@]}" -X PATCH "${API}/config/auth" --data "${AUTH_BODY}" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print('hibp:', d.get('password_hibp_enabled'), '| min_length:', d.get('password_min_length'))" \
  2>/dev/null || echo "Auth-config bijgewerkt."

echo ""
echo "==> Huidige add-ons ophalen..."
curl -sS "${auth_header[@]}" "${API}/billing/addons" | python3 -m json.tool 2>/dev/null | head -40 || true

ENABLE_PITR="${ENABLE_PITR:-}"
if [[ "${ENABLE_PITR}" == "1" ]]; then
  PITR_VARIANT="${PITR_VARIANT:-pitr_7}"
  echo ""
  echo "==> PITR add-on activeren (${PITR_VARIANT})..."
  echo "    Let op: ~\$100/maand voor 7 dagen retentie. Vereist Small compute."
  PITR_BODY="$(python3 -c "import json; print(json.dumps({'addon_type':'pitr','addon_variant':'${PITR_VARIANT}'}))")"
  curl -sS "${auth_header[@]}" -X PATCH "${API}/billing/addons" --data "${PITR_BODY}" \
    | python3 -m json.tool 2>/dev/null || echo "PITR-aanvraag verstuurd."
else
  echo ""
  echo "PITR niet aangezet (standaard). Dagelijkse back-ups zijn inbegrepen op Pro."
  echo "PITR later aanzetten:"
  echo "  ENABLE_PITR=1 ./supabase/scripts/enable-production-security.sh"
  echo "  of via dashboard: https://supabase.com/dashboard/project/${PROJECT_REF}/settings/addons?panel=pitr"
fi

echo ""
echo "==> Beschikbare database-back-ups..."
curl -sS "${auth_header[@]}" "${API}/database/backups" | python3 -m json.tool 2>/dev/null | head -30 || true

echo ""
echo "Klaar. Controleer in Security Advisor:"
echo "https://supabase.com/dashboard/project/${PROJECT_REF}/database/security-advisor"
