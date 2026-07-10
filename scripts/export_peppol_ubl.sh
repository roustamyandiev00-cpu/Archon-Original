#!/usr/bin/env bash
# Download UBL XML voor een factuur.
# Vereist: Next.js dev server + ingelogde sessie in browser.
# Gebruik: ./scripts/export_peppol_ubl.sh [factuur_id]
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FACTUUR_ID="${1:-1}"
OUT="$ROOT/exports/peppol-factuur-${FACTUUR_ID}.xml"
SITE="${NEXT_PUBLIC_SITE_URL:-http://localhost:3000}"

mkdir -p "$ROOT/exports"

echo "Peppol UBL export — factuur $FACTUUR_ID"
echo ""

if ! curl -sf -o /dev/null --max-time 2 "$SITE" 2>/dev/null; then
  echo "Dev server draait niet op $SITE"
  echo ""
  echo "Start eerst:"
  echo "  pnpm dev"
  echo ""
  echo "Log in op het dashboard, open dan in je browser:"
  echo "  $SITE/dashboard/facturen/$FACTUUR_ID/peppol"
  echo ""
  echo "Of export JSON-data (geen login nodig):"
  echo "  source .venv/bin/activate && python scripts/export_peppol_bundle.py $FACTUUR_ID"
  exit 1
fi

HTTP=$(curl -s -o "$OUT" -w "%{http_code}" \
  "$SITE/dashboard/facturen/$FACTUUR_ID/peppol" \
  -H "Accept: application/xml")

if [[ "$HTTP" == "200" ]] && head -1 "$OUT" | grep -qE '^<\?xml|<Invoice|<CreditNote'; then
  echo "UBL opgeslagen: $OUT"
  head -5 "$OUT"
  exit 0
fi

rm -f "$OUT"
echo "Download mislukt (HTTP $HTTP)."
echo ""
echo "De UBL-route vereist een ingelogde sessie."
echo "Open in Chrome (waar je bent ingelogd):"
echo "  $SITE/dashboard/facturen/$FACTUUR_ID/peppol"
echo ""
echo "Alternatief — JSON Peppol-bundle:"
echo "  source .venv/bin/activate && python scripts/export_peppol_bundle.py $FACTUUR_ID"
exit 1
