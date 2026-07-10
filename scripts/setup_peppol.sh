#!/usr/bin/env bash
# Peppol/Storecove setup-check en exports
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "=== 1/3 Supabase queries ==="
./scripts/supabase_queries.sh | tail -20

echo ""
echo "=== 2/3 Peppol bundle export ==="
source .venv/bin/activate
python scripts/export_peppol_bundle.py "${1:-1}"

echo ""
echo "=== 3/4 Storecove sync (optioneel) ==="
if [[ -n "${STORECOVE_API_KEY:-}" && -n "${STORECOVE_LEGAL_ENTITY_ID:-}" ]]; then
  python scripts/sync_storecove_from_env.py
else
  set -a
  # shellcheck disable=SC1091
  source .env.local 2>/dev/null || true
  set +a
  if [[ -n "${STORECOVE_API_KEY:-}" && -n "${STORECOVE_LEGAL_ENTITY_ID:-}" ]]; then
    python scripts/sync_storecove_from_env.py
  else
    echo "Overgeslagen — geen Storecove keys in .env.local."
    echo "  → UBL download/generatie werkt wel (stap 4)."
    echo "  → Voor automatisch versturen: STORECOVE_API_KEY + STORECOVE_LEGAL_ENTITY_ID invullen."
  fi
fi

echo ""
echo "=== 4/4 UBL XML genereren (lokaal) ==="
set -a
# shellcheck disable=SC1091
source .env.local 2>/dev/null || true
set +a
if npx --yes tsx scripts/generate-peppol-ubl.ts "${1:-1}"; then
  :
else
  echo "UBL generatie mislukt."
  echo "Browser-alternatief: http://localhost:3000/dashboard/facturen/${1:-1}/peppol"
fi

echo ""
echo "Klaar."
